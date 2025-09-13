"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { z } from "zod";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dataMask, dataUnMask, horaMask, horaUnMask, phoneMask, cpfMask } from "@/utils/maks/masks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, User, Phone, Mail, Clock, Calendar as CalendarIcon2, FileText, Plus, ArrowLeft, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomModalServices } from "@/components/CustomModalServices";
import { CustomModalProfessionals } from "@/components/CustomModalProfessionals";
import { CustomModalClients } from "@/components/CustomModalClients";
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
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('id');

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

  // Carregar dados
  useEffect(() => {
    if (uid) {
      loadServices();
      loadProcedures();
      loadProfessionals();
    }
  }, [uid]);

  // Carregar dados do agendamento para edição
  useEffect(() => {
    if (appointmentId && uid && procedures.length > 0 && professionals.length > 0) {
      loadAppointmentForEdit();
    }
  }, [appointmentId, uid, procedures, professionals]);

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
    if (!appointmentId) return;
    
    try {
      const appointmentRef = doc(database, "Appointments", appointmentId);
      const appointmentSnap = await getDoc(appointmentRef);
      
      if (appointmentSnap.exists()) {
        const appointmentData = appointmentSnap.data();
        console.log('Dados do agendamento carregados:', appointmentData);
        
        // Preencher dados do cliente
        if (appointmentData.client) {
          clientForm.setValue("name", appointmentData.client.name || "");
          clientForm.setValue("phone", appointmentData.client.phone || "");
          clientForm.setValue("email", appointmentData.client.email || "");
        }
        
        // Preencher dados do agendamento
        if (appointmentData.appointment) {
          const appointment = appointmentData.appointment;
          
          // Data
          if (appointment.date) {
            // Corrigir problema de fuso horário - criar data local
            const [year, month, day] = appointment.date.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month - 1 porque JavaScript usa 0-11
            appointmentForm.setValue("date", date);
          }
          
          // Horários
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
          
          // Procedimento - buscar na lista de procedimentos
          if (appointment.procedureId) {
            const procedure = procedures.find(p => p.id === appointment.procedureId);
            if (procedure) {
              setSelectedProcedure(procedure);
            }
          }
          
          // Profissional - buscar na lista de profissionais
          if (appointment.professionalId) {
            const professional = professionals.find(p => p.id === appointment.professionalId);
            if (professional) {
              setSelectedProfessional(professional);
            }
          }
        }
        
        // Manter na primeira etapa para permitir edição dos dados do cliente
        setCurrentStep(1);
      }
    } catch (error) {
      console.error("Erro ao carregar agendamento para edição:", error);
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
  const handleClientSubmit = (data: ClientData) => {
    setCurrentStep(2);
  };

  const handleAppointmentSubmit = (data: AppointmentData) => {
    console.log('Dados do formulário de agendamento:', data);
    console.log('Erros do formulário:', appointmentForm.formState.errors);
    setCurrentStep(3);
  };



  const handleServiceSelect = (selectedServiceIds: string[]) => {
    if (selectedServiceIds.length > 0) {
      // Buscar o primeiro serviço selecionado
      const selectedService = procedures.find(p => p.id === selectedServiceIds[0]);
      if (selectedService) {
        setSelectedProcedure(selectedService);
        
        // Calcular horário de fim baseado no procedimento
        const startTime = appointmentForm.getValues("startTime");
        if (startTime) {
          const endTime = calculateEndTime(startTime, { duration: selectedService.duration } as Service);
          appointmentForm.setValue("endTime", endTime);
        }
      }
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

  const handleStartTimeChange = (time: string) => {
    appointmentForm.setValue("startTime", time);
    if (selectedService) {
      const endTime = calculateEndTime(time, selectedService);
      appointmentForm.setValue("endTime", endTime);
    }
  };

  const handleCreateAppointment = async () => {
    if (!uid) return;
    
    setIsLoading(true);
    try {
      const clientData = clientForm.getValues();
      const appointmentData = appointmentForm.getValues();
      
      // Converter o preço para número se for string
      const procedurePrice = selectedProcedure?.price;
      const numericPrice = typeof procedurePrice === 'string' 
        ? parseInt(procedurePrice) || 0 
        : (typeof procedurePrice === 'number' ? procedurePrice : 0);

      const appointmentDoc = {
        client: {
          name: clientData.name,
          phone: clientData.phone,
          email: clientData.email,
          cpf: clientData.cpf,
        },
        appointment: {
          ...appointmentData,
          date: format(appointmentData.date, 'yyyy-MM-dd'),
          serviceName: selectedProcedure?.name || "",
          servicePrice: numericPrice,
          procedureId: selectedProcedure?.id || "",
          procedureName: selectedProcedure?.name || "",
          procedurePrice: numericPrice,
          professionalId: selectedProfessional?.id || "",
          professionalName: selectedProfessional?.name || "",
        },
        uid,
        createdAt: new Date().toISOString(),
        status: 'pendente'
      };

      if (appointmentId) {
        // Atualizar agendamento existente
        const appointmentRef = doc(database, "Appointments", appointmentId);
        await setDoc(appointmentRef, appointmentDoc);
        toast.success("Agendamento atualizado com sucesso!");
      } else {
        // Criar novo agendamento
        await addDoc(collection(database, "Appointments"), appointmentDoc);
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
              value={selectedProcedure?.name || ""}
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
              placeholder="Profissional"
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
              {...appointmentForm.register("startTime")}
              placeholder="Horário"
              style={{ textIndent: '2.0rem', paddingRight: '40px' }}
              onChange={(e) => {
                const value = e.target.value;
                const maskedValue = horaMask(value);
                appointmentForm.setValue("startTime", maskedValue);
                handleStartTimeChange(maskedValue);
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
                <p className="font-semibold text-gray-700">Procedimento:</p>
                <ul className="list-disc list-inside">
                  <li>{selectedProcedure?.name || "Não selecionado"} - R$ {selectedProcedure?.price ? (typeof selectedProcedure.price === 'string' ? (parseInt(selectedProcedure.price) / 100).toFixed(2).replace('.', ',') : (selectedProcedure.price / 100).toFixed(2).replace('.', ',')) : "0,00"}</li>
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
              onClick={handleCreateAppointment}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
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
          onSelect={(client) => {
            clientForm.setValue("name", client.name || "");
            clientForm.setValue("phone", phoneMask(client.phone || ""));
            clientForm.setValue("cpf", cpfMask(client.cpf || ""));
            if (client.email) {
              clientForm.setValue("email", client.email);
            }
            setShowClientsModal(false);
          }}
          title="Selecionar Cliente"
        />
      </div>
    </div>
  );
} 