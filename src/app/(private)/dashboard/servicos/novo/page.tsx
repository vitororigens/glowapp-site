"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { currencyMask, cpfMask, cpfUnMask, celularMask, celularUnMask } from "@/utils/maks/masks";

// Função para carregar valores do banco de dados
const loadCurrencyFromDB = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === 0) return '';
  
  // Se for número, assume que está em centavos (valores salvos no banco)
  if (typeof value === 'number') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }
  
  // Se for string, converte para número e formata
  const numericValue = Number(String(value).replace(/\D/g, ''));
  if (numericValue === 0) return '';
  
  // Assume que está em centavos (valores salvos no banco)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue / 100);
};

// Função para carregar valores do banco para campos de formulário
const loadCurrencyForForm = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === 0) return '';
  
  // Se for número, assume que está em centavos e converte para formato de input
  if (typeof value === 'number') {
    // Para valores em centavos, formatamos corretamente
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  }
  
  // Se for string, converte para número e formata
  const numericValue = Number(String(value).replace(/\D/g, ''));
  if (numericValue === 0) return '';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numericValue / 100);
};
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";
import { z } from "zod";
import { toast } from "react-toastify";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomModalServices } from "@/components/CustomModalServices";
import { CustomModalProfessionals } from "@/components/CustomModalProfessionals";
import { CustomModalClients } from "@/components/CustomModalClients";
import { ItemService } from "@/components/ItemService";
import { ItemProfessional } from "@/components/ItemProfessional";
import { FileIcon } from "@/components/icons/FileIcon";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Hora é obrigatória"),
  price: z.string().min(1, "Valor é obrigatório"),
  priority: z.string().optional(),
  duration: z.string().optional(),
  observations: z.string().optional(),
  services: z.array(z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    price: z.string(),
    date: z.string().optional(),
  })).optional(),
  professionals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    specialty: z.string(),
  })).optional(),
  budget: z.boolean().default(false),
  sendToFinance: z.boolean().default(false),
  payments: z.array(z.object({
    method: z.enum(["dinheiro", "pix", "cartao", "boleto"]),
    value: z.string().min(1, "Valor é obrigatório"),
    date: z.string().min(1, "Data é obrigatória"),
    installments: z.number().optional(),
  })).default([]),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
  beforePhotos: z.array(z.object({
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
  afterPhotos: z.array(z.object({
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export default function NewService() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [currentPaymentIndex, setCurrentPaymentIndex] = useState(-1);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams?.get('id') || null;
  const contactId = searchParams?.get('contactId') || null;
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showProfessionalsModal, setShowProfessionalsModal] = useState(false);
  const [uploadType, setUploadType] = useState<'document' | 'before' | 'after' | null>(null);
  const [newPayment, setNewPayment] = useState({
    method: "dinheiro" as "dinheiro" | "pix" | "cartao" | "boleto",
    value: "",
    date: new Date().toISOString().split('T')[0],
    installments: 1 as number | undefined,
  });
  const { planLimits, canAddImageToClient, getRemainingImagesForClient, loading: planLoading } = usePlanLimitations();
  const [clientImageCount, setClientImageCount] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      phone: "",
      email: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
      price: "",
      priority: "",
      duration: "",
      observations: "",
      services: [],
      professionals: [],
      budget: false,
      sendToFinance: false,
      payments: [],
      documents: [],
      beforePhotos: [],
      afterPhotos: [],
    },
  });

  const budget = watch("budget");
  const services = watch("services") || [];
  const professionals = watch("professionals") || [];
  const documents = watch("documents") || [];
  const beforePhotos = watch("beforePhotos") || [];
  const afterPhotos = watch("afterPhotos") || [];
  const payments = watch("payments") || [];
  const totalPrice = watch("price") ? Number(watch("price").replace(/\D/g, '')) : 0;
  
  // Debug para verificar o cálculo do totalPrice
  console.log("🔍 Debug totalPrice calculation:", {
    priceField: watch("price"),
    totalPrice: totalPrice,
    expectedDisplay: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)
  });
  
  // Debug para verificar o cálculo do totalPrice
  useEffect(() => {
    const currentPrice = watch("price");
    console.log("🔍 Debug totalPrice:", {
      priceField: currentPrice,
      totalPrice: totalPrice,
      priceFieldType: typeof currentPrice,
      numericValue: currentPrice ? Number(currentPrice.replace(/\D/g, '')) : 0,
      expectedValue: currentPrice ? Number(currentPrice.replace(/\D/g, '')) : 0
    });
  }, [watch("price"), totalPrice]);
  
  // Debug logs para verificar valores
  useEffect(() => {
    const currentPrice = watch("price");
    console.log("🔍 Debug preço:", {
      priceField: currentPrice,
      totalPrice: totalPrice,
      priceFieldType: typeof currentPrice
    });
  }, [watch("price"), totalPrice]);

  const totalPaid = payments.reduce((acc, payment) => {
    // Os valores dos pagamentos estão em centavos, então dividimos por 100 para obter reais
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

  const remainingAmount = totalPrice - totalPaid;

  useEffect(() => {
    if (contactId && !selectedClientId) {
      setSelectedClientId(contactId);
    }
  }, [contactId, selectedClientId]);

  useEffect(() => {
    if (serviceId) {
      const docRef = doc(database, "Services", serviceId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Dados carregados do serviço:", data);
          console.log("💰 Preço original do banco:", data.price, "Tipo:", typeof data.price);
          console.log("📸 Imagens antes:", data.beforePhotos, "Tipo:", typeof data.beforePhotos);
          console.log("📸 Imagens depois:", data.afterPhotos, "Tipo:", typeof data.afterPhotos);
          console.log("📸 Images Before:", data.imagesBefore, "Tipo:", typeof data.imagesBefore);
          console.log("📸 Images After:", data.imagesAfter, "Tipo:", typeof data.imagesAfter);
          if (data) {
            console.log("Pagamentos carregados:", data.payments);
            reset({
              name: data.name || "",
              cpf: cpfMask(data.cpf || ""),
              phone: celularMask(data.phone || ""),
              email: data.email || "",
              date: data.date ? (data.date.includes('/') ? 
                data.date.split('/').reverse().join('-') : 
                data.date) : new Date().toISOString().split('T')[0],
              time: data.time && data.time !== "0" ? data.time : "",
              price: loadCurrencyForForm(data.price),
              priority: data.priority || "",
              duration: data.duration || "",
              observations: data.observations || "",
              services: data.services ? data.services.map((service: any) => ({
                ...service,
                price: service.price ? new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(service.price / 100) : service.price
              })) : [],
              professionals: data.professionals || [],
              budget: data.budget || false,
              sendToFinance: data.sendToFinance || false,
              payments: data.payments ? data.payments.map((p: any) => ({
                method: p.method,
                value: loadCurrencyForForm(p.value),
                date: p.date,
                installments: p.installments || undefined
              })) : [],
              documents: data.documents || [],
              beforePhotos: data.imagesBefore || data.beforePhotos || [],
              afterPhotos: data.imagesAfter || data.afterPhotos || [],
            });
            console.log("Formulário resetado com os dados carregados.");
            console.log("💰 Preço original do banco:", data.price, "Tipo:", typeof data.price);
            console.log("💰 Preço após loadCurrencyForForm:", loadCurrencyForForm(data.price));
            console.log("💰 Preço após currencyMask:", currencyMask(String(data.price || 0)));
            console.log("💰 Teste: 3000 / 100 =", 3000 / 100);
            setSelectedClientId((data as any).contactUid || null);
          }
        }
      });
    }
  }, [serviceId, reset]);

  useEffect(() => {
    if (contactId && uid) {
      fetchClientImageCount();
    }
  }, [contactId, uid]);

  const fetchClientImageCount = async () => {
    if (!contactId || !uid) return;

    try {
      // Buscar todos os serviços do cliente
      const servicesRef = collection(database, "Services");
      const q = query(
        servicesRef,
        where("uid", "==", uid),
        where("contactUid", "==", contactId)
      );
      
      const querySnapshot = await getDocs(q);
      let totalImages = 0;
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        const beforeCount = data.beforePhotos?.length || 0;
        const afterCount = data.afterPhotos?.length || 0;
        totalImages += beforeCount + afterCount;
      });
      
      setClientImageCount(totalImages);
    } catch (error) {
      console.error('Erro ao buscar contagem de imagens do cliente:', error);
      setClientImageCount(0);
    }
  };

  const onSubmit = async (data: FormSchemaType) => {
    console.log("onSubmit function called", data);
    if (!uid) {
      console.error("UID não encontrado");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Iniciando processamento...");
    
      const clientName = data.name.trim();
      const clientCpf = cpfUnMask(data.cpf);
      const clientPhone = celularUnMask(data.phone);
      
      if (clientName && (clientCpf || clientPhone)) {
        const contactsRef = collection(database, "Contacts");
        
        let clientExists = false;
        
        if (clientCpf) {
          const cpfQuery = query(contactsRef, where("cpf", "==", clientCpf));
          const cpfSnapshot = await getDocs(cpfQuery);
          
          if (!cpfSnapshot.empty) {
            clientExists = true;
            console.log("Cliente encontrado pelo CPF");
          }
        }
        
        if (!clientExists && clientPhone) {
          const phoneQuery = query(contactsRef, where("phone", "==", clientPhone));
          const phoneSnapshot = await getDocs(phoneQuery);
          
          if (!phoneSnapshot.empty) {
            clientExists = true;
            console.log("Cliente encontrado pelo telefone");
          }
        }
        
        if (!clientExists && clientName) {
          const nameQuery = query(contactsRef, where("name", "==", clientName));
          const nameSnapshot = await getDocs(nameQuery);
          
          if (!nameSnapshot.empty) {
            clientExists = true;
            console.log("Cliente encontrado pelo nome");
            
            const existingClientDoc = nameSnapshot.docs[0];
            const existingClientData = existingClientDoc.data();
            let needsUpdate = false;
            
            if (clientCpf && !existingClientData.cpf) {
              needsUpdate = true;
            }
            
            if (clientPhone && !existingClientData.phone) {
              needsUpdate = true;
            }
            
            if (data.email && !existingClientData.email) {
              needsUpdate = true;
            }
            
            if (needsUpdate) {
              try {
                await updateDoc(existingClientDoc.ref, {
                  cpf: clientCpf || existingClientData.cpf || "",
                  phone: clientPhone || existingClientData.phone || "",
                  email: data.email || existingClientData.email || "",
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
        
        if (!clientExists) {
          console.log("Cliente não encontrado. Criando novo cliente...");
          const newContactRef = doc(collection(database, "Contacts"));
          
          const newContactData = {
            name: clientName,
            cpf: clientCpf,
            phone: clientPhone,
            email: data.email || "",
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
          } catch (error: any) {
            console.error("Erro ao criar cliente:", error);
            toast.error("Não foi possível adicionar o cliente automaticamente, mas o serviço será salvo", {
              position: "top-center",
              autoClose: 5000,
            });
          }
        } else {
          console.log("Cliente já existe, não é necessário criar.");
        }
      }
      
      const processedPayments = data.payments ? data.payments.map(payment => {
        const numericValue = typeof payment.value === 'string' 
          ? Number(payment.value.replace(/\D/g, ''))
          : Number(payment.value);
        
        return {
          method: payment.method,
          value: numericValue,
          date: payment.date,
          installments: payment.installments || null,
        };
      }) : [];

      console.log("Pagamentos processados:", processedPayments);
      
      const paidAmount = processedPayments.reduce((sum, payment) => sum + payment.value, 0);
      
      const price = Number(data.price.replace(/\D/g, ''));
      
      console.log("💰 Salvando preço:", {
        originalPrice: data.price,
        numericPrice: price,
        expectedPrice: 3000
      });
      
      if (serviceId) {
        console.log("Editando serviço existente:", serviceId);
        
        const serviceRef = doc(database, "Services", serviceId);
        
        const updateData = {
          name: data.name,
          cpf: cpfUnMask(data.cpf),
          phone: celularUnMask(data.phone),
          email: data.email || "",
          date: data.date,
          time: data.time,
          price: price,
          paidAmount: paidAmount,
          priority: data.priority || "",
          duration: data.duration || "",
          observations: data.observations || "",
          services: data.services || [],
          professionals: data.professionals || [],
          budget: data.budget || false,
          sendToFinance: data.sendToFinance || false,
          payments: processedPayments,
          documents: data.documents || [],
          beforePhotos: data.beforePhotos || [],
          afterPhotos: data.afterPhotos || [],
          contactUid: selectedClientId || contactId,
          updatedAt: new Date().toISOString()
        };
        
        console.log("Dados completos para atualização:", updateData);
        
        try {
          await updateDoc(serviceRef, updateData);
          console.log("Atualização concluída com sucesso");
          toast.success("Serviço atualizado com sucesso!", {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
          setTimeout(() => {
            console.log("Redirecionando...");
            router.back();
          }, 2000);
        } catch (error: any) {
          console.error("Erro específico na atualização:", error);
          toast.error("Erro ao atualizar: " + (error.message || "Desconhecido"), {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setIsLoading(false);
        }
      } else {
        console.log("Criando novo serviço");

        const newServiceData = {
          name: data.name,
          cpf: cpfUnMask(data.cpf),
          phone: celularUnMask(data.phone),
          email: data.email || "",
          date: data.date,
          time: data.time,
          price: price,
          paidAmount: paidAmount,
          priority: data.priority || "",
          duration: data.duration || "",
          observations: data.observations || "",
          services: data.services || [],
          professionals: data.professionals || [],
          budget: data.budget || false,
          sendToFinance: data.sendToFinance || false,
          payments: processedPayments,
          documents: data.documents || [],
          beforePhotos: data.beforePhotos || [],
          afterPhotos: data.afterPhotos || [],
          uid,
          contactUid: selectedClientId || contactId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const newServiceRef = doc(collection(database, "Services"));
        await setDoc(newServiceRef, newServiceData);
        
        toast.success("Serviço adicionado!");
        setTimeout(() => router.back(), 1000);
      }
    } catch (error: any) {
      console.error("Erro ao processar:", error);
      toast.error("Erro: " + (error.message || "Desconhecido"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveService = (id: string) => {
    const updatedServices = services.filter(item => item.id !== id);
    setValue("services", updatedServices);
    
    const total = updatedServices.reduce((sum, service) => {
      const servicePrice = typeof service.price === 'string' 
        ? Number(service.price.replace(/\D/g, ''))
        : Number(service.price);
      return sum + servicePrice;
    }, 0);
    
    setValue("price", currencyMask(total.toString()));
    
    const currentTotalPaid = payments.reduce((acc, payment) => {
      return acc + Number(payment.value.replace(/\D/g, ''));
    }, 0);

    if (currentTotalPaid > total && payments.length > 0) {
      toast.warning('O valor total foi reduzido. Verifique as formas de pagamento.');
    }
  };

  const handleRemoveProfessional = (id: string) => {
    const updatedProfessionals = professionals.filter(item => item.id !== id);
    setValue("professionals", updatedProfessionals);
  };

  const handleFileUpload = async (files: FileList | null, type: 'document' | 'before' | 'after') => {
    if (!files || !uid) return;

    // Verificar limitação de imagens por cliente (bloqueio silencioso)
    if ((type === 'before' || type === 'after') && contactId && planLimits) {
      const currentBeforePhotos = watch("beforePhotos") || [];
      const currentAfterPhotos = watch("afterPhotos") || [];
      const currentServiceImages = currentBeforePhotos.length + currentAfterPhotos.length;
      const totalClientImages = clientImageCount - currentServiceImages; // Remove imagens do serviço atual
      const newImagesCount = files.length;
      
      if (!canAddImageToClient(totalClientImages + currentServiceImages + newImagesCount)) {
        const remaining = getRemainingImagesForClient(totalClientImages + currentServiceImages);
        toast.error(`Limite de ${planLimits.images} imagens por cliente atingido! Você pode adicionar mais ${remaining} imagens.`);
        return;
      }
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `${uid}/services/${serviceId || 'new'}/${type}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return {
          url,
          name: file.name,
          description: type === 'document' ? file.name : '',
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      if (type === 'document') {
        setValue('documents', [...documents, ...uploadedFiles]);
      } else if (type === 'before') {
        setValue('beforePhotos', [...beforePhotos, ...uploadedFiles]);
      } else if (type === 'after') {
        setValue('afterPhotos', [...afterPhotos, ...uploadedFiles]);
      }

      toast.success('Arquivos enviados com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar arquivos!');
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  const handleRemoveFile = (type: 'document' | 'before' | 'after', index: number) => {
    if (type === 'document') {
      const newDocuments = documents.filter((_, i) => i !== index);
      setValue('documents', newDocuments);
    } else if (type === 'before') {
      const newPhotos = beforePhotos.filter((_, i) => i !== index);
      setValue('beforePhotos', newPhotos);
    } else if (type === 'after') {
      const newPhotos = afterPhotos.filter((_, i) => i !== index);
      setValue('afterPhotos', newPhotos);
    }
  };

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
    console.log("Editando pagamento:", payment);
    
    setNewPayment({
      method: payment.method,
      value: payment.value,
      date: payment.date,
      installments: payment.installments || 1
    });
    
    console.log("NewPayment definido para edição:", {
      method: payment.method,
      value: payment.value,
      date: payment.date,
      installments: payment.installments || 1
    });
    
    setCurrentPaymentIndex(index);
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
      const oldPaymentValue = Number(payments[currentPaymentIndex].value.replace(/\D/g, ''));
      adjustedTotalPaid = adjustedTotalPaid - oldPaymentValue;
    }
    
    if (adjustedTotalPaid + value > totalPrice) {
      toast.error(`O valor total dos pagamentos (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((adjustedTotalPaid + value) / 100)}) não pode exceder o valor do serviço (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)})`);
      return;
    }

    const formattedValue = currencyMask(newPayment.value);
    
    console.log("Adicionando pagamento:", {
      ...newPayment,
      value: formattedValue
    });
    
    if (currentPaymentIndex === -1) {
      setValue("payments", [
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
      setValue("payments", updatedPayments);
      setCurrentPaymentIndex(-1);
    }

    setNewPayment({
      method: "dinheiro",
      value: "",
      date: new Date().toISOString().split('T')[0],
      installments: 1 as number | undefined
    });
  };

  const handleRemovePayment = (index: number) => {
    const updatedPayments = [...payments];
    updatedPayments.splice(index, 1);
    setValue("payments", updatedPayments);
  };

  useEffect(() => {
    if (totalPrice > 0 && totalPaid > totalPrice) {
      toast.warning('O valor dos pagamentos excede o valor total do serviço. Por favor, ajuste os valores.');
      
      if (payments.length > 1) {
        toast.info(`Valor total do serviço: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice)}, Total já registrado em pagamentos: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPaid)}`);
      }
    }
  }, [totalPrice, totalPaid, payments.length]);

  const validatePayments = () => {
    if (totalPaid > totalPrice && payments.length > 0) {
      if (window.confirm('Os pagamentos registrados excedem o valor total do serviço. Deseja limpar todos os pagamentos?')) {
        setValue('payments', []);
        toast.success('Pagamentos limpos. Você pode registrar novos pagamentos agora.');
      }
    }
  };

  const renderPaymentWarning = () => {
    if (totalPaid > totalPrice && payments.length > 0) {
      return (
        <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-2">
          <p className="text-sm text-yellow-700">
            Pagamentos excedem o valor total do serviço.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={validatePayments}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            Limpar Pagamentos
          </Button>
        </div>
      );
    }
    return null;
  };

  // Aguardar carregamento do plano antes de renderizar
  if (planLoading) {
    return (
      <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {serviceId ? "Editar" : "Novo"} Serviço
      </h2>

      <form 
        onSubmit={handleSubmit(onSubmit)} 
        className="space-y-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <div className="relative">
              <Input
                {...register("name")}
                placeholder="Nome completo"
                className={errors.name ? "border-red-500" : ""}
                style={{ paddingRight: '40px' }}
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
            {errors.name && (
              <span className="text-sm text-red-500">{errors.name.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>CPF</Label>
            <Input
              {...register("cpf")}
              placeholder="CPF"
              className={errors.cpf ? "border-red-500" : ""}
              onChange={(e) => {
                const value = e.target.value;
                setValue("cpf", cpfMask(value));
              }}
            />
            {errors.cpf && (
              <span className="text-sm text-red-500">{errors.cpf.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              {...register("phone")}
              placeholder="Telefone"
              className={errors.phone ? "border-red-500" : ""}
              onChange={(e) => {
                const value = e.target.value;
                setValue("phone", celularMask(value));
              }}
            />
            {errors.phone && (
              <span className="text-sm text-red-500">{errors.phone.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              {...register("email")}
              placeholder="Email"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <span className="text-sm text-red-500">{errors.email.message}</span>
            )}
          </div>

          <div>
            <Label>Data*</Label>
            <Input type="date" {...register("date")} />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>

          <div>
            <Label>Hora*</Label>
            <Input type="time" {...register("time")} />
            {errors.time && (
              <p className="text-red-500 text-sm">{errors.time.message}</p>
            )}
          </div>

          <div>
            <Label>Valor Total*</Label>
            <Input 
              {...register("price")} 
              placeholder="Valor"
              onChange={(e) => setValue("price", currencyMask(e.target.value))}
            />
            {errors.price && (
              <p className="text-red-500 text-sm">{errors.price.message}</p>
            )}
          </div>

          <div>
            <Label>Duração</Label>
            <Input 
              type="time"
              {...register("duration")} 
              placeholder="Duração do serviço"
            />
            {errors.duration && (
              <p className="text-red-500 text-sm">{errors.duration.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label>Observações</Label>
          <Textarea 
            {...register("observations")} 
            placeholder="Observações sobre o serviço"
            className="min-h-[80px] sm:min-h-[100px]"
          />
          {errors.observations && (
            <p className="text-red-500 text-sm">{errors.observations.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="budget"
            checked={budget}
            onCheckedChange={(checked) => setValue("budget", checked)}
          />
          <Label htmlFor="budget">Orçamento</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="sendToFinance"
            checked={watch("sendToFinance")}
            onCheckedChange={(checked) => setValue("sendToFinance", checked)}
          />
          <Label htmlFor="sendToFinance">Enviar para o Financeiro</Label>
        </div>

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Formas de Pagamento</h3>
          
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>Valor total do serviço:</span>
              <span className="font-semibold">{new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalPrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Total pago:</span>
              <span className="font-semibold text-green-600">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(totalPaid)}
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Método de Pagamento</Label>
                <RadioGroup
                  value={newPayment.method}
                  onValueChange={(value) => handlePaymentMethodChange(value as "dinheiro" | "pix" | "cartao" | "boleto")}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dinheiro" id="method-dinheiro" />
                    <Label htmlFor="method-dinheiro">Dinheiro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pix" id="method-pix" />
                    <Label htmlFor="method-pix">PIX</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cartao" id="method-cartao" />
                    <Label htmlFor="method-cartao">Cartão</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boleto" id="method-boleto" />
                    <Label htmlFor="method-boleto">Boleto</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Pagamento</Label>
                <RadioGroup
                  value={newPayment.value === totalPrice.toString() ? "full" : "partial"}
                  onValueChange={(value) => {
                    if (value === "full") {
                      setNewPayment({...newPayment, value: totalPrice.toString()});
                    } else {
                      setNewPayment({...newPayment, value: ""});
                    }
                  }}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="payment-full" />
                    <Label htmlFor="payment-full">Valor Inteiro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="payment-partial" />
                    <Label htmlFor="payment-partial">Valor Parcial</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Valor</Label>
                <Input
                  placeholder="Valor do pagamento"
                  value={newPayment.value}
                  onChange={(e) => setNewPayment({...newPayment, value: currencyMask(e.target.value)})}
                  className="mt-2"
                  disabled={newPayment.value === totalPrice.toString()}
                />
              </div>
            </div>

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
              >
                {currentPaymentIndex === -1 ? "Adicionar Pagamento" : "Atualizar Pagamento"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Pagamentos Registrados</h4>
            {payments.length === 0 ? (
              <p className="text-gray-500 italic">Nenhum pagamento registrado</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-md bg-green-50 border-green-100 border">
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
                      <div className="text-sm">
                        {payment.date} - {payment.value}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditPayment(index)}
                      >
                        Editar
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemovePayment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Procedimentos Selecionados</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowServicesModal(true)}
            >
              Adicionar Serviço
            </Button>
          </div>
          <ScrollArea className="h-[150px] sm:h-[200px]">
            {services.map((service) => (
              <ItemService
                key={service.id}
                id={service.id}
                code={service.code}
                name={service.name}
                price={service.price}
                onRemove={handleRemoveService}
              />
            ))}
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Profissionais Responsáveis</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowProfessionalsModal(true)}
            >
              Adicionar Profissional
            </Button>
          </div>
          <ScrollArea className="h-[150px] sm:h-[200px]">
            {professionals.map((professional) => (
              <ItemProfessional
                key={professional.id}
                id={professional.id}
                name={professional.name}
                specialty={professional.specialty}
                onRemove={handleRemoveProfessional}
              />
            ))}
          </ScrollArea>
        </Card>

        <Card className="p-4 mt-4">
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
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, 'document')}
                ref={(el) => {
                  if (el && uploadType === 'document') {
                    el.click();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-5 w-5" />
                    <span>{doc.name}</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveFile('document', index)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Fotos Antes</h3>
          

          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadType('before')}
                disabled={isUploading}
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
              {beforePhotos.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  Nenhuma foto adicionada
                </div>
              ) : (
                beforePhotos.map((photo, index) => (
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
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Fotos Depois</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadType('after')}
                disabled={isUploading}
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
              {afterPhotos.length === 0 ? (
                <div className="col-span-3 text-center py-8 text-gray-500">
                  Nenhuma foto adicionada
                </div>
              ) : (
                afterPhotos.map((photo, index) => (
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
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        <div className="flex flex-row justify-between align-center">
          <Button 
            type="submit" 
            disabled={isLoading}
            className={isLoading ? "bg-gray-400" : ""}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </div>
            ) : (
              "Salvar"
            )}
          </Button>
          <Button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              router.back();
            }} 
            variant="outline"
            disabled={isLoading}
          >
            Voltar
          </Button>
        </div>
      </form>

      <CustomModalServices
        visible={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        onConfirm={(selectedItems) => {
          const currentServices = services || [];
          const existingIds = currentServices.map(s => s.id);
          const newServices = selectedItems.filter(id => !existingIds.includes(id));
          
          const fetchSelectedServices = async () => {
            try {
              const servicesRef = collection(database, "Procedures");
              const selectedDocs = await Promise.all(
                newServices.map(id => getDoc(doc(servicesRef, id)))
              );
              
              const selectedServices = selectedDocs
                .filter(doc => doc.exists())
                .map(doc => ({
                  id: doc.id,
                  name: doc.data().name,
                  code: doc.data().code,
                  price: doc.data().price,
                  date: doc.data().date
                }));

              const updatedServices = [...currentServices, ...selectedServices];
              setValue("services", updatedServices);

              const total = updatedServices.reduce((sum, service) => {
                const price = typeof service.price === 'string' 
                  ? Number(service.price.replace(/\D/g, ''))
                  : Number(service.price);
                return sum + price;
              }, 0);

              setValue("price", currencyMask(total.toString()));
              
              if (total < totalPaid && payments.length > 0) {
                toast.warning('O valor total foi atualizado, mas os pagamentos registrados excedem o novo valor.');
              }
            } catch (error) {
              console.error("Erro ao buscar serviços selecionados:", error);
              toast.error("Erro ao adicionar serviços!");
            }
          };

          fetchSelectedServices();
          setShowServicesModal(false);
        }}
        title="Selecione os procedimentos"
      />

      <CustomModalProfessionals
        visible={showProfessionalsModal}
        onClose={() => setShowProfessionalsModal(false)}
        onConfirm={(selectedItems) => {
          const currentProfessionals = professionals || [];
          const existingIds = currentProfessionals.map(p => p.id);
          const newProfessionals = selectedItems.filter(id => !existingIds.includes(id));
          
          const fetchSelectedProfessionals = async () => {
            try {
              const professionalsRef = collection(database, "Profissionals");
              const selectedDocs = await Promise.all(
                newProfessionals.map(id => getDoc(doc(professionalsRef, id)))
              );
              
              const selectedProfessionals = selectedDocs
                .filter(doc => doc.exists())
                .map(doc => ({
                  id: doc.id,
                  name: doc.data().name,
                  specialty: doc.data().specialty
                }));

              setValue("professionals", [...currentProfessionals, ...selectedProfessionals]);
            } catch (error) {
              console.error("Erro ao buscar profissionais selecionados:", error);
              toast.error("Erro ao adicionar profissionais!");
            }
          };

          fetchSelectedProfessionals();
          setShowProfessionalsModal(false);
        }}
        title="Selecione os profissionais"
      />

      <CustomModalClients
        visible={showClientsModal}
        onClose={() => setShowClientsModal(false)}
        onSelect={(client) => {
          setValue("name", client.name);
          setValue("cpf", cpfMask(client.cpf));
          setValue("phone", celularMask(client.phone));
          if (client.email) {
            setValue("email", client.email);
          }
          setSelectedClientId(client.id);
          setShowClientsModal(false);
        }}
        title="Selecionar Cliente"
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
  );
} 