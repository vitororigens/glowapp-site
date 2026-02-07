"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { useUserData } from "@/hooks/useUserData";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { triggerAppointmentConfirmationSite } from "@/services/automation";
import { z } from "zod";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataMask, dataUnMask, horaMask, horaUnMask, phoneMask, cpfMask, formatCurrencyFromCents } from "@/utils/maks/masks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, User, Phone, Mail, Clock, Calendar as CalendarIcon2, FileText, Plus, ArrowLeft, CheckCircle, X, Pencil, Settings, CheckCircle as CheckCircleIcon, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomModalServices } from "@/components/CustomModalServices";
import { CustomModalProfessionals } from "@/components/CustomModalProfessionals";
import { CustomModalClients } from "@/components/CustomModalClients";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import "@/styles/calendar.css";

// Schema para dados do cliente
const clientSchema = z.object({
  name: z.string().min(1, "Nome completo é obrigatório"),
  phone: z.string().min(11, "Telefone é obrigatório"),
  email: z.string().optional(),
  cpf: z.string().optional(),
});

// Schema para informações do agendamento
const appointmentSchema = z.object({
  contact: z.string().optional(),
  date: z.date(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  observations: z.string().optional(),
});

type ClientData = z.infer<typeof clientSchema>;
type AppointmentData = z.infer<typeof appointmentSchema>;

interface Service {
  id: string;
  name: string;
  duration: number; // em minutos
  price: number;
}

interface Procedure {
  id: string;
  code: string;
  name: string;
  duration: number;
  price: number;
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

export default function NewAppointment() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showProfessionalsModal, setShowProfessionalsModal] = useState(false);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedProcedures, setSelectedProcedures] = useState<Procedure[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [clientImageInfo, setClientImageInfo] = useState<{
    existing: number;
    remaining: number;
    limit: number;
  } | null>(null);
  const [clientCountInfo, setClientCountInfo] = useState<{
    current: number;
    remaining: number;
    limit: number;
  } | null>(null);
  
  // Estados para modal de detalhes completos
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false);
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);
  const [clientDataModified, setClientDataModified] = useState(false);
  const { user } = useAuthContext();
  const { userData } = useUserData();
  const { planLimits } = usePlanLimitations();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('id');

  // Chave para armazenamento de estado
  const FORM_STATE_KEY = "NEW_APPOINTMENT_FORM_STATE";

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

  const appointmentForm = useForm<AppointmentData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      contact: "",
      date: (() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      })(),
      startTime: "",
      endTime: "",
      observations: "",
    },
  });

  // Salvar estado do formulário antes de navegar
  const saveFormState = () => {
    const state = {
      clientFormData: clientForm.getValues(),
      appointmentFormData: appointmentForm.getValues(),
      currentStep,
      selectedProcedures,
      selectedProfessional,
      selectedClientId,
      contactId,
      clientImageInfo,
      clientCountInfo,
      clientDataModified
    };
    sessionStorage.setItem(FORM_STATE_KEY, JSON.stringify(state));
  };

  // Restaurar estado do formulário ao montar
  const restoreFormState = () => {
    const savedState = sessionStorage.getItem(FORM_STATE_KEY);
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        
        // Restaurar dados do formulário
        if (parsedState.clientFormData) {
          clientForm.reset(parsedState.clientFormData);
        }
        
        if (parsedState.appointmentFormData) {
          // Converter string de data de volta para Date
          if (parsedState.appointmentFormData.date) {
            parsedState.appointmentFormData.date = new Date(parsedState.appointmentFormData.date);
          }
          appointmentForm.reset(parsedState.appointmentFormData);
        }

        // Restaurar outros estados
        if (parsedState.currentStep) setCurrentStep(parsedState.currentStep);
        if (parsedState.selectedProcedures) setSelectedProcedures(parsedState.selectedProcedures);
        if (parsedState.selectedProfessional) setSelectedProfessional(parsedState.selectedProfessional);
        if (parsedState.selectedClientId) setSelectedClientId(parsedState.selectedClientId);
        if (parsedState.contactId) setContactId(parsedState.contactId);
        if (parsedState.clientImageInfo) setClientImageInfo(parsedState.clientImageInfo);
        if (parsedState.clientCountInfo) setClientCountInfo(parsedState.clientCountInfo);
        if (parsedState.clientDataModified !== undefined) setClientDataModified(parsedState.clientDataModified);

        // Limpar storage após restaurar
        sessionStorage.removeItem(FORM_STATE_KEY);
        
        console.log("Estado do formulário restaurado com sucesso");
      } catch (error) {
        console.error("Erro ao restaurar estado do formulário:", error);
        sessionStorage.removeItem(FORM_STATE_KEY);
      }
    }
  };

  // Handler para adicionar novo procedimento
  const handleAddProcedure = () => {
    saveFormState();
    router.push('/dashboard/procedimentos/novo');
  };

  // Carregar dados
  useEffect(() => {
    if (uid) {
      loadServices();
      loadProcedures();
      loadProfessionals();
      checkClientCountStatus();
      
      // Tentar restaurar estado salvo se não estiver editando um agendamento existente
      // ou se preferirmos o estado salvo (ex: voltando de criar procedimento)
      if (!appointmentId) {
        restoreFormState();
      }
    }
  }, [uid]);

  // Atualizar contagem de clientes quando planLimits mudar
  useEffect(() => {
    if (planLimits && uid) {
      checkClientCountStatus();
    }
  }, [planLimits, uid]);

  // Carregar dados do agendamento para edição
  useEffect(() => {
    if (appointmentId && uid) {
      loadAppointmentForEdit();
    }
  }, [appointmentId, uid]);

  // Atualizar procedimentos e profissionais selecionados quando as listas estiverem carregadas
  useEffect(() => {
    if (appointmentId && procedures.length > 0) {
      // Tentar fazer match dos procedimentos novamente quando a lista estiver disponível
      const appointmentRef = doc(database, "Appointments", appointmentId);
      getDoc(appointmentRef).then((appointmentSnap) => {
        if (appointmentSnap.exists()) {
          const appointmentData = appointmentSnap.data();
          if (appointmentData.appointment) {
            const appointment = appointmentData.appointment;
            // Procedimentos - buscar na lista de procedimentos
            if (appointment.procedureIds && Array.isArray(appointment.procedureIds)) {
              const selectedProcedures = procedures.filter(p => appointment.procedureIds.includes(p.id));
              if (selectedProcedures.length > 0) {
                setSelectedProcedures(selectedProcedures);
              }
            } else if (appointment.procedureId) {
              // Compatibilidade com dados antigos (procedimento único)
              const procedure = procedures.find(p => p.id === appointment.procedureId);
              if (procedure) {
                setSelectedProcedures([procedure]);
              }
            }
          }
        }
      }).catch(console.error);
    }
  }, [appointmentId, procedures]);

  // Atualizar profissional selecionado quando a lista estiver carregada
  useEffect(() => {
    if (appointmentId && professionals.length > 0) {
      // Tentar fazer match do profissional novamente quando a lista estiver disponível
      const appointmentRef = doc(database, "Appointments", appointmentId);
      getDoc(appointmentRef).then((appointmentSnap) => {
        if (appointmentSnap.exists()) {
          const appointmentData = appointmentSnap.data();
          if (appointmentData.appointment?.professionalId) {
            const professional = professionals.find(p => p.id === appointmentData.appointment.professionalId);
            if (professional) {
              setSelectedProfessional(professional);
            }
          }
        }
      }).catch(console.error);
    }
  }, [appointmentId, professionals]);

  // Resetar estados para novos agendamentos
  useEffect(() => {
    if (!appointmentId && uid) {
      resetAllForms();
    }
  }, [appointmentId, uid]);

  // Função para extrair apenas o nome (sem especialidade)
  const extractNameOnly = (fullName: string): string => {
    if (!fullName) return '';
    
    // Se o nome contém a especialidade, tentar separar
    // Assumindo que a especialidade vem depois do nome
    const words = fullName.trim().split(' ');
    
    // Se tem mais de 2 palavras, provavelmente a última é a especialidade
    if (words.length > 2) {
      // Remover a última palavra (especialidade) e juntar o resto
      return words.slice(0, -1).join(' ');
    }
    
    // Se tem 2 palavras ou menos, retornar o nome completo
    return fullName;
  };

  // Selecionar automaticamente o usuário logado como profissional
  useEffect(() => {
    if (!selectedProfessional) {
      // Usar dados do userData se disponível, senão usar dados básicos do Firebase Auth
      const fullUserName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Usuário';
      const userName = extractNameOnly(fullUserName);
      const userEmail = userData?.email || user?.email || '';
      
      // Criar um objeto Professional com os dados do usuário logado
      const currentUserAsProfessional: Professional = {
        id: uid || '',
        name: userName,
        cpfCnpj: userData?.cpf || '',
        phone: userData?.phone || '',
        email: userEmail,
        address: userData?.address || '',
        observations: userData?.observations || '',
        registrationNumber: userData?.registrationNumber || '',
        specialty: userData?.specialty || '',
        imageUrl: userData?.imageUrl || ''
      };
      
      setSelectedProfessional(currentUserAsProfessional);
      appointmentForm.setValue("contact", currentUserAsProfessional.name);
    }
  }, [userData, selectedProfessional, uid, user?.email, user?.displayName, appointmentForm]);

  const loadServices = async () => {
    try {
      const servicesRef = collection(database, "Services");
      const querySnapshot = await getDocs(servicesRef);
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
      // Tentar diferentes nomes de coleção
      const collections = ["Procedures", "procedures", "Procedimentos"];
      
      for (const collectionName of collections) {
        try {
          const proceduresRef = collection(database, collectionName);
          const q = query(proceduresRef, where("uid", "==", uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const proceduresData = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            })) as Procedure[];
            console.log(`Procedimentos carregados da coleção ${collectionName}:`, proceduresData);
            setProcedures(proceduresData);
            return; // Se encontrou dados, para de tentar outras coleções
          }
        } catch (error) {
          console.log(`Erro ao tentar coleção ${collectionName}:`, error);
        }
      }
      
      console.log('Nenhum procedimento encontrado em nenhuma coleção');
    } catch (error) {
      console.error("Erro ao carregar procedimentos:", error);
    }
  };

  const loadProfessionals = async () => {
    try {
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

  const loadAppointmentForEdit = async () => {
    if (!appointmentId) {
      console.log('❌ loadAppointmentForEdit: appointmentId não encontrado');
      return;
    }
    
    try {
      console.log('🔄 Carregando agendamento para edição:', appointmentId);
      const appointmentRef = doc(database, "Appointments", appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      
      if (appointmentSnap.exists()) {
        const appointmentData = appointmentSnap.data();
        console.log('✅ Dados do agendamento carregados:', appointmentData);
        
        // Preencher dados do cliente
        if (appointmentData.client) {
          console.log('👤 Preenchendo dados do cliente:', appointmentData.client);
          clientForm.setValue("name", appointmentData.client.name || "");
          clientForm.setValue("phone", appointmentData.client.phone || "");
          clientForm.setValue("email", appointmentData.client.email || "");
          clientForm.setValue("cpf", appointmentData.client.cpf || "");
          console.log('✅ Dados do cliente preenchidos no formulário');
        } else {
          console.warn('⚠️ Dados do cliente não encontrados no agendamento');
        }
        
        // Preencher dados do agendamento
        if (appointmentData.appointment) {
          const appointment = appointmentData.appointment;
          console.log('📅 Preenchendo dados do agendamento:', appointment);
          
          // Data
          if (appointment.date) {
            // Corrigir problema de fuso horário - criar data local
            const [year, month, day] = appointment.date.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month - 1 porque JavaScript usa 0-11
            console.log('📆 Data do agendamento:', appointment.date, '->', date);
            appointmentForm.setValue("date", date);
          } else {
            console.warn('⚠️ Data do agendamento não encontrada');
          }
          
          // Horários
          console.log('🕐 Horários:', { startTime: appointment.startTime, endTime: appointment.endTime });
          appointmentForm.setValue("startTime", appointment.startTime || "");
          // Verificar se o endTime é válido, senão calcular baseado no procedimento
          if (appointment.endTime && appointment.endTime !== "NaN:NaN") {
            appointmentForm.setValue("endTime", appointment.endTime);
          } else if (appointment.startTime && appointment.procedureId) {
            const procedure = procedures.find(p => p.id === appointment.procedureId);
            if (procedure) {
              const calculatedEndTime = calculateEndTime(appointment.startTime, { duration: procedure.duration } as Service);
              appointmentForm.setValue("endTime", calculatedEndTime);
            }
          }
          appointmentForm.setValue("observations", appointment.observations || "");
          
          // Profissional
          if (appointment.professionalName) {
            appointmentForm.setValue("contact", appointment.professionalName);
          }
          
          // Procedimentos - buscar na lista de procedimentos
          if (appointment.procedureIds && Array.isArray(appointment.procedureIds)) {
            console.log('🔍 Buscando procedimentos por IDs:', appointment.procedureIds);
            console.log('📋 Procedimentos disponíveis:', procedures.map(p => ({ id: p.id, name: p.name })));
            const selectedProcedures = procedures.filter(p => appointment.procedureIds.includes(p.id));
            console.log('✅ Procedimentos encontrados:', selectedProcedures.map(p => ({ id: p.id, name: p.name })));
            if (selectedProcedures.length > 0) {
              setSelectedProcedures(selectedProcedures);
            } else {
              console.warn('⚠️ Nenhum procedimento encontrado na lista atual. IDs procurados:', appointment.procedureIds);
            }
          } else if (appointment.procedureId) {
            // Compatibilidade com dados antigos (procedimento único)
            console.log('🔍 Buscando procedimento único por ID:', appointment.procedureId);
            const procedure = procedures.find(p => p.id === appointment.procedureId);
            if (procedure) {
              console.log('✅ Procedimento encontrado:', procedure);
              setSelectedProcedures([procedure]);
            } else {
              console.warn('⚠️ Procedimento não encontrado na lista atual. ID procurado:', appointment.procedureId);
            }
          } else {
            console.log('ℹ️ Nenhum procedimento associado ao agendamento');
          }
          
          // Profissional - buscar na lista de profissionais
          if (appointment.professionalId) {
            console.log('👨‍⚕️ Buscando profissional por ID:', appointment.professionalId);
            console.log('📋 Profissionais disponíveis:', professionals.map(p => ({ id: p.id, name: p.name })));
            const professional = professionals.find(p => p.id === appointment.professionalId);
            if (professional) {
              console.log('✅ Profissional encontrado:', professional);
              setSelectedProfessional(professional);
            } else {
              console.warn('⚠️ Profissional não encontrado na lista atual. ID procurado:', appointment.professionalId);
            }
          }
          
          console.log('✅ Dados do agendamento preenchidos no formulário');
        } else {
          console.warn('⚠️ Dados do agendamento não encontrados');
        }
        
        // Definir contactUid se disponível
        if (appointmentData.contactUid) {
          setSelectedClientId(appointmentData.contactUid);
          setContactId(appointmentData.contactUid);
          
          // Verificar status de imagens do cliente quando carregando para edição
          if (planLimits && appointmentData.client?.name) {
            await checkClientImageStatus(appointmentData.contactUid, appointmentData.client.name);
          }
        } else {
          // Se não há contactUid, tentar encontrar o cliente pelos dados
          if (appointmentData.client?.name) {
            try {
              const contactsRef = collection(database, "Contacts");
              const nameQuery = query(
                contactsRef, 
                where("name", "==", appointmentData.client.name),
                where("uid", "==", uid)
              );
              const nameSnapshot = await getDocs(nameQuery);
              
              if (!nameSnapshot.empty) {
                const clientId = nameSnapshot.docs[0].id;
                setSelectedClientId(clientId);
                setContactId(clientId);
                
                // Verificar status de imagens
                if (planLimits) {
                  await checkClientImageStatus(clientId, appointmentData.client.name);
                }
              }
            } catch (error) {
              console.error('Erro ao buscar cliente por nome na edição:', error);
            }
          }
        }
        
        // Manter na primeira etapa para permitir edição dos dados do cliente
        setCurrentStep(1);
        console.log('✅ Carregamento do agendamento concluído com sucesso!');
      } else {
        console.error('❌ Agendamento não encontrado no banco de dados');
        toast.error("Agendamento não encontrado!");
      }
    } catch (error) {
      console.error("❌ Erro ao carregar agendamento para edição:", error);
      toast.error("Erro ao carregar dados do agendamento!");
    }
  };

  // Função para calcular horário de fim baseado no serviço selecionado
  const calculateEndTime = (startTime: string, service: Service) => {
    if (!startTime || !service || !service.duration) return "";
    
    // Remover máscara se existir
    const cleanTime = startTime.replace(/[^0-9]/g, '');
    if (cleanTime.length < 4) return "";
    
    const hours = parseInt(cleanTime.slice(0, 2));
    const minutes = parseInt(cleanTime.slice(2, 4));
    
    // Verificar se os valores são válidos
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return "";
    }
    
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate.getTime() + service.duration * 60000);
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
    return `${endHours}:${endMinutes}`;
  };

  // Handlers
  const handleClientSubmit = async (data: ClientData) => {
    // Se já temos um cliente selecionado (seja por edição ou seleção anterior),
    // mas os dados foram modificados pelo usuário, forçar criação de novo cliente
    if (selectedClientId && !clientDataModified) {
      console.log("Cliente já selecionado - pulando verificação de imagens do cliente");
      setCurrentStep(2);
      return;
    }
    
    // Se os dados foram modificados, resetar selectedClientId para forçar criação de novo cliente
    if (clientDataModified) {
      setSelectedClientId(null);
      setContactId(null);
    }
    
    // Criar ou atualizar cliente automaticamente (apenas para novos agendamentos)
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
        
        // Verificar e mostrar status de imagens do cliente criado (apenas para novos agendamentos)
        await checkClientImageStatus(contactUid, data.name);
      } else {
        // Se não conseguiu criar o cliente (limite atingido), não avançar para próxima etapa
        return;
      }
    }
    
    setCurrentStep(2);
  };

  const handleAppointmentSubmit = (data: AppointmentData) => {
    console.log('Dados do formulário de agendamento:', data);
    console.log('Erros do formulário:', appointmentForm.formState.errors);
    setCurrentStep(3);
  };



  const handleServiceSelect = (selectedServiceIds: string[]) => {
    if (selectedServiceIds.length > 0) {
      // Buscar todos os procedimentos selecionados
      const selectedServices = procedures.filter(p => selectedServiceIds.includes(p.id));
      setSelectedProcedures(selectedServices);
      
      // Calcular horário de fim baseado na duração total dos procedimentos
      const startTime = appointmentForm.getValues("startTime");
      if (startTime && selectedServices.length > 0) {
        const totalDuration = selectedServices.reduce((sum, service) => sum + (service.duration || 0), 0);
        const endTime = calculateEndTime(startTime, { duration: totalDuration } as Service);
        appointmentForm.setValue("endTime", endTime);
      }
    } else {
      setSelectedProcedures([]);
    }
    setShowServicesModal(false);
  };

  const handleProfessionalSelect = (selectedProfessionalIds: string[]) => {
    if (selectedProfessionalIds.length > 0) {
      // Buscar o primeiro profissional selecionado
      const selectedProfessional = professionals.find(p => p.id === selectedProfessionalIds[0]);
      if (selectedProfessional) {
        setSelectedProfessional(selectedProfessional);
        appointmentForm.setValue("contact", selectedProfessional.name);
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
    if (client.id && planLimits) {
      await checkClientImageStatus(client.id, client.name);
    }
  };

  const handleStartTimeChange = (time: string) => {
    appointmentForm.setValue("startTime", time);
    if (selectedProcedures.length > 0) {
      const totalDuration = selectedProcedures.reduce((sum, procedure) => sum + (procedure.duration || 0), 0);
      const endTime = calculateEndTime(time, { duration: totalDuration } as Service);
      appointmentForm.setValue("endTime", endTime);
    }
  };

  // Função para verificar status de imagens do cliente
  const checkClientImageStatus = async (contactUid: string, clientName: string) => {
    if (!planLimits || !uid) return;
    
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
        toast.warning(`Cliente ${clientName} já atingiu o limite de ${planLimits.images} imagens do plano ${planLimits.planName}. Não é possível adicionar mais imagens.`);
      } else if (remaining <= 2) {
        toast.info(`Cliente ${clientName} tem ${existingImages}/${planLimits.images} imagens. Restam apenas ${remaining} imagens disponíveis.`);
      } else {
        toast.success(`Cliente ${clientName} tem ${existingImages}/${planLimits.images} imagens. Restam ${remaining} imagens disponíveis.`);
      }
    } catch (error) {
      console.error('Erro ao verificar imagens do cliente:', error);
    }
  };

  // Função para verificar contagem de clientes
  const checkClientCountStatus = async () => {
    if (!planLimits || !uid) return;
    
    try {
      const contactsRef = collection(database, "Contacts");
      const q = query(contactsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      const currentCount = querySnapshot.size;
      const remaining = Math.max(0, planLimits.clients - currentCount);
      
      setClientCountInfo({
        current: currentCount,
        remaining: remaining,
        limit: planLimits.clients
      });
    } catch (error) {
      console.error('Erro ao verificar contagem de clientes:', error);
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
        const cpfQuery = query(contactsRef, where("cpf", "==", clientCpf), where("uid", "==", uid));
        const cpfSnapshot = await getDocs(cpfQuery);
        
        if (!cpfSnapshot.empty) {
          clientExists = true;
          existingClientId = cpfSnapshot.docs[0].id;
          console.log("Cliente encontrado pelo CPF");
        }
      }
      
      // Verificar se cliente já existe pelo telefone
      if (!clientExists && clientPhone) {
        const phoneQuery = query(contactsRef, where("phone", "==", clientPhone), where("uid", "==", uid));
        const phoneSnapshot = await getDocs(phoneQuery);
        
        if (!phoneSnapshot.empty) {
          clientExists = true;
          existingClientId = phoneSnapshot.docs[0].id;
          console.log("Cliente encontrado pelo telefone");
        }
      }
      
      // Verificar se cliente já existe pelo nome
      if (!clientExists && clientName) {
        const nameQuery = query(contactsRef, where("name", "==", clientName), where("uid", "==", uid));
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
        console.log("Cliente não encontrado. Verificando limite antes de criar...");
        
        // Verificar limite de clientes APENAS se for criar um novo cliente
        const allClientsQuery = query(contactsRef, where("uid", "==", uid));
        const allClientsSnapshot = await getDocs(allClientsQuery);
        const currentClientCount = allClientsSnapshot.size;
        
        // Verificar se pode adicionar mais clientes
        if (!planLimits || !planLimits.isActive) {
          toast.error("Plano inativo. Não é possível criar clientes.", {
            position: "top-center",
            autoClose: 3000,
          });
          return null;
        }
        
        if (currentClientCount >= planLimits.clients) {
          toast.error(`Limite de clientes atingido! Você tem ${currentClientCount}/${planLimits.clients} clientes do plano ${planLimits.planName}. Faça upgrade para adicionar mais clientes.`, {
            position: "top-center",
            autoClose: 5000,
          });
          return null;
        }
        
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
          toast.error("Não foi possível adicionar o cliente automaticamente, mas o agendamento será salvo", {
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

  const handleCreateAppointment = async () => {
    if (!uid) return;
    
    setIsLoading(true);
    try {
      const clientData = clientForm.getValues();
      const appointmentData = appointmentForm.getValues();
      
      // Calcular preço total de todos os procedimentos
      const totalPrice = selectedProcedures.reduce((sum, procedure) => {
        const price = typeof procedure.price === 'string' ? parseInt(procedure.price) : (procedure.price || 0);
        return sum + price;
      }, 0);

      // Usar o contactUid já definido ou criar/atualizar cliente se necessário
      let contactUid = selectedClientId;
      
      // Se não temos um contactUid e estamos criando um novo agendamento, criar o cliente
      if (!selectedClientId && !appointmentId && clientData.name && (clientData.cpf || clientData.phone)) {
        contactUid = await createOrUpdateClientWithLimitations(
          clientData.name, 
          clientData.cpf || "", 
          clientData.phone, 
          clientData.email || ""
        );
        
        if (contactUid) {
          setSelectedClientId(contactUid);
          setContactId(contactUid);
        }
      }

      // Calcular duração total dos procedimentos
      const totalDuration = selectedProcedures.reduce((sum, procedure) => {
        return sum + (procedure.duration || 0);
      }, 0);

      const appointmentDoc = {
        client: {
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email || '',
          cpf: clientData.cpf || '',
        },
        appointment: {
          // ✅ Data e horários padronizados
          date: format(appointmentData.date, 'yyyy-MM-dd'),
          startTime: appointmentData.startTime || '',
          endTime: appointmentData.endTime || '',
          duration: totalDuration, // ✅ Duração total em minutos
          // ✅ Arrays de procedimentos (padrão unificado)
          procedureIds: selectedProcedures.map(p => p.id),
          procedureNames: selectedProcedures.map(p => p.name),
          procedureCodes: selectedProcedures.map(p => p.code || ''),
          procedurePrices: selectedProcedures.map(p => typeof p.price === 'string' ? parseInt(p.price) : (p.price || 0)),
          // ✅ Totais
          totalPrice: totalPrice,
          // ✅ Profissional com specialty
          professionalId: selectedProfessional?.id || "",
          professionalName: selectedProfessional?.name || "",
          professionalSpecialty: selectedProfessional?.specialty || '', // ✅ Adicionado specialty
          // ✅ Extras
          observations: appointmentData.observations || '',
          // Campos antigos mantidos para compatibilidade
          serviceName: selectedProcedures.map(p => p.name).join(", "),
          servicePrice: totalPrice,
        },
        uid,
        contactUid: contactUid || '', // ✅ ID do cliente para rastreamento
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'pendente',
        convertedToService: false,

        // ⚠️ CAMPOS DE COMPATIBILIDADE (Mantendo padrão do App Mobile)
        // O App grava esses campos na raiz para suportar versões legadas e listagens antigas
        clientId: contactUid || '',
        clientName: clientData.name,
        clientPhone: clientData.phone,
        clientEmail: clientData.email || '',
        professionalId: selectedProfessional?.id || "",
        professionalName: selectedProfessional?.name || "",
        professionalSpecialty: selectedProfessional?.specialty || '',
        services: selectedProcedures.map(p => ({
          id: p.id,
          name: p.name,
          price: typeof p.price === 'string' ? parseInt(p.price) : (p.price || 0),
          duration: p.duration || 0
        })),
        date: format(appointmentData.date, 'yyyy-MM-dd'),
        time: appointmentData.startTime || '',
        duration: totalDuration,
        observations: appointmentData.observations || '',
        totalPrice: totalPrice,
      };

      if (appointmentId) {
        // Atualizar agendamento existente
        const appointmentRef = doc(database, "Appointments", appointmentId);
        await setDoc(appointmentRef, appointmentDoc);
        // Disparar automação (não bloqueante)
        try {
          await triggerAppointmentConfirmationSite({
            appointmentId,
            client: {
              name: clientData.name,
              phone: clientData.phone,
              email: clientData.email,
            },
            appointment: {
              date: format(appointmentData.date, 'yyyy-MM-dd'),
              startTime: appointmentData.startTime || "",
              endTime: appointmentData.endTime || "",
              observations: appointmentData.observations,
              professionalName: selectedProfessional?.name,
              services: selectedProcedures.map(p => ({ id: p.id, name: p.name, price: p.price })),
              totalPrice: totalPrice,
            },
            user: {
              id: uid || "",
              name: userData?.name,
              email: userData?.email,
              phone: userData?.phone,
            },
          });
        } catch {}
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        // Criar novo agendamento
        const created = await addDoc(collection(database, "Appointments"), appointmentDoc);
        const newId = created.id;
        // Disparar automação (não bloqueante)
        try {
          await triggerAppointmentConfirmationSite({
            appointmentId: newId,
            client: {
              name: clientData.name,
              phone: clientData.phone,
              email: clientData.email,
            },
            appointment: {
              date: format(appointmentData.date, 'yyyy-MM-dd'),
              startTime: appointmentData.startTime || "",
              endTime: appointmentData.endTime || "",
              observations: appointmentData.observations,
              professionalName: selectedProfessional?.name,
              services: selectedProcedures.map(p => ({ id: p.id, name: p.name, price: p.price })),
              totalPrice: totalPrice,
            },
            user: {
              id: uid || "",
              name: userData?.name,
              email: userData?.email,
              phone: userData?.phone,
            },
          });
        } catch {}
        toast.success("Agendamento criado com sucesso!");
      }
      
      router.push("/dashboard/agenda");
    } catch (error) {
      console.error("Erro ao criar/atualizar agendamento:", error);
      toast.error("Erro ao criar/atualizar agendamento!");
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/agenda/novo?id=${id}`);
  };

  const formatAppointmentPrice = (price: number | string | undefined) => {
    return formatCurrencyFromCents(price);
  };

  const resetAllForms = () => {
    clientForm.reset();
    appointmentForm.reset();
    setSelectedProcedures([]);
    setSelectedProfessional(null);
    setSelectedClientId(null);
    setContactId(null);
    setClientImageInfo({
      existing: 0,
      remaining: 0,
      limit: 0
    });
    setClientCountInfo({
      current: 0,
      remaining: 0,
      limit: 0
    });
  };

  const renderProgressDots = () => (
    <div className="flex justify-center space-x-2 mb-6">
      {[1, 2, 3].map((step) => (
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
              placeholder="Nome completo do cliente"
              style={{ textIndent: '2.0rem' }}
              value={clientForm.watch("name") || ""}
              onChange={(e) => {
                clientForm.setValue("name", e.target.value);
                setClientDataModified(true);
              }}
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
              placeholder="CPF"
              style={{ textIndent: '2.0rem' }}
              maxLength={14}
              value={clientForm.watch("cpf") || ""}
              onChange={(e) => {
                const maskedValue = cpfMask(e.target.value);
                if (maskedValue.length <= 14) {
                  clientForm.setValue("cpf", maskedValue);
                  setClientDataModified(true);
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
              placeholder="Celular"
              style={{ textIndent: '2.0rem' }}
              maxLength={15}
              value={clientForm.watch("phone") || ""}
              onChange={(e) => {
                const maskedValue = phoneMask(e.target.value);
                if (maskedValue.length <= 15) {
                  clientForm.setValue("phone", maskedValue);
                  setClientDataModified(true);
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
              placeholder="E-mail"
              style={{ textIndent: '2.0rem' }}
              value={clientForm.watch("email") || ""}
              onChange={(e) => {
                clientForm.setValue("email", e.target.value);
                setClientDataModified(true);
              }}
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

  const renderStep2 = () => (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
        Informações do Agendamento
      </h2>
      
      <form onSubmit={appointmentForm.handleSubmit(handleAppointmentSubmit)} className="space-y-4">
        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              value={selectedProcedures.length > 0 ? selectedProcedures.map(p => p.name).join(", ") : ""}
              placeholder="Adicionar procedimento"
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
              placeholder="Profissional (você está selecionado automaticamente)"
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
          {selectedProfessional && (
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <CheckCircle className="h-3 w-3 mr-1" />
              Você está selecionado como profissional
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              {...appointmentForm.register("startTime")}
              placeholder="Horário"
              style={{ textIndent: '2.0rem', paddingRight: '40px' }}
              maxLength={5}
              onChange={(e) => {
                const value = e.target.value;
                const maskedValue = horaMask(value);
                if (maskedValue.length <= 5) {
                  appointmentForm.setValue("startTime", maskedValue);
                  handleStartTimeChange(maskedValue);
                }
              }}
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <CalendarIcon2 className="h-5 w-5 text-gray-400" />
            </div>
            <Popover open={showCalendar} onOpenChange={setShowCalendar}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal pl-12 ",
                    !appointmentForm.watch("date") && "text-muted-foreground"
                  )}
                  style={{ textIndent: '1.5rem' }} 
                >
                  {appointmentForm.watch("date") ? (
                    format(appointmentForm.watch("date"), "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                  <CalendarIcon2 className="ml-auto h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={appointmentForm.watch("date")}
                  onSelect={(date) => {
                    if (date) {
                      appointmentForm.setValue("date", date);
                      setShowCalendar(false);
                    }
                  }}
                  initialFocus
                  className="rounded-md border"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div>
          <div className="relative">
            <div style={{ position: 'absolute', left: '12px', top: '10px', pointerEvents: 'none' }}>
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
            <Textarea
              {...appointmentForm.register("observations")}
              placeholder="Observações (opcional)"
              style={{ textIndent: '2.0rem' }}
            />
          </div>
        </div>

        <div className="flex space-x-4">
          <Button
            type="button"
            onClick={goBack}
            className="flex-1 bg-pink-500 hover:bg-pink-600"
          >
            Voltar
          </Button>
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
            Próximo
          </Button>
        </div>
      </form>
    </div>
  );

  const renderStep3 = () => {
    const clientData = clientForm.getValues();
    const appointmentData = appointmentForm.getValues();
    
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-pink-500 text-center mb-6">
          Revisão do Agendamento
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-pink-500 flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5" />
              Dados do Cliente
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-gray-700">Nome: {clientData.name}</p>
              <p className="text-gray-700">Celular: {clientData.phone}</p>
              <p className="text-gray-700">Email: {clientData.email}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-pink-500 flex items-center gap-2 mb-3">
              <CalendarIcon2 className="h-5 w-5" />
              Informações do Agendamento
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-gray-700">Profissional: {selectedProfessional?.name || "Não selecionado"}</p>
              <p className="text-gray-700">Data: {format(appointmentData.date, "dd/MM/yyyy", { locale: ptBR })}</p>
              <p className="text-gray-700">Hora: {appointmentData.startTime}</p>
              <div>
                <p className="font-semibold text-gray-700">Procedimentos:</p>
                <ul className="list-disc list-inside">
                  {selectedProcedures.length > 0 ? (
                    selectedProcedures.map((procedure, index) => (
                      <li key={index}>
                        {procedure.name} - {formatCurrencyFromCents(procedure.price)}
                      </li>
                    ))
                  ) : (
                    <li>Nenhum procedimento selecionado</li>
                  )}
                </ul>
                {selectedProcedures.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="font-bold text-gray-800">
                      Total: {formatCurrencyFromCents(
                        selectedProcedures.reduce((sum, procedure) => {
                          const price = typeof procedure.price === 'string' ? parseInt(procedure.price) : (procedure.price || 0);
                          return sum + price;
                        }, 0)
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={goBack}
              className="w-full sm:flex-1 bg-pink-500 hover:bg-pink-600"
            >
              Voltar
            </Button>
            <Button
              onClick={handleCreateAppointment}
              disabled={isLoading}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (appointmentId ? "Atualizando..." : "Criando...") : (appointmentId ? "Atualizar Agendamento" : "Criar Agendamento")}
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
            {appointmentId ? "Editando Agendamento" : "Novo Agendamento"} - {currentStep === 1 && "Dados do Cliente"}
            {currentStep === 2 && "Informações do Agendamento"}
            {currentStep === 3 && "Revisão"}
          </span>
        </div>

        {/* Progress Dots */}
        {renderProgressDots()}

        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Modals */}
        <CustomModalServices
          visible={showServicesModal}
          onClose={() => setShowServicesModal(false)}
          onConfirm={handleServiceSelect}
          title="Selecione o procedimento"
          onAddProcedure={handleAddProcedure}
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
          title="Selecionar Cliente"
        />

        {/* Modal de Detalhes do Agendamento */}
        <AlertDialog open={showAppointmentDetailsModal} onOpenChange={setShowAppointmentDetailsModal}>
          <AlertDialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <AlertDialogHeader className="flex-shrink-0 relative">
              <div className="absolute top-0 right-0 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAppointmentDetailsModal(false)}
                  className="h-8 w-8 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <AlertDialogTitle className="pr-8 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Detalhes Completo do Agendamento
              </AlertDialogTitle>
              <AlertDialogDescription>
                Informações detalhadas do agendamento selecionado
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="flex-1 overflow-y-auto min-h-0">
              {selectedAppointmentForDetails && (() => {
                const appointment = selectedAppointmentForDetails;
                const appointmentDate = new Date(appointment.appointment?.date || '');
                const price = appointment.appointment?.servicePrice || appointment.appointment?.procedurePrice || 0;
                
                const getStatusConfig = (status: string) => {
                  switch (status) {
                    case 'pendente':
                      return {
                        label: 'PENDENTE',
                        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        bgColor: 'bg-yellow-50',
                        textColor: 'text-yellow-900'
                      };
                    case 'confirmado':
                      return {
                        label: 'CONFIRMADO',
                        className: 'bg-blue-100 text-blue-800 border-blue-200',
                        bgColor: 'bg-blue-50',
                        textColor: 'text-blue-900'
                      };
                    case 'concluido':
                      return {
                        label: 'CONCLUÍDO',
                        className: 'bg-green-100 text-green-800 border-green-200',
                        bgColor: 'bg-green-50',
                        textColor: 'text-green-900'
                      };
                    case 'cancelado':
                      return {
                        label: 'CANCELADO',
                        className: 'bg-red-100 text-red-800 border-red-200',
                        bgColor: 'bg-red-50',
                        textColor: 'text-red-900'
                      };
                    case 'nao_compareceu':
                      return {
                        label: 'NÃO COMPARECEU',
                        className: 'bg-gray-100 text-gray-800 border-gray-200',
                        bgColor: 'bg-gray-50',
                        textColor: 'text-gray-900'
                      };
                    default:
                      return {
                        label: 'PENDENTE',
                        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        bgColor: 'bg-yellow-50',
                        textColor: 'text-yellow-900'
                      };
                  }
                };

                const statusConfig = getStatusConfig(appointment.status);

                return (
                  <div className="space-y-6 pb-4">
                    {/* Header com Status */}
                    <div className={`p-6 rounded-lg border ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">
                            {appointment.appointment?.serviceName || appointment.appointment?.procedureName || 'Serviço'}
                          </h2>
                          <p className="text-lg opacity-80">
                            {appointment.client.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-4 py-2 rounded-full text-sm font-bold border ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                          <p className="text-2xl font-bold mt-2">
                            {formatAppointmentPrice(price)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Informações do Agendamento */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5" />
                        Informações do Agendamento
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Data</p>
                          <p className="font-medium">{format(appointmentDate, "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Horário</p>
                          <p className="font-medium">{appointment.appointment?.startTime} - {appointment.appointment?.endTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Valor Total</p>
                          <p className="font-medium text-lg text-green-600">{formatAppointmentPrice(price)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Serviço</p>
                          <p className="font-medium">{appointment.appointment?.serviceName || appointment.appointment?.procedureName || "Não informado"}</p>
                        </div>
                      </div>
                      {appointment.appointment?.observations && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500">Observações</p>
                          <p className="font-medium bg-white p-3 rounded border">{appointment.appointment.observations}</p>
                        </div>
                      )}
                    </div>

                    {/* Informações do Profissional */}
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações do Profissional
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Nome</p>
                          <p className="font-medium">{appointment.appointment?.professionalName || "Não informado"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Especialidade</p>
                          <p className="font-medium">{(() => {
                            const professional = professionals.find(p => p.id === appointment.appointment?.professionalId);
                            return professional?.specialty || "Não informado";
                          })()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Registro</p>
                          <p className="font-medium">{(() => {
                            const professional = professionals.find(p => p.id === appointment.appointment?.professionalId);
                            return professional?.registrationNumber || "Não informado";
                          })()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Telefone</p>
                          <p className="font-medium">{(() => {
                            const professional = professionals.find(p => p.id === appointment.appointment?.professionalId);
                            return professional?.phone || "Não informado";
                          })()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Informações do Cliente */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informações do Cliente
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Nome</p>
                          <p className="font-medium">{appointment.client.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Telefone</p>
                          <p className="font-medium">{appointment.client.phone || "Não informado"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{appointment.client.email || "Não informado"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">CPF</p>
                          <p className="font-medium">{appointment.client.cpf || "Não informado"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Ações
                      </h3>
                      <div className="flex flex-wrap gap-3 justify-between">
                        {/* Botão Editar - Sempre primeiro */}
                        <Button
                          onClick={() => {
                            setShowAppointmentDetailsModal(false);
                            // Se for um agendamento existente, redireciona para edição
                            if (appointmentId) {
                              handleEdit(appointmentId);
                            }
                          }}
                          variant="outline"
                          className="border-gray-300 px-6 py-3 text-base font-medium hover:bg-gray-50"
                        >
                          <Pencil className="h-5 w-5 mr-2" />
                          Editar
                        </Button>

                        {/* Botões de ação baseados no status */}
                        {appointment.status === 'pendente' && (
                          <>
                            <Button
                              onClick={() => {
                                // Aqui você pode implementar a lógica de confirmação
                                setShowAppointmentDetailsModal(false);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-medium"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Confirmar
                            </Button>
                            <Button
                              onClick={() => {
                                // Aqui você pode implementar a lógica de cancelamento
                                setShowAppointmentDetailsModal(false);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-base font-medium"
                            >
                              <XCircle className="h-5 w-5 mr-2" />
                              Cancelar
                            </Button>
                          </>
                        )}

                        {appointment.status === 'confirmado' && (
                          <>
                            <Button
                              onClick={() => {
                                // Aqui você pode implementar a lógica de conclusão
                                setShowAppointmentDetailsModal(false);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-medium"
                            >
                              <CheckCircleIcon className="h-5 w-5 mr-2" />
                              Concluir
                            </Button>
                            <Button
                              onClick={() => {
                                // Aqui você pode implementar a lógica de não compareceu
                                setShowAppointmentDetailsModal(false);
                              }}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 text-base font-medium"
                            >
                              <XCircle className="h-5 w-5 mr-2" />
                              Não Compareceu
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
} 