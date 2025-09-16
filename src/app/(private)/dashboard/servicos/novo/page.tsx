"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where, addDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDateToBrazilian } from "@/utils/formater/date";
import { ArrowLeft, User, Phone, Mail, FileText, DollarSign, Clock, CalendarIcon, CreditCard, Upload, Paperclip, Plus, Trash2 } from "lucide-react";
import { CustomModalServices } from "@/components/CustomModalServices";
import { CustomModalProfessionals } from "@/components/CustomModalProfessionals";
import { CustomModalClients } from "@/components/CustomModalClients";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { dataMask, dataUnMask, horaMask, horaUnMask, phoneMask, cpfMask, formatCurrencyFromCents, currencyMask, cpfUnMask, celularMask, celularUnMask } from "@/utils/maks/masks";
import { z } from "zod";

// Schemas de validação
const clientSchema = z.object({
  name: z.string().min(1, "Nome completo é obrigatório"),
  phone: z.string().min(11, "Telefone é obrigatório"),
  email: z.string().optional(),
  cpf: z.string().optional(),
});

const procedureSchema = z.object({
  procedureName: z.string().optional(),
  professionalName: z.string().optional(),
  date: z.date({ required_error: "Data é obrigatória" }).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  price: z.string().optional(),
  observations: z.string().optional(),
});

const paymentSchema = z.object({
  paymentType: z.enum(["total", "partial"], { required_error: "Tipo de pagamento é obrigatório" }),
  paymentMethod: z.string().min(1, "Método de pagamento é obrigatório"),
  totalValue: z.string().min(1, "Valor total é obrigatório"),
  paidValue: z.string().optional(),
});

const observationsSchema = z.object({
  observations: z.string().optional(),
  beforePhotos: z.array(z.object({
    url: z.string(),
    description: z.string().optional()
  })).optional(),
  afterPhotos: z.array(z.object({
    url: z.string(),
    description: z.string().optional()
  })).optional(),
  documents: z.array(z.object({
    url: z.string(),
    description: z.string().optional()
  })).optional(),
});

// Interfaces
interface ClientData {
  name: string;
  phone: string;
  email: string;
  cpf: string;
}

interface ProcedureData {
  procedureName: string;
  professionalName: string;
  date: Date;
  startTime: string;
  endTime: string;
  price: string;
  observations: string;
}

interface PaymentData {
  paymentType: "total" | "partial";
  paymentMethod: string;
  totalValue: string;
  paidValue: string;
}

interface ObservationsData {
  observations: string;
  beforePhotos: Array<{ url: string; description?: string }>;
  afterPhotos: Array<{ url: string; description?: string }>;
  documents: Array<{ url: string; description?: string }>;
}

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface Procedure {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

interface Professional {
  id: string;
  name: string;
  cpfCnpj: string;
  phone: string;
  email: string;
  address: string;
  observations: string;
  registrationNumber: string;
  specialty: string;
  imageUrl?: string;
}

type ServiceType = "budget" | "complete";

// Função para carregar valores do banco para campos de formulário
const formatCurrency = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === 0) return '';
  
  let numericValue: number;
  
  // Se for número, usa o valor diretamente
  if (typeof value === 'number') {
    numericValue = value;
  } else {
    // Se for string, converte para número
    numericValue = Number(String(value).replace(/\D/g, ''));
  }
  
  if (numericValue === 0) return '';
  
  // Para valores que vêm do banco em centavos, dividimos por 100
  // Mas apenas se o valor for muito grande (indicando que está em centavos)
  if (numericValue > 100000) {
    numericValue = numericValue / 100;
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
};

// Função específica para formatar valores de pagamento do banco
const formatPaymentValue = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === 0) return '';
  
  let numericValue: number;
  
  if (typeof value === 'number') {
    numericValue = value;
  } else {
    numericValue = Number(String(value).replace(/\D/g, ''));
  }
  
  if (numericValue === 0) return '';
  
  // Valores de pagamento do banco estão em centavos, então dividimos por 100
  numericValue = numericValue / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue);
};

export default function NewService() {
  const [currentStep, setCurrentStep] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>("budget");
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showProfessionalsModal, setShowProfessionalsModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [payments, setPayments] = useState<Array<{
    method: "dinheiro" | "pix" | "cartao" | "boleto";
    value: string;
    date: string;
    installments?: number;
  }>>([]);
  const [currentPaymentIndex, setCurrentPaymentIndex] = useState(-1);
  const [newPayment, setNewPayment] = useState({
    method: "dinheiro" as "dinheiro" | "pix" | "cartao" | "boleto",
    value: "",
    date: new Date().toISOString().split('T')[0], // Mantido para compatibilidade com o banco
    installments: undefined as number | undefined,
  });
  const [paymentType, setPaymentType] = useState<"total" | "partial">("total");
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'document' | 'before' | 'after' | null>(null);
  const [clientImageInfo, setClientImageInfo] = useState<{
    existing: number;
    remaining: number;
    limit: number;
  } | null>(null);

  const { user } = useAuthContext();
  const { planLimits, canAddImageToClient, getRemainingImagesForClient } = usePlanLimitations();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  const contactIdParam = searchParams.get('contactId');

  // Formulários
  const clientForm = useForm<ClientData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      cpf: "",
    },
  });

  const procedureForm = useForm<ProcedureData>({
    resolver: zodResolver(procedureSchema),
    defaultValues: {
      procedureName: "",
      professionalName: "",
      date: new Date(),
      startTime: "",
      endTime: "",
      price: "",
      observations: "",
    },
  });

  const paymentForm = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentType: "total",
      paymentMethod: "",
      totalValue: "",
      paidValue: "",
    },
  });

  const observationsForm = useForm<ObservationsData>({
    resolver: zodResolver(observationsSchema),
    defaultValues: {
      observations: "",
      beforePhotos: [],
      afterPhotos: [],
      documents: [],
    },
  });

  // Carregar dados
  useEffect(() => {
    if (uid) {
      loadServices();
      loadProcedures();
      loadProfessionals();
    }
  }, [uid]);

  // Carregar dados do serviço se estiver editando
  useEffect(() => {
    if (serviceId && uid) {
      loadServiceData();
    }
  }, [serviceId, uid]);

  // Definir contactId se vier da URL
  useEffect(() => {
    if (contactIdParam) {
      setContactId(contactIdParam);
      setSelectedClientId(contactIdParam);
    }
  }, [contactIdParam]);

  // Definir pagamento total como padrão quando entrar na terceira etapa
  useEffect(() => {
    if (currentStep === 3 && serviceType === "complete") {
      const totalPrice = parseFloat(procedureForm.getValues('price')?.replace(/[^\d,]/g, '').replace(',', '.') || '0');
      if (totalPrice > 0) {
        setPaymentType("total");
        setNewPayment(prev => ({
          ...prev,
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice / 100)
        }));
      }
    }
  }, [currentStep, serviceType, procedureForm]);

  // Carregar procedimento e profissional selecionados quando os arrays estiverem disponíveis
  useEffect(() => {
    if (serviceId && procedures.length > 0 && professionals.length > 0) {
      const loadSelectedItems = async () => {
        try {
          const docRef = doc(database, "Services", serviceId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Carregar procedimento selecionado
            if (data.services?.[0]) {
              const selectedProc = procedures.find(p => p.id === data.services[0].id);
              if (selectedProc) {
                setSelectedProcedure(selectedProc);
                procedureForm.setValue("procedureName", selectedProc.name);
                procedureForm.setValue("price", formatCurrencyFromCents(selectedProc.price));
              }
            }
            
            // Carregar profissional selecionado
            if (data.professionals?.[0]) {
              const selectedProf = professionals.find(p => p.id === data.professionals[0].id);
              if (selectedProf) {
                setSelectedProfessional(selectedProf);
                procedureForm.setValue("professionalName", selectedProf.name);
              }
            }
          }
        } catch (error) {
          console.error("Erro ao carregar itens selecionados:", error);
        }
      };
      
      loadSelectedItems();
    }
  }, [serviceId, procedures, professionals, procedureForm]);

  const loadServices = async () => {
    try {
      const servicesRef = collection(database, "Services");
      const q = query(servicesRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
      setServices(servicesData);
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
    }
  };

  const loadProcedures = async () => {
    try {
      const proceduresRef = collection(database, "Procedures");
      const q = query(proceduresRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      const proceduresData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Procedure[];
      setProcedures(proceduresData);
    } catch (error) {
      console.error("Erro ao carregar procedimentos:", error);
    }
  };

  const loadProfessionals = async () => {
    try {
      console.log("Carregando profissionais para UID:", uid);
      // Tentar diferentes nomes de coleção
      const collections = ["Profissionals", "Professionals", "professionals", "Profissionais"];
      
      for (const collectionName of collections) {
        try {
          const professionalsRef = collection(database, collectionName);
          const q = query(professionalsRef, where("uid", "==", uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const professionalsData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Professional[];
            console.log(`Profissionais carregados da coleção ${collectionName}:`, professionalsData);
            setProfessionals(professionalsData);
            return; // Se encontrou dados, para de tentar outras coleções
          }
        } catch (error) {
          console.log(`Erro ao tentar coleção ${collectionName}:`, error);
        }
      }
      
      console.log('Nenhum profissional encontrado em nenhuma coleção');
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error);
    }
  };

  const loadServiceData = async () => {
    if (!serviceId || !uid) return;
    
    try {
      const docRef = doc(database, "Services", serviceId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Dados carregados do serviço:", data);
        
        // Carregar dados do cliente
        clientForm.reset({
          name: data.name || "",
          cpf: cpfMask(data.cpf || ""),
          phone: celularMask(data.phone || ""),
          email: data.email || "",
        });
        
        // Carregar dados do procedimento
        let procedureDate = new Date();
        if (data.date) {
          if (data.date.includes('/')) {
            // Formato DD/MM/YYYY
            const [day, month, year] = data.date.split('/');
            procedureDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else if (data.date.includes('T')) {
            // Formato ISO
            procedureDate = new Date(data.date);
          } else {
            // Formato YYYY-MM-DD
            procedureDate = new Date(data.date + 'T00:00:00');
          }
        }
          
        procedureForm.reset({
          procedureName: data.services?.[0]?.name || "",
          professionalName: data.professionals?.[0]?.name || "",
          date: procedureDate,
          startTime: data.time || "",
          endTime: "",
          price: data.price ? formatCurrencyFromCents(data.price) : "",
          observations: data.observations || "",
        });
        
        // Carregar pagamentos
        if (data.payments && data.payments.length > 0) {
          const formattedPayments = data.payments.map((p: any) => ({
            method: p.method,
            value: formatPaymentValue(p.value),
            date: p.date,
            installments: p.installments || undefined
          }));
          setPayments(formattedPayments);
        }
        
        // Carregar observações
        observationsForm.reset({
          observations: data.observations || "",
          beforePhotos: data.beforePhotos || [],
          afterPhotos: data.afterPhotos || [],
          documents: data.documents || [],
        });
        
        // Os procedimentos e profissionais serão carregados pelo useEffect separado
        
        setSelectedClientId(data.contactUid || null);
        setContactId(data.contactUid || null);
        
        // Definir tipo de serviço
        setServiceType(data.budget ? "budget" : "complete");
        
        console.log("Formulário resetado com os dados carregados.");
      }
    } catch (error) {
      console.error("Erro ao carregar dados do serviço:", error);
      toast.error("Erro ao carregar dados do serviço!");
    }
  };

  // Função para criar ou atualizar cliente com verificação de limitações
  const createOrUpdateClientWithLimitations = async (clientName: string, clientCpf: string, clientPhone: string, clientEmail: string): Promise<string | null> => {
    if (!uid) return null;
    
    try {
      const contactsRef = collection(database, "Contacts");
      
      let clientExists = false;
      let existingClientId = null;
      
      // Verificar se cliente já existe pelo CPF
      if (clientCpf) {
        const cpfQuery = query(contactsRef, where("cpf", "==", clientCpf));
        const cpfSnapshot = await getDocs(cpfQuery);
        
        if (!cpfSnapshot.empty) {
          clientExists = true;
          existingClientId = cpfSnapshot.docs[0].id;
          console.log("Cliente encontrado pelo CPF");
        }
      }
      
      // Verificar se cliente já existe pelo telefone
      if (!clientExists && clientPhone) {
        const phoneQuery = query(contactsRef, where("phone", "==", clientPhone));
        const phoneSnapshot = await getDocs(phoneQuery);
        
        if (!phoneSnapshot.empty) {
          clientExists = true;
          existingClientId = phoneSnapshot.docs[0].id;
          console.log("Cliente encontrado pelo telefone");
        }
      }
      
      // Verificar se cliente já existe pelo nome
      if (!clientExists && clientName) {
        const nameQuery = query(contactsRef, where("name", "==", clientName));
        const nameSnapshot = await getDocs(nameQuery);
        
        if (!nameSnapshot.empty) {
          clientExists = true;
          existingClientId = nameSnapshot.docs[0].id;
          console.log("Cliente encontrado pelo nome");
          
          // Atualizar dados do cliente existente
          const existingClientDoc = nameSnapshot.docs[0];
          const existingClientData = existingClientDoc.data();
          let needsUpdate = false;
          
          if (clientCpf && !existingClientData.cpf) {
            needsUpdate = true;
          }
          
          if (clientPhone && !existingClientData.phone) {
            needsUpdate = true;
          }
          
          if (clientEmail && !existingClientData.email) {
            needsUpdate = true;
          }
          
          if (needsUpdate) {
            try {
              await updateDoc(existingClientDoc.ref, {
                cpf: clientCpf || existingClientData.cpf || "",
                phone: clientPhone || existingClientData.phone || "",
                email: clientEmail || existingClientData.email || "",
                updatedAt: new Date().toISOString()
              });
              console.log("Dados do cliente atualizados");
              toast.info("Dados do cliente atualizados", {
                position: "top-center",
                autoClose: 2000,
              });
            } catch (error) {
              console.error("Erro ao atualizar dados do cliente:", error);
            }
          }
        }
      }
      
      // Criar novo cliente se não existir
      if (!clientExists) {
        console.log("Cliente não encontrado. Criando novo cliente...");
        
        // Nota: Não bloqueamos a criação automática de clientes aqui
        // As limitações de imagens serão aplicadas quando o cliente for usado
        
        const newContactRef = doc(collection(database, "Contacts"));
        
        const newContactData = {
          name: clientName,
          cpf: clientCpf,
          phone: clientPhone,
          email: clientEmail || "",
          uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        try {
          await setDoc(newContactRef, newContactData);
          console.log("Novo cliente criado com ID:", newContactRef.id);
          toast.info("Novo cliente adicionado ao sistema", {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          return newContactRef.id;
        } catch (error: any) {
          console.error("Erro ao criar cliente:", error);
          toast.error("Não foi possível adicionar o cliente automaticamente, mas o serviço será salvo", {
            position: "top-center",
            autoClose: 5000,
          });
          return null;
        }
      } else {
        console.log("Cliente já existe, não é necessário criar.");
        return existingClientId;
      }
    } catch (error) {
      console.error("Erro ao processar cliente:", error);
      return null;
    }
  };

  // Handlers
  const handleClientSubmit = async (data: ClientData) => {
    // Criar ou atualizar cliente automaticamente
    if (data.name && (data.cpf || data.phone)) {
      const contactUid = await createOrUpdateClientWithLimitations(
        data.name, 
        data.cpf || "", 
        data.phone, 
        data.email || ""
      );
      
      // Definir o contactId para aplicar limitações de imagens
      if (contactUid) {
        setSelectedClientId(contactUid);
        setContactId(contactUid);
        
        // Verificar e mostrar status de imagens do cliente criado
        if (planLimits) {
          try {
            const servicesRef = collection(database, "Services");
            const q = query(
              servicesRef,
              where("uid", "==", uid),
              where("contactUid", "==", contactUid)
            );
            
            const querySnapshot = await getDocs(q);
            let existingImages = 0;
            
            querySnapshot.docs.forEach(doc => {
              const data = doc.data();
              const beforeCount = data.beforePhotos?.length || 0;
              const afterCount = data.afterPhotos?.length || 0;
              existingImages += beforeCount + afterCount;
            });

            const remaining = Math.max(0, planLimits.images - existingImages);
            
            // Armazenar informações do cliente
            setClientImageInfo({
              existing: existingImages,
              remaining: remaining,
              limit: planLimits.images
            });
            
            if (existingImages >= planLimits.images) {
              toast.warning(`Cliente ${data.name} já atingiu o limite de ${planLimits.images} imagens do plano ${planLimits.planName}. Não é possível adicionar mais imagens.`);
            } else if (remaining <= 2) {
              toast.info(`Cliente ${data.name} tem ${existingImages}/${planLimits.images} imagens. Restam apenas ${remaining} imagens disponíveis.`);
            } else {
              toast.success(`Cliente ${data.name} tem ${existingImages}/${planLimits.images} imagens. Restam ${remaining} imagens disponíveis.`);
            }
          } catch (error) {
            console.error('Erro ao verificar imagens do cliente:', error);
          }
        }
      }
    }
    
    setCurrentStep(2);
  };

  const handleProcedureSubmit = (data: ProcedureData) => {
    console.log("Dados do procedimento:", data);
    console.log("Profissional selecionado:", selectedProfessional);
    console.log("Procedimento selecionado:", selectedProcedure);
    console.log("Erros do formulário:", procedureForm.formState.errors);
    
    // Validação customizada
    if (!selectedProcedure) {
      toast.error("Selecione um procedimento");
      return;
    }
    
    if (!selectedProfessional) {
      toast.error("Selecione um profissional");
      return;
    }
    
    if (serviceType === "budget") {
      setCurrentStep(3); // Revisão do orçamento
    } else {
      setCurrentStep(3); // Pagamento e Financeiro
    }
  };

  const handlePaymentSubmit = (data: PaymentData) => {
    setCurrentStep(4); // Observações e Anexo
  };

  const handleObservationsSubmit = (data: ObservationsData) => {
    setCurrentStep(5); // Revisão e Confirmação
  };

  // Função para verificar limite de imagens do cliente
  const checkClientImageLimit = async (contactId: string, newImagesToAdd: number): Promise<boolean> => {
    if (!uid || !planLimits) {
      console.log('⚠️ Verificação de limite ignorada:', { uid: !!uid, planLimits: !!planLimits });
      return true;
    }
    
    try {
      console.log('🔍 Iniciando verificação de limite:', { contactId, newImagesToAdd, planLimits });
      
      // Buscar serviços existentes do cliente
      const servicesRef = collection(database, "Services");
      const q = query(
        servicesRef,
        where("uid", "==", uid),
        where("contactUid", "==", contactId)
      );
      
      const querySnapshot = await getDocs(q);
      let existingImages = 0;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const beforeCount = data.beforePhotos?.length || 0;
        const afterCount = data.afterPhotos?.length || 0;
        existingImages += beforeCount + afterCount;
      });
      
      console.log('🔍 Imagens existentes encontradas:', existingImages);

      // Se estamos editando um serviço existente, não contar as imagens desse serviço
      if (serviceId) {
        const currentServiceRef = doc(database, "Services", serviceId);
        const currentServiceDoc = await getDoc(currentServiceRef);
        if (currentServiceDoc.exists()) {
          const currentServiceData = currentServiceDoc.data();
          const currentServiceImages = (currentServiceData.beforePhotos?.length || 0) + 
                                     (currentServiceData.afterPhotos?.length || 0);
          existingImages -= currentServiceImages;
        }
      }
      
      const totalAfterAdding = existingImages + newImagesToAdd;
      
      console.log('🔍 Cálculo final:', { existingImages, newImagesToAdd, totalAfterAdding, limit: planLimits.images });
      
      if (totalAfterAdding > planLimits.images) {
        const remaining = Math.max(0, planLimits.images - existingImages);
        console.log('❌ Limite excedido!', { remaining });
        toast.error(`Limite de ${planLimits.images} imagens por cliente atingido! Este cliente já tem ${existingImages} imagens. Você pode adicionar mais ${remaining} imagens. Faça upgrade para adicionar mais imagens.`);
        return false;
      }
      
      console.log('✅ Upload permitido');
      return true;
    } catch (error) {
      console.error('Erro ao verificar limite de imagens:', error);
      return true; // Em caso de erro, permitir upload
    }
  };

  // Função para upload de arquivos
  const handleFileUpload = async (files: FileList | null, type: 'before' | 'after' | 'document') => {
    if (!files || files.length === 0 || !uid) return;
    
    // Verificar limite apenas para imagens (before e after), não para documentos
    if ((type === 'before' || type === 'after') && contactId) {
      console.log('🔍 Verificando limite de imagens:', { contactId, filesLength: files.length, planLimits });
      const canUpload = await checkClientImageLimit(contactId, files.length);
      console.log('🔍 Resultado da verificação:', canUpload);
      if (!canUpload) {
        return;
      }
    } else {
      console.log('⚠️ Não verificando limite:', { type, contactId, hasFiles: !!files });
    }
    
    setIsUploading(true);
    try {
      const uploadedFiles: { url: string; description?: string }[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const timestamp = Date.now() + i; // Adiciona i para evitar conflitos de timestamp
        const storageRef = ref(storage, `services/${uid}/${timestamp}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        uploadedFiles.push({
          url: downloadURL,
          description: ''
        });
      }
      
      if (type === 'before') {
        observationsForm.setValue('beforePhotos', [
          ...(observationsForm.getValues('beforePhotos') || []),
          ...uploadedFiles
        ]);
      } else if (type === 'after') {
        observationsForm.setValue('afterPhotos', [
          ...(observationsForm.getValues('afterPhotos') || []),
          ...uploadedFiles
        ]);
      } else if (type === 'document') {
        observationsForm.setValue('documents', [
          ...(observationsForm.getValues('documents') || []),
          ...uploadedFiles
        ]);
      }
      
      toast.success(`${uploadedFiles.length} arquivo(s) enviado(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload dos arquivos!');
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  // Função para remover arquivos
  const handleRemoveFile = (type: 'before' | 'after' | 'document', index: number) => {
    if (type === 'before') {
      const currentPhotos = observationsForm.getValues('beforePhotos') || [];
      observationsForm.setValue('beforePhotos', currentPhotos.filter((_, i) => i !== index));
    } else if (type === 'after') {
      const currentPhotos = observationsForm.getValues('afterPhotos') || [];
      observationsForm.setValue('afterPhotos', currentPhotos.filter((_, i) => i !== index));
    } else if (type === 'document') {
      const currentDocs = observationsForm.getValues('documents') || [];
      observationsForm.setValue('documents', currentDocs.filter((_, i) => i !== index));
    }
  };

  const handleServiceSelect = (selectedServiceIds: string[]) => {
    if (selectedServiceIds.length > 0) {
      const selectedService = procedures.find(p => p.id === selectedServiceIds[0]);
      if (selectedService) {
        setSelectedProcedure(selectedService);
        procedureForm.setValue("procedureName", selectedService.name);
        procedureForm.setValue("price", String(selectedService.price));
        // Trigger validation
        procedureForm.trigger();
      }
    }
    setShowServicesModal(false);
  };

  const handleProfessionalSelect = (selectedProfessionalIds: string[]) => {
    console.log("IDs selecionados:", selectedProfessionalIds);
    console.log("Lista de profissionais:", professionals);
    
    if (selectedProfessionalIds.length > 0) {
      const selectedProfessional = professionals.find(p => p.id === selectedProfessionalIds[0]);
      console.log("Profissional encontrado:", selectedProfessional);
      
      if (selectedProfessional) {
        setSelectedProfessional(selectedProfessional);
        procedureForm.setValue("professionalName", selectedProfessional.name);
        console.log("Valor definido no formulário:", selectedProfessional.name);
        // Trigger validation
        procedureForm.trigger();
      } else {
        console.error("Profissional não encontrado com ID:", selectedProfessionalIds[0]);
      }
    }
    setShowProfessionalsModal(false);
  };

  const handleClientSelect = async (client: any) => {
    // Implementar seleção de cliente existente
    clientForm.setValue("name", client.name);
    clientForm.setValue("phone", client.phone);
    clientForm.setValue("email", client.email);
    clientForm.setValue("cpf", client.cpf);
    setSelectedClientId(client.id);
    setContactId(client.id);
    setShowClientsModal(false);
    
    // Verificar e mostrar status de imagens do cliente
    if (planLimits && client.id) {
      try {
        const servicesRef = collection(database, "Services");
        const q = query(
          servicesRef,
          where("uid", "==", uid),
          where("contactUid", "==", client.id)
        );
        
        const querySnapshot = await getDocs(q);
        let existingImages = 0;
        
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          const beforeCount = data.beforePhotos?.length || 0;
          const afterCount = data.afterPhotos?.length || 0;
          existingImages += beforeCount + afterCount;
        });

        const remaining = Math.max(0, planLimits.images - existingImages);
        
        // Armazenar informações do cliente
        setClientImageInfo({
          existing: existingImages,
          remaining: remaining,
          limit: planLimits.images
        });
        
        if (existingImages >= planLimits.images) {
          toast.warning(`Cliente ${client.name} já atingiu o limite de ${planLimits.images} imagens do plano ${planLimits.planName}. Não é possível adicionar mais imagens.`);
        } else if (remaining <= 2) {
          toast.info(`Cliente ${client.name} tem ${existingImages}/${planLimits.images} imagens. Restam apenas ${remaining} imagens disponíveis.`);
        } else {
          toast.success(`Cliente ${client.name} tem ${existingImages}/${planLimits.images} imagens. Restam ${remaining} imagens disponíveis.`);
        }
      } catch (error) {
        console.error('Erro ao verificar imagens do cliente:', error);
      }
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const resetAllForms = () => {
    clientForm.reset();
    procedureForm.reset();
    paymentForm.reset();
    observationsForm.reset();
    setSelectedProcedure(null);
    setSelectedProfessional(null);
    setPayments([]);
    setCurrentPaymentIndex(-1);
    setNewPayment({
      method: "dinheiro",
      value: "",
      date: new Date().toISOString().split('T')[0], // Mantido para compatibilidade
      installments: undefined,
    });
  };

  // Funções de pagamento baseadas no código antigo
  const totalPrice = selectedProcedure?.price || 0;
  const totalPaid = payments.reduce((acc, payment) => {
    // Os valores dos pagamentos já estão formatados em reais, então convertemos para número
    const paymentValue = Number(payment.value.replace(/\D/g, '')) / 100;
    console.log("💰 Debug pagamento:", {
      paymentValue: payment.value,
      numericValue: Number(payment.value.replace(/\D/g, '')),
      dividedValue: paymentValue,
      acc: acc
    });
    return acc + paymentValue;
  }, 0);
  
  console.log("💰 Debug totalPaid:", {
    totalPaid: totalPaid,
    payments: payments.map(p => ({ value: p.value, numeric: Number(p.value.replace(/\D/g, '')) }))
  });

  const handlePaymentMethodChange = (value: "dinheiro" | "pix" | "cartao" | "boleto") => {
    setNewPayment({
      ...newPayment,
      method: value,
      installments: value === "cartao" ? 1 : undefined
    });
    
    if (value === "cartao") {
      setShowInstallmentsModal(true);
    }
  };

  const handleInstallmentsSelect = (installments: number) => {
    setNewPayment({
      ...newPayment,
      installments: installments
    });
    setShowInstallmentsModal(false);
  };

  const handleEditPayment = (index: number) => {
    const payment = payments[index];
    setNewPayment({
      method: payment.method,
      value: payment.value,
      date: payment.date,
      installments: payment.installments || (payment.method === "cartao" ? 1 : undefined)
    });
    setCurrentPaymentIndex(index);
  };

  const handleRemovePayment = (index: number) => {
    const updatedPayments = [...payments];
    updatedPayments.splice(index, 1);
    setPayments(updatedPayments);
  };

  const handleAddPayment = () => {
    if (!newPayment.value) {
      toast.error("Informe o valor do pagamento");
      return;
    }

    const value = Number(newPayment.value.replace(/\D/g, ''));
    
    if (value <= 0) {
      toast.error("O valor do pagamento deve ser maior que zero");
      return;
    }

    let adjustedTotalPaid = totalPaid;
    
    if (currentPaymentIndex !== -1) {
      const oldPaymentValue = Number(payments[currentPaymentIndex].value.replace(/\D/g, '')) / 100;
      adjustedTotalPaid = adjustedTotalPaid - oldPaymentValue;
    }
    
    if (adjustedTotalPaid + (value / 100) > (totalPrice / 100)) {
      toast.error(`O valor total dos pagamentos (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adjustedTotalPaid + (value / 100))}) não pode exceder o valor do serviço (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice / 100)})`);
      return;
    }

    console.log("Adicionando pagamento:", {
      ...newPayment,
      value: newPayment.value
    });
    
    const formattedValue = currencyMask(newPayment.value);
    
    if (currentPaymentIndex === -1) {
      setPayments([
        ...payments, 
        {
          ...newPayment,
          value: formattedValue
        }
      ]);
    } else {
      const updatedPayments = [...payments];
      updatedPayments[currentPaymentIndex] = {
        ...newPayment,
        value: formattedValue
      };
      setPayments(updatedPayments);
      setCurrentPaymentIndex(-1);
    }

    setNewPayment({
      method: "dinheiro",
      value: "",
      date: new Date().toISOString().split('T')[0], // Mantido para compatibilidade
      installments: undefined as number | undefined
    });
  };

  const getMaxSteps = () => {
    return serviceType === "budget" ? 3 : 5;
  };

  const getStepTitle = () => {
    if (serviceType === "budget") {
      switch (currentStep) {
        case 1: return "Dados do Cliente";
        case 2: return "Procedimento e Valor";
        case 3: return "Revisão do Orçamento";
        default: return "";
      }
    } else {
      switch (currentStep) {
        case 1: return "Dados do Cliente";
        case 2: return "Informações do Procedimento";
        case 3: return "Pagamento e Financeiro";
        case 4: return "Observações e Anexo";
        case 5: return "Revisão e Confirmação";
        default: return "";
      }
    }
  };

  const renderProgressDots = () => {
    const maxSteps = getMaxSteps();
    return (
      <div className="flex justify-center space-x-2 mb-6">
        {Array.from({ length: maxSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={cn(
              "w-3 h-3 rounded-full",
              step <= currentStep ? "bg-pink-500" : "bg-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  // Renderizar Etapa 1: Dados do Cliente (igual para ambos)
  const renderStep1 = () => (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
        Dados do Cliente
      </h2>
      
      <form onSubmit={clientForm.handleSubmit(handleClientSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...clientForm.register("name")}
              placeholder="Nome completo do cliente"
              style={{ textIndent: '2.0rem' }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                padding: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb'
              }}
              onClick={() => setShowClientsModal(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          {clientForm.formState.errors.name && (
            <p className="text-red-500 text-sm mt-1">{clientForm.formState.errors.name.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...clientForm.register("cpf")}
              placeholder="CPF"
              style={{ textIndent: '2.0rem' }}
              maxLength={14}
              onChange={(e) => {
                const maskedValue = cpfMask(e.target.value);
                if (maskedValue.length <= 14) {
                  clientForm.setValue("cpf", maskedValue);
                }
              }}
            />
          </div>
          {clientForm.formState.errors.cpf && (
            <p className="text-red-500 text-sm mt-1">{clientForm.formState.errors.cpf.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...clientForm.register("phone")}
              placeholder="Celular"
              style={{ textIndent: '2.0rem' }}
              maxLength={15}
              onChange={(e) => {
                const maskedValue = phoneMask(e.target.value);
                if (maskedValue.length <= 15) {
                  clientForm.setValue("phone", maskedValue);
                }
              }}
            />
          </div>
          {clientForm.formState.errors.phone && (
            <p className="text-red-500 text-sm mt-1">{clientForm.formState.errors.phone.message}</p>
          )}
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...clientForm.register("email")}
              placeholder="E-mail"
              style={{ textIndent: '2.0rem' }}
            />
          </div>
          {clientForm.formState.errors.email && (
            <p className="text-red-500 text-sm mt-1">{clientForm.formState.errors.email.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
          Próximo
        </Button>
      </form>
      
      {/* Indicador de Status do Cliente */}
      {clientImageInfo && contactId && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="font-semibold text-blue-800">Status do Cliente</span>
            </div>
            <span className="text-sm text-blue-600">
              {clientImageInfo.existing}/{clientImageInfo.limit} imagens
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className={`h-2 rounded-full ${
                clientImageInfo.existing / clientImageInfo.limit > 0.9 ? 'bg-red-500' :
                clientImageInfo.existing / clientImageInfo.limit > 0.8 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min((clientImageInfo.existing / clientImageInfo.limit) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="text-sm text-blue-700">
            {clientImageInfo.remaining === 0 ? (
              <span className="text-red-600 font-medium">
                ⚠️ Limite atingido! Não é possível adicionar mais imagens.
              </span>
            ) : clientImageInfo.remaining <= 2 ? (
              <span className="text-orange-600 font-medium">
                ⚠️ Limite próximo! Restam apenas {clientImageInfo.remaining} imagens disponíveis.
              </span>
            ) : (
              <span className="text-green-600">
                ✅ Restam {clientImageInfo.remaining} imagens disponíveis para este cliente.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Renderizar Etapa 2: Procedimento e Valor (Orçamento) ou Informações do Procedimento (Serviço Completo)
  const renderStep2 = () => {
    if (serviceType === "budget") {
      return renderBudgetStep2();
    } else {
      return renderCompleteServiceStep2();
    }
  };

  const renderBudgetStep2 = () => (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
        Procedimento e Valor
      </h2>
      
      <form onSubmit={procedureForm.handleSubmit(handleProcedureSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={selectedProcedure?.name || ""}
              placeholder="Adicionar serviço"
              style={{ textIndent: '2.0rem', paddingRight: '40px' }}
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                padding: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb'
              }}
              onClick={() => setShowServicesModal(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={selectedProfessional?.name || ""}
              placeholder="Profissional Responsável"
              style={{ textIndent: '2.0rem', paddingRight: '40px' }}
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                padding: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb'
              }}
              onClick={() => setShowProfessionalsModal(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={selectedProcedure?.price ? formatCurrencyFromCents(selectedProcedure.price) : ""}
              placeholder="Valor Total"
              style={{ textIndent: '2.0rem' }}
              readOnly
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={goBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600"
          >
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Próximo
          </Button>
        </div>
      </form>
    </div>
  );

  const renderCompleteServiceStep2 = () => (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
        Informações do Procedimento
      </h2>
      
      <form onSubmit={procedureForm.handleSubmit(handleProcedureSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={selectedProcedure?.name || ""}
              placeholder="Adicionar serviço"
              style={{ textIndent: '2.0rem', paddingRight: '40px' }}
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                padding: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb'
              }}
              onClick={() => setShowServicesModal(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={selectedProfessional?.name || ""}
              placeholder="Profissional Responsável"
              style={{ textIndent: '2.0rem', paddingRight: '40px' }}
              readOnly
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              style={{ 
                position: 'absolute', 
                right: '8px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                padding: '0',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb'
              }}
              onClick={() => setShowProfessionalsModal(true)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...procedureForm.register("startTime")}
              placeholder="Horário de início"
              style={{ textIndent: '2.0rem' }}
              onChange={(e) => {
                const value = e.target.value;
                const maskedValue = horaMask(value);
                procedureForm.setValue("startTime", maskedValue);
              }}
            />
          </div>
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <CalendarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal pl-12",
                    !procedureForm.watch("date") && "text-muted-foreground"
                  )}
                  style={{ textIndent: '1.5rem' }}
                >
                  {procedureForm.watch("date") ? (
                    format(procedureForm.watch("date"), "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecione a data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={procedureForm.watch("date")}
                  onSelect={(date) => {
                    if (date) {
                      procedureForm.setValue("date", date);
                      setShowCalendar(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={selectedProcedure?.price ? formatCurrencyFromCents(selectedProcedure.price) : ""}
              placeholder="Valor Total"
              style={{ textIndent: '2.0rem' }}
              readOnly
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={goBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600"
          >
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Próximo
          </Button>
        </div>
      </form>
    </div>
  );

  // Renderizar Etapa 3: Revisão do Orçamento (Orçamento) ou Pagamento e Financeiro (Serviço Completo)
  const renderStep3 = () => {
    if (serviceType === "budget") {
      return renderBudgetReview();
    } else {
      return renderPaymentStep();
    }
  };

  const renderBudgetReview = () => {
    const clientData = clientForm.getValues();
    const procedureData = procedureForm.getValues();
    
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
          Revisão do Orçamento
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-pink-500 flex items-center gap-2 mb-3">
              <FileText className="h-6 w-6" />
              Dados do Cliente
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-700">Nome: {clientData.name}</p>
              <p className="text-sm text-gray-700">Celular: {clientData.phone}</p>
              <p className="text-sm text-gray-700">Email: {clientData.email}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-pink-500 flex items-center gap-2 mb-3">
              <CalendarIcon className="h-6 w-6" />
              Informações do Orçamento
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-700">Profissional: {selectedProfessional?.name || "Não selecionado"}</p>
              <div>
                <p className="text-sm font-semibold text-gray-700">Procedimento:</p>
                <ul className="list-disc list-inside">
                  <li className="text-sm text-gray-700">{selectedProcedure?.name || "Não selecionado"} - {selectedProcedure?.price ? formatCurrencyFromCents(selectedProcedure.price) : "R$ 0,00"}</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={goBack}
              className="flex-1 bg-pink-500 hover:bg-pink-600"
            >
              Voltar
            </Button>
            <Button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const clientData = clientForm.getValues();
                  const procedureData = procedureForm.getValues();
                  
                  // Processar dados do cliente
                  const clientName = clientData.name.trim();
                  const clientCpf = cpfUnMask(clientData.cpf || "");
                  const clientPhone = celularUnMask(clientData.phone);
                  
                  // Criar ou atualizar cliente
                  if (clientName && (clientCpf || clientPhone)) {
                    const contactUid = await createOrUpdateClientWithLimitations(clientName, clientCpf, clientPhone, clientData.email);
                    if (contactUid) {
                      setSelectedClientId(contactUid);
                      setContactId(contactUid);
                    }
                  }
                  
                  const budgetData = {
                    name: clientData.name,
                    cpf: clientCpf,
                    phone: clientPhone,
                    email: clientData.email || "",
                    date: new Date().toISOString().split('T')[0],
                    time: "",
                    price: selectedProcedure?.price || 0,
                    paidAmount: 0,
                    priority: "",
                    duration: "",
                    observations: "",
                    services: selectedProcedure ? [{
                      id: selectedProcedure.id,
                      code: "",
                      name: selectedProcedure.name,
                      price: String(selectedProcedure.price),
                      date: new Date().toISOString().split('T')[0]
                    }] : [],
                    professionals: selectedProfessional ? [{
                      id: selectedProfessional.id,
                      name: selectedProfessional.name,
                      specialty: selectedProfessional.specialty || ""
                    }] : [],
                    budget: true,
                    sendToFinance: false,
                    payments: [],
                    documents: [],
                    beforePhotos: [],
                    afterPhotos: [],
                    uid: uid,
                    contactUid: selectedClientId || contactId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };

                  if (serviceId) {
                    // Atualizar serviço existente
                    const serviceRef = doc(database, "Services", serviceId);
                    await updateDoc(serviceRef, {
                      ...budgetData,
                      updatedAt: new Date().toISOString()
                    });
                    toast.success("Orçamento atualizado com sucesso!");
                  } else {
                    // Criar novo orçamento
                    await addDoc(collection(database, "Services"), budgetData);
                    toast.success("Orçamento criado com sucesso!");
                  }
                  
                  router.push("/dashboard/servicos");
                } catch (error) {
                  console.error("Erro ao criar/atualizar orçamento:", error);
                  toast.error("Erro ao criar/atualizar orçamento!");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? "Criando..." : "Criar Orçamento"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderPaymentStep = () => (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
        Pagamento e Financeiro
      </h2>
      
      <div className="space-y-6">
        {/* Métodos de Pagamento */}
        <div className="space-y-4">
          <h3 className="font-semibold text-pink-500">Métodos de pagamento</h3>
          
          {/* Tipo de Pagamento */}
          <div className="flex justify-center space-x-6">
            <Button
              variant={paymentType === "total" ? "default" : "outline"}
              onClick={() => {
                setPaymentType("total");
                setNewPayment({...newPayment, value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice / 100)});
              }}
              className={paymentType === "total" ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-300 text-black hover:bg-gray-50"}
            >
              Pagamento Total
            </Button>
            <Button
              variant={paymentType === "partial" ? "default" : "outline"}
              onClick={() => {
                setPaymentType("partial");
                setNewPayment({...newPayment, value: ""});
              }}
              className={paymentType === "partial" ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-300 text-black hover:bg-gray-50"}
            >
              Pagamento Parcial
            </Button>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span>Valor total do serviço:</span>
              <span className="font-semibold">{new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalPrice / 100)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total pago:</span>
              <span className="font-semibold text-green-600">
                {currencyMask(totalPaid * 100)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Saldo pendente:</span>
              <span className="font-semibold text-orange-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format((totalPrice / 100) - totalPaid)}
              </span>
            </div>
          </div>

          {/* Métodos de Pagamento */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <div 
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  newPayment.method === "dinheiro" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handlePaymentMethodChange("dinheiro")}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold text-lg">💵</span>
                  </div>
                  <span className="font-medium">Dinheiro</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  newPayment.method === "dinheiro" ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}>
                  {newPayment.method === "dinheiro" && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>
              </div>

              <div 
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  newPayment.method === "pix" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handlePaymentMethodChange("pix")}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-lg">📱</span>
                  </div>
                  <span className="font-medium">PIX</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  newPayment.method === "pix" ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}>
                  {newPayment.method === "pix" && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>
              </div>

              <div 
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  newPayment.method === "cartao" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handlePaymentMethodChange("cartao")}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">💳</span>
                  </div>
                  <span className="font-medium">Cartão</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  newPayment.method === "cartao" ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}>
                  {newPayment.method === "cartao" && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>
              </div>

              <div 
                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                  newPayment.method === "boleto" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handlePaymentMethodChange("boleto")}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-lg">📄</span>
                  </div>
                  <span className="font-medium">Boleto</span>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  newPayment.method === "boleto" ? "border-green-500 bg-green-500" : "border-gray-300"
                }`}>
                  {newPayment.method === "boleto" && (
                    <span className="text-white text-xs font-bold">✓</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Campo de Valor (apenas para pagamento parcial) */}
          {newPayment.value !== new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice / 100) && (
            <div>
              <Label>Valor do Pagamento</Label>
              <Input
                placeholder="Digite o valor"
                value={newPayment.value}
                onChange={(e) => setNewPayment({...newPayment, value: currencyMask(e.target.value)})}
                className="mt-2"
              />
            </div>
          )}

          {/* Parcelas (apenas para cartão) */}
          {newPayment.method === "cartao" && newPayment.installments && (
            <div className="mt-2 text-sm text-gray-600">
              Parcelado em {newPayment.installments}x
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleAddPayment}
              disabled={!newPayment.value || Number(newPayment.value.replace(/\D/g, '')) <= 0}
              className="bg-pink-500 hover:bg-pink-600"
            >
              {currentPaymentIndex === -1 ? "Adicionar Pagamento" : "Atualizar Pagamento"}
            </Button>
          </div>
        </div>

        {/* Pagamentos Realizados */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-4">Pagamentos Realizados</h4>
          {payments.length === 0 ? (
            <p className="text-gray-500 italic">Nenhum pagamento registrado</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment, index) => {
                const paymentValue = Number(payment.value.replace(/\D/g, '')) / 100;
                const isPaid = paymentValue > 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${isPaid ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                      <div>
                        <div className="font-medium">
                          {payment.method === "dinheiro" 
                            ? "Dinheiro" 
                            : payment.method === "pix" 
                            ? "PIX"
                            : payment.method === "boleto"
                            ? "Boleto"
                            : `Cartão ${payment.installments ? `${payment.installments}x` : ""}`}
                        </div>
                        <div className="text-sm font-semibold">
                          {payment.value}
                        </div>
                        <div className={`text-xs ${isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                          {isPaid ? 'Pago' : 'Pendente'}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditPayment(index)}
                        className="text-xs px-2 py-1"
                      >
                        Editar
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemovePayment(index)}
                        className="text-xs px-2 py-1"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={goBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600"
          >
            Voltar
          </Button>
          <Button
            onClick={() => handlePaymentSubmit(paymentForm.getValues())}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            disabled={totalPaid === 0}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );

  // Renderizar Etapa 4: Observações e Anexo (apenas Serviço Completo)
  const renderStep4 = () => (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
        Observações e Anexos
      </h2>
      
      <form onSubmit={observationsForm.handleSubmit(handleObservationsSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            {...observationsForm.register("observations")}
            placeholder="Adicione observações sobre o procedimento..."
            className="mt-1"
            rows={4}
          />
        </div>

        <div className="space-y-6">
          {/* Fotos Antes */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Fotos Antes</h3>
              {planLimits && contactId && clientImageInfo && (
                <div className="text-sm text-gray-600">
                  {(() => {
                    const beforePhotos = observationsForm.watch('beforePhotos') || [];
                    const afterPhotos = observationsForm.watch('afterPhotos') || [];
                    const serviceImages = beforePhotos.length + afterPhotos.length;
                    const totalImages = clientImageInfo.existing + serviceImages;
                    const remaining = Math.max(0, planLimits.images - totalImages);
                    return (
                      <span className={remaining === 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {totalImages}/{planLimits.images} imagens
                        {remaining > 0 && ` (${remaining} restantes)`}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadType('before')}
                  disabled={isUploading || (() => {
                    if (!planLimits || !contactId || !clientImageInfo) return false;
                    
                    const beforePhotos = observationsForm.watch('beforePhotos') || [];
                    const afterPhotos = observationsForm.watch('afterPhotos') || [];
                    const serviceImages = beforePhotos.length + afterPhotos.length;
                    const totalImages = clientImageInfo.existing + serviceImages;
                    
                    return totalImages >= planLimits.images;
                  })()}
                >
                  Adicionar Fotos Antes
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'before')}
                  ref={(el) => {
                    if (el && uploadType === 'before') {
                      el.click();
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(!observationsForm.watch('beforePhotos') || observationsForm.watch('beforePhotos')?.length === 0) ? (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    Nenhuma foto adicionada
                  </div>
                ) : (
                  observationsForm.watch('beforePhotos')?.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo.url}
                        alt={`Foto antes ${index + 1}`}
                        className="w-full h-48 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveFile('before', index)}
                        className="absolute top-2 right-2 h-8 w-8 bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-6 w-6" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Fotos Depois */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Fotos Depois</h3>
              {planLimits && contactId && clientImageInfo && (
                <div className="text-sm text-gray-600">
                  {(() => {
                    const beforePhotos = observationsForm.watch('beforePhotos') || [];
                    const afterPhotos = observationsForm.watch('afterPhotos') || [];
                    const serviceImages = beforePhotos.length + afterPhotos.length;
                    const totalImages = clientImageInfo.existing + serviceImages;
                    const remaining = Math.max(0, planLimits.images - totalImages);
                    return (
                      <span className={remaining === 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {totalImages}/{planLimits.images} imagens
                        {remaining > 0 && ` (${remaining} restantes)`}
                      </span>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadType('after')}
                  disabled={isUploading || (() => {
                    if (!planLimits || !contactId || !clientImageInfo) return false;
                    
                    const beforePhotos = observationsForm.watch('beforePhotos') || [];
                    const afterPhotos = observationsForm.watch('afterPhotos') || [];
                    const serviceImages = beforePhotos.length + afterPhotos.length;
                    const totalImages = clientImageInfo.existing + serviceImages;
                    
                    return totalImages >= planLimits.images;
                  })()}
                >
                  Adicionar Fotos Depois
                </Button>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'after')}
                  ref={(el) => {
                    if (el && uploadType === 'after') {
                      el.click();
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(!observationsForm.watch('afterPhotos') || observationsForm.watch('afterPhotos')?.length === 0) ? (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    Nenhuma foto adicionada
                  </div>
                ) : (
                  observationsForm.watch('afterPhotos')?.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo.url}
                        alt={`Foto depois ${index + 1}`}
                        className="w-full h-48 object-cover rounded"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveFile('after', index)}
                        className="absolute top-2 right-2 h-8 w-8 bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-6 w-6" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Documentos */}
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Documentos</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUploadType('document')}
                  disabled={isUploading}
                >
                  Adicionar Documentos
                </Button>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files, 'document')}
                  ref={(el) => {
                    if (el && uploadType === 'document') {
                      el.click();
                    }
                  }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(!observationsForm.watch('documents') || observationsForm.watch('documents')?.length === 0) ? (
                  <div className="col-span-3 text-center py-8 text-gray-500">
                    Nenhum documento adicionado
                  </div>
                ) : (
                  observationsForm.watch('documents')?.map((doc, index) => (
                    <div key={index} className="relative border rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Paperclip className="h-5 w-5 text-gray-400" />
                        <span className="text-sm text-gray-700 truncate">
                          Documento {index + 1}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveFile('document', index)}
                        className="absolute top-2 right-2 h-6 w-6 bg-red-600 hover:bg-red-700"
                      >
                        <Trash2 className="h-6 w-6" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={goBack}
            className="flex-1 bg-gray-500 hover:bg-gray-600"
          >
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Próximo
          </Button>
        </div>
      </form>
    </div>
  );

  // Renderizar Etapa 5: Revisão e Confirmação (apenas Serviço Completo)
  const renderStep5 = () => {
    const clientData = clientForm.getValues();
    const procedureData = procedureForm.getValues();
    const paymentData = paymentForm.getValues();
    const observationsData = observationsForm.getValues();
    
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
          Revisão e Confirmação
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold text-pink-500 flex items-center gap-2 mb-3">
              <FileText className="h-6 w-6" />
              Dados do Cliente
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-700">Nome: {clientData.name}</p>
              <p className="text-sm text-gray-700">Celular: {clientData.phone}</p>
              <p className="text-sm text-gray-700">Email: {clientData.email}</p>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-pink-500 flex items-center gap-2 mb-3">
              <CalendarIcon className="h-6 w-6" />
              Informações do Procedimento
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm text-gray-700">Profissional: {selectedProfessional?.name || "Não selecionado"}</p>
              <p className="text-sm text-gray-700">Data: {format(procedureData.date, "dd/MM/yyyy", { locale: ptBR })}</p>
              <p className="text-sm text-gray-700">Horário: {procedureData.startTime}</p>
              <div>
                <p className="text-sm font-semibold text-gray-700">Procedimento:</p>
                <ul className="list-disc list-inside">
                  <li className="text-sm text-gray-700">{selectedProcedure?.name || "Não selecionado"} - {selectedProcedure?.price ? formatCurrencyFromCents(selectedProcedure.price) : "R$ 0,00"}</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-pink-500 flex items-center gap-2 mb-3">
              <CreditCard className="h-6 w-6" />
              Pagamento
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              {payments.length > 0 ? (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Pagamentos Realizados:</p>
                  {payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center py-1">
                      <span className="text-sm text-gray-600">
                        {payment.method === "dinheiro" ? "Dinheiro" : payment.method === "pix" ? "PIX" : payment.method === "cartao" ? "Cartão" : "Boleto"}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">{payment.value}</span>
                    </div>
                  ))}
                  
                  {/* Mostrar saldo pendente se houver */}
                  {totalPaid < (totalPrice / 100) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-orange-600">Saldo Pendente:</span>
                        <span className="text-sm font-semibold text-orange-600">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((totalPrice / 100) - totalPaid)}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar se está pago integralmente */}
                  {totalPaid >= (totalPrice / 100) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm font-semibold text-green-600 text-center">
                        ✅ Serviço Pago Integralmente
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700">Tipo: {paymentType === "total" ? "Pagamento Total" : "Pagamento Parcial"}</p>
                  <p className="text-sm text-gray-700">Método: {newPayment.method === "dinheiro" ? "Dinheiro" : newPayment.method === "pix" ? "PIX" : newPayment.method === "cartao" ? "Cartão" : "Boleto"}</p>
                  <p className="text-sm text-gray-500 italic">Nenhum pagamento registrado ainda</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={goBack}
              className="flex-1 bg-pink-500 hover:bg-pink-600"
            >
              Voltar
            </Button>
            <Button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  const clientData = clientForm.getValues();
                  const procedureData = procedureForm.getValues();
                  const paymentData = paymentForm.getValues();
                  const observationsData = observationsForm.getValues();
                  
                  // Processar dados do cliente
                  const clientName = clientData.name.trim();
                  const clientCpf = cpfUnMask(clientData.cpf || "");
                  const clientPhone = celularUnMask(clientData.phone);
                  
                  // Criar ou atualizar cliente
                  if (clientName && (clientCpf || clientPhone)) {
                    const contactUid = await createOrUpdateClientWithLimitations(clientName, clientCpf, clientPhone, clientData.email);
                    if (contactUid) {
                      setSelectedClientId(contactUid);
                      setContactId(contactUid);
                    }
                  }
                  
                  const processedPayments = payments.map(payment => {
                    const numericValue = typeof payment.value === 'string' 
                      ? Number(payment.value.replace(/\D/g, ''))
                      : Number(payment.value);
                    
                    return {
                      method: payment.method,
                      value: numericValue,
                      date: payment.date,
                      installments: payment.installments || null,
                    };
                  });

                  const paidAmount = processedPayments.reduce((sum, payment) => sum + payment.value, 0);
                  
                  // Verificar limite de imagens antes de criar o serviço
                  if (contactId && planLimits) {
                    const beforePhotos = observationsData.beforePhotos || [];
                    const afterPhotos = observationsData.afterPhotos || [];
                    const newImagesCount = beforePhotos.length + afterPhotos.length;
                    
                    if (newImagesCount > 0) {
                      const canCreate = await checkClientImageLimit(contactId, newImagesCount);
                      if (!canCreate) {
                        return; // Parar a criação se exceder o limite
                      }
                    }
                  }

                  const serviceData = {
                    name: clientData.name,
                    cpf: clientCpf,
                    phone: clientPhone,
                    email: clientData.email || "",
                    date: procedureData.date ? format(procedureData.date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0],
                    time: procedureData.startTime || "",
                    price: selectedProcedure?.price || 0,
                    paidAmount: paidAmount,
                    priority: "",
                    duration: procedureData.endTime ? `${procedureData.startTime} - ${procedureData.endTime}` : "",
                    observations: observationsData.observations || "",
                    services: selectedProcedure ? [{
                      id: selectedProcedure.id,
                      code: "",
                      name: selectedProcedure.name,
                      price: String(selectedProcedure.price),
                      date: procedureData.date ? format(procedureData.date, 'yyyy-MM-dd') : new Date().toISOString().split('T')[0]
                    }] : [],
                    professionals: selectedProfessional ? [{
                      id: selectedProfessional.id,
                      name: selectedProfessional.name,
                      specialty: selectedProfessional.specialty || ""
                    }] : [],
                    budget: false,
                    sendToFinance: false,
                    payments: processedPayments,
                    documents: observationsData.documents || [],
                    beforePhotos: observationsData.beforePhotos || [],
                    afterPhotos: observationsData.afterPhotos || [],
                    uid: uid,
                    contactUid: selectedClientId || contactId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };

                  if (serviceId) {
                    // Atualizar serviço existente
                    const serviceRef = doc(database, "Services", serviceId);
                    await updateDoc(serviceRef, {
                      ...serviceData,
                      updatedAt: new Date().toISOString()
                    });
                    toast.success("Serviço atualizado com sucesso!");
                  } else {
                    // Criar novo serviço
                    await addDoc(collection(database, "Services"), serviceData);
                    toast.success("Serviço criado com sucesso!");
                  }
                  
                  router.push("/dashboard/servicos");
                } catch (error) {
                  console.error("Erro ao criar/atualizar serviço:", error);
                  toast.error("Erro ao criar/atualizar serviço!");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (serviceId ? "Atualizando..." : "Criando...") : (serviceId ? "Atualizar Serviço" : "Criar Serviço")}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={goBack}
            className="text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium text-pink-500 underline">
            {serviceId ? "Editando Serviço" : "Novo Serviço"} - {getStepTitle()}
          </span>
        </div>

        {/* Service Type Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-3">
            <Button
              variant={serviceType === "budget" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setServiceType("budget");
                resetAllForms();
                setCurrentStep(1);
              }}
              className={serviceType === "budget" ? "bg-pink-500 text-white" : "text-gray-600"}
            >
              Orçamento
            </Button>
            <Button
              variant={serviceType === "complete" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                setServiceType("complete");
                resetAllForms();
                setCurrentStep(1);
              }}
              className={serviceType === "complete" ? "bg-pink-500 text-white" : "text-gray-600"}
            >
              Serviço Completo
            </Button>
          </div>
        </div>

        {/* Progress Dots */}
        {renderProgressDots()}

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {/* Modals */}
        <CustomModalServices
          visible={showServicesModal}
          onClose={() => setShowServicesModal(false)}
          onConfirm={handleServiceSelect}
          title="Selecione o procedimento"
        />
        
        <CustomModalProfessionals
          visible={showProfessionalsModal}
          onClose={() => setShowProfessionalsModal(false)}
          onConfirm={handleProfessionalSelect}
          title="Selecione o profissional"
        />

        <CustomModalClients
          visible={showClientsModal}
          onClose={() => setShowClientsModal(false)}
          onSelect={handleClientSelect}
          title="Selecione o cliente"
        />

        {showInstallmentsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Selecione o número de parcelas</h2>
                <Button variant="ghost" onClick={() => setShowInstallmentsModal(false)}>
                  Fechar
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <Button 
                    key={num} 
                    variant="outline" 
                    onClick={() => handleInstallmentsSelect(num)}
                    className="p-4"
                  >
                    {num}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}