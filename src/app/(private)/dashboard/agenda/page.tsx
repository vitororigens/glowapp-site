"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database, storage } from "@/services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Pencil, Trash2, Calendar as CalendarIcon, DollarSign, Search, X, CheckCircle, XCircle, User, ArrowLeft, ArrowRight, FileText, CreditCard, Receipt, AlertTriangle } from "lucide-react";
import { currencyMask } from "@/utils/maks/masks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDateToBrazilian, formatDateTimeToBrazilian } from "@/utils/formater/date";

// Função para formatar valor do agendamento
const formatAppointmentPrice = (price: number | undefined) => {
  if (price === undefined || price === null) return 'R$ 0,00';
  
  // O preço está sempre em centavos, então dividimos por 100
  const valueInReais = price / 100;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valueInReais);
};

interface Appointment {
  id: string;
  client: {
    name: string;
    phone: string;
    email: string;
  };
  appointment: {
    date: string;
    startTime: string;
    endTime: string;
    serviceName?: string;
    servicePrice?: number;
    procedureName?: string;
    procedurePrice?: number;
    professionalName?: string;
    professionalId?: string;
    observations?: string;
  };
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'nao_compareceu';
  createdAt: string;
}

interface Service {
  id: string;
  name: string;
  date: string;
  time: string;
  price: number;
  budget: boolean;
}

interface Transaction {
  id: string;
  description: string;
  date: string;
  value: number;
  type: 'entrada' | 'saida';
}

const normalizeDateStr = (dateStr: string) => {
  try {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  } catch (error) {
    console.error('Erro ao normalizar data:', error);
    return dateStr;
  }
};

// Função para comparar datas ignorando timezone
const isSameDate = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Função para criar uma data local a partir de uma string
const createLocalDate = (dateStr: string) => {
  try {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    // Se for uma data ISO, extrair apenas a parte da data
    const dateOnly = dateStr.split('T')[0];
    const [year, month, day] = dateOnly.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } catch (error) {
    console.error('Erro ao criar data local:', error);
    return new Date(dateStr);
  }
};

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllAppointmentsModal, setShowAllAppointmentsModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);
  const [appointmentToConvert, setAppointmentToConvert] = useState<Appointment | null>(null);
  const [conversionStep, setConversionStep] = useState(1);
  const [statusFilter, setStatusFilter] = useState<Appointment['status'] | 'todos'>('todos');
  
  // Estados para conversão
  const [conversionData, setConversionData] = useState({
    clientCpf: '',
    observations: '',
    beforePhotos: [] as { url: string; description?: string }[],
    afterPhotos: [] as { url: string; description?: string }[],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'before' | 'after' | null>(null);
  
  // Estados para pagamentos (igual ao novo serviço)
  const [payments, setPayments] = useState<Array<{
    method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
    value: string;
    date: string;
    installments?: number;
  }>>([]);
  const [currentPaymentIndex, setCurrentPaymentIndex] = useState(-1);
  const [newPayment, setNewPayment] = useState({
    method: "dinheiro" as "dinheiro" | "pix" | "cartao" | "boleto",
    value: "",
    date: new Date().toISOString().split('T')[0],
    installments: 1 as number | undefined,
  });
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();

  useEffect(() => {
    if (uid) {
      Promise.all([
        fetchAppointments(),
        fetchServices(),
        fetchTransactions()
      ]).finally(() => setIsLoading(false));
    }
  }, [uid]);

  const fetchAppointments = async () => {
    try {
      const appointmentsRef = collection(database, "Appointments");
      const q = query(appointmentsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const appointmentsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: data.status || 'pendente' // Define status padrão se não existir
        };
      }) as Appointment[];
      
      console.log('Agendamentos carregados:', appointmentsData);
      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos!");
    }
  };

  const fetchServices = async () => {
    try {
      const servicesRef = collection(database, "Services");
      const q = query(servicesRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const servicesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Service[];
      
      console.log('Serviços carregados:', servicesData);
      setServices(servicesData);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const transactionsRef = collection(database, "Financial");
      const q = query(transactionsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
      
      console.log('Transações carregadas:', transactionsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
    }
  };

  const hasItemsOnDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return appointments.some(appointment => normalizeDateStr(appointment.appointment.date) === dateStr) ||
           services.some(service => normalizeDateStr(service.date) === dateStr) ||
           transactions.some(transaction => normalizeDateStr(transaction.date) === dateStr);
  };

  const getFilteredItems = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    console.log('Filtrando para a data:', dateStr);
    console.log('Serviços disponíveis:', services);
    console.log('Transações disponíveis:', transactions);

    const filteredAppointments = appointments.filter(appointment => 
      normalizeDateStr(appointment.appointment.date) === dateStr &&
      (appointment.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (appointment.appointment.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'todos' || appointment.status === statusFilter)
    );

    const filteredServices = services.filter(service => {
      const normalizedDate = normalizeDateStr(service.date);
      console.log('Comparando serviço:', service.name, 'Data:', service.date, 'Normalizada:', normalizedDate);
      return normalizedDate === dateStr &&
             !service.budget &&
             service.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredTransactions = transactions.filter(transaction => 
      normalizeDateStr(transaction.date) === dateStr &&
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { filteredAppointments, filteredServices, filteredTransactions };
  };

  const { filteredAppointments, filteredServices, filteredTransactions } = getFilteredItems();

  const handleDeleteClick = (id: string) => {
    setAppointmentToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return;

    try {
      await deleteDoc(doc(database, "Appointments", appointmentToDelete));
      setAppointments(appointments.filter(appointment => appointment.id !== appointmentToDelete));
      toast.success("Agendamento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast.error("Erro ao excluir agendamento!");
    } finally {
      setShowDeleteDialog(false);
      setAppointmentToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setAppointmentToDelete(null);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/agenda/novo?id=${id}`);
  };

  const handleEditService = (id: string) => {
    router.push(`/dashboard/servicos/novo?id=${id}`);
  };

  const handleDeleteServiceClick = async (id: string) => {
    setAppointmentToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleEditTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      router.push(`/dashboard/financeiro/novo?id=${id}&type=${transaction.type === 'entrada' ? 'revenue' : 'expense'}`);
    }
  };

  const handleDeleteTransactionClick = async (id: string) => {
    setAppointmentToDelete(id);
    setShowDeleteDialog(true);
  };

  // Funções para gerenciar status dos agendamentos
  const updateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const appointmentRef = doc(database, "Appointments", appointmentId);
      await updateDoc(appointmentRef, { status: newStatus });
      
      // Atualizar o estado local
      setAppointments(appointments.map(appointment => 
        appointment.id === appointmentId 
          ? { ...appointment, status: newStatus }
          : appointment
      ));
      
      toast.success(`Status atualizado para ${newStatus}!`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status!");
    }
  };

  const openConversionModal = (appointment: Appointment) => {
    setAppointmentToConvert(appointment);
    setConversionStep(1);
    setConversionData({
      clientCpf: '',
      observations: appointment.appointment.observations || '',
      beforePhotos: [],
      afterPhotos: [],
    });
    setPayments([]);
    setNewPayment({
      method: "dinheiro",
      value: "",
      date: new Date().toISOString().split('T')[0],
      installments: 1,
    });
    setCurrentPaymentIndex(-1);
    setShowConversionModal(true);
  };

  // Funções para pagamentos (igual ao novo serviço)
  const totalPrice = appointmentToConvert ? 
    (appointmentToConvert.appointment.servicePrice || appointmentToConvert.appointment.procedurePrice || 0) : 0;

  const totalPaid = payments.reduce((acc, payment) => {
    return acc + Number(payment.value.replace(/\D/g, ''));
  }, 0);

  const handlePaymentMethodChange = (value: "dinheiro" | "pix" | "cartao" | "boleto") => {
    setNewPayment({
      ...newPayment,
      method: value,
      installments: value === "cartao" ? 1 : undefined
    });
  };

  const handleEditPayment = (index: number) => {
    const payment = payments[index];
    setNewPayment({
      method: payment.method,
      value: payment.value,
      date: payment.date,
      installments: payment.installments || 1
    });
    setCurrentPaymentIndex(index);
  };

  const handleRemovePayment = (index: number) => {
    const newPayments = payments.filter((_, i) => i !== index);
    setPayments(newPayments);
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
      toast.error(`O valor total dos pagamentos (${currencyMask(adjustedTotalPaid + value)}) não pode exceder o valor do serviço (${currencyMask(totalPrice)})`);
      return;
    }

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
      date: new Date().toISOString().split('T')[0],
      installments: 1,
    });
  };

  // Função para upload de arquivos
  const handleFileUpload = async (files: FileList | null, type: 'before' | 'after') => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    try {
      const uploadedFiles = [];
      
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
        setConversionData(prev => ({
          ...prev,
          beforePhotos: [...prev.beforePhotos, ...uploadedFiles]
        }));
      } else {
        setConversionData(prev => ({
          ...prev,
          afterPhotos: [...prev.afterPhotos, ...uploadedFiles]
        }));
      }
      
      toast.success(`${uploadedFiles.length} foto(s) enviada(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload das fotos!');
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  // Função para remover arquivos
  const handleRemoveFile = (type: 'before' | 'after', index: number) => {
    if (type === 'before') {
      setConversionData(prev => ({
        ...prev,
        beforePhotos: prev.beforePhotos.filter((_, i) => i !== index)
      }));
    } else {
      setConversionData(prev => ({
        ...prev,
        afterPhotos: prev.afterPhotos.filter((_, i) => i !== index)
      }));
    }
  };

  const convertToService = async (appointment: Appointment) => {
    try {
      // Criar um novo serviço baseado no agendamento
      const serviceData = {
        uid: uid,
        name: appointment.appointment.serviceName || appointment.appointment.procedureName || 'Serviço convertido',
        date: appointment.appointment.date,
        time: appointment.appointment.startTime,
        price: appointment.appointment.servicePrice || appointment.appointment.procedurePrice || 0,
        budget: false,
        clientName: appointment.client.name,
        clientPhone: appointment.client.phone,
        clientEmail: appointment.client.email,
        clientCpf: conversionData.clientCpf,
        professionalName: appointment.appointment.professionalName,
        professionalId: appointment.appointment.professionalId,
        observations: conversionData.observations,
        payments: payments.map(payment => ({
          method: payment.method,
          value: payment.value.replace(/\D/g, ''),
          date: payment.date,
          installments: payment.installments
        })),
        beforePhotos: conversionData.beforePhotos,
        afterPhotos: conversionData.afterPhotos,
        convertedFromAppointment: true,
        createdAt: new Date().toISOString()
      };

      // Adicionar o serviço
      const servicesRef = collection(database, "Services");
      const docRef = await addDoc(servicesRef, serviceData);
      
      // Excluir o agendamento
      await deleteDoc(doc(database, "Appointments", appointment.id));
      
      // Atualizar estados locais
      setServices([...services, { id: docRef.id, ...serviceData }]);
      setAppointments(appointments.filter(a => a.id !== appointment.id));
      
      toast.success("Agendamento convertido para serviço com sucesso!");
      setShowConversionModal(false);
      setAppointmentToConvert(null);
    } catch (error) {
      console.error("Erro ao converter para serviço:", error);
      toast.error("Erro ao converter para serviço!");
    }
  };

  const todayAppointments = appointments.filter(appointment => {
    const appointmentLocalDate = createLocalDate(appointment.appointment.date);
    return isSameDate(appointmentLocalDate, new Date());
  }).length;

  // Componente para renderizar o card de agendamento
  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const getStatusConfig = (status: Appointment['status']) => {
      switch (status) {
        case 'pendente':
          return {
            label: 'PENDENTE',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-700',
            borderColor: 'border-orange-200'
          };
        case 'confirmado':
          return {
            label: 'CONFIRMADO',
            bgColor: 'bg-blue-100',
            textColor: 'text-blue-700',
            borderColor: 'border-blue-200'
          };
        case 'concluido':
          return {
            label: 'CONCLUÍDO',
            bgColor: 'bg-green-100',
            textColor: 'text-green-700',
            borderColor: 'border-green-200'
          };
        case 'cancelado':
          return {
            label: 'CANCELADO',
            bgColor: 'bg-red-100',
            textColor: 'text-red-700',
            borderColor: 'border-red-200'
          };
        case 'nao_compareceu':
          return {
            label: 'NÃO COMPARECEU',
            bgColor: 'bg-gray-100',
            textColor: 'text-gray-700',
            borderColor: 'border-gray-200'
          };
        default:
          return {
            label: 'PENDENTE',
            bgColor: 'bg-orange-100',
            textColor: 'text-orange-700',
            borderColor: 'border-orange-200'
          };
      }
    };

    const statusConfig = getStatusConfig(appointment.status);

    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-lg">{appointment.client.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor} border`}>
            {statusConfig.label}
          </span>
        </div>
        
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
                                    <span>{formatDateToBrazilian(appointment.appointment.date)} às {appointment.appointment.startTime}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span>{appointment.appointment.professionalName || 'Não especificado'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-blue-600">
              {formatAppointmentPrice(appointment.appointment.servicePrice || appointment.appointment.procedurePrice)}
            </span>
          </div>
        </div>

        {/* Ações baseadas no status */}
        <div className="mt-4">
          {appointment.status === 'pendente' && (
            <div className="flex gap-2">
              <Button
                onClick={() => updateAppointmentStatus(appointment.id, 'confirmado')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
              <Button
                onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}

          {appointment.status === 'confirmado' && (
            <div className="flex gap-2">
              <Button
                onClick={() => updateAppointmentStatus(appointment.id, 'concluido')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir
              </Button>
              <Button
                onClick={() => updateAppointmentStatus(appointment.id, 'nao_compareceu')}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Não Compareceu
              </Button>
            </div>
          )}

                  {appointment.status === 'concluido' && (
          <Button
            onClick={() => openConversionModal(appointment)}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white"
          >
            Converter para Serviço
          </Button>
        )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas e botão */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Agenda</h1>
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Agendamentos totais</h3>
                  <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Hoje</h3>
                  <p className="text-2xl font-bold text-gray-900">{todayAppointments}</p>
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => router.push('/dashboard/agenda/novo')} className="bg-blue-600 hover:bg-blue-700">
            Novo Agendamento
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-6 gap-6">
        {/* Calendário Anual */}
        <div className="xl:col-span-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">Calendário Anual {new Date().getFullYear()}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Legenda:</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                  <span className="text-xs text-gray-600">Com agendamento</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 12 }, (_, monthIndex) => {
                const month = monthIndex + 1;
                const currentYear = new Date().getFullYear();
                const monthName = new Date(currentYear, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' });
                const isSelectedMonth = selectedDate.getMonth() === month - 1;
                const isCurrentMonth = new Date().getMonth() === month - 1 && new Date().getFullYear() === currentYear;
                
                const appointmentsInMonth = appointments.filter(appointment => {
                  const appointmentLocalDate = createLocalDate(appointment.appointment.date);
                  return appointmentLocalDate.getMonth() === month - 1 && appointmentLocalDate.getFullYear() === currentYear;
                }).length;

                return (
                  <div
                    key={month}
                    onClick={() => {
                      const newDate = new Date(currentYear, month - 1, 1);
                      setSelectedDate(newDate);
                    }}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md
                      ${isSelectedMonth ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                      ${isCurrentMonth ? 'ring-2 ring-blue-200' : ''}
                    `}
                  >
                    <h3 className="text-sm font-semibold text-gray-900 text-center">
                      {monthName.toUpperCase()}
                    </h3>
                    <div className="mt-3 flex items-center justify-center">
                      {appointmentsInMonth > 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                          <span className="text-xs font-medium text-gray-600">
                            {appointmentsInMonth} agendamento{appointmentsInMonth > 1 ? 's' : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 text-center">Sem agendamentos</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Calendário Mensal e Agendamentos */}
        <div className="xl:col-span-2">
          <Card className="p-6 w-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Agenda de {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
            </div>

            {/* Calendário Mensal */}
            <div className="mb-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const year = selectedDate.getFullYear();
                  const month = selectedDate.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                  
                  const days = [];
                  for (let i = 0; i < 42; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    
                    const isCurrentMonth = currentDate.getMonth() === month;
                    const isToday = isSameDate(currentDate, new Date());
                    const isSelected = isSameDate(currentDate, selectedDate);
                    
                    const hasAppointments = appointments.some(appointment => {
                      const appointmentLocalDate = createLocalDate(appointment.appointment.date);
                      return isSameDate(appointmentLocalDate, currentDate);
                    });
                    
                    days.push(
                      <div
                        key={i}
                        onClick={() => {
                          if (isCurrentMonth) {
                            setSelectedDate(currentDate);
                          }
                        }}
                        className={`
                          aspect-square p-1 text-center text-xs cursor-pointer rounded transition-all
                          ${isCurrentMonth ? 'hover:bg-gray-100' : 'text-gray-300'}
                          ${isToday ? 'bg-blue-100 font-semibold' : ''}
                          ${isSelected ? 'bg-blue-500 text-white' : ''}
                          ${hasAppointments && isCurrentMonth ? 'bg-pink-100 border-pink-300' : ''}
                          ${!isCurrentMonth ? 'cursor-default' : ''}
                        `}
                      >
                        <div className="relative">
                          <span>{currentDate.getDate()}</span>
                          {hasAppointments && isCurrentMonth && (
                            <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-pink-400 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return days;
                })()}
              </div>
            </div>

            {/* Lista de Agendamentos */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Agendamentos
                </h3>
                <div className="flex items-center gap-2">
                  <Search className="h-3 w-3 text-gray-400" />
                  <Input
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-32 h-7 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllAppointmentsModal(true)}
                    className="h-7 text-xs"
                  >
                    Ver tudo
                  </Button>
                </div>
              </div>

              {/* Filtros de Status */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={statusFilter === 'todos' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('todos')}
                    className="h-6 text-xs px-2"
                  >
                    Todos
                  </Button>
                  <Button
                    variant={statusFilter === 'pendente' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('pendente')}
                    className={`h-6 text-xs px-2 ${
                      statusFilter === 'pendente' 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                        : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200'
                    }`}
                  >
                    Pendente
                  </Button>
                  <Button
                    variant={statusFilter === 'confirmado' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('confirmado')}
                    className={`h-6 text-xs px-2 ${
                      statusFilter === 'confirmado' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200'
                    }`}
                  >
                    Confirmado
                  </Button>
                  <Button
                    variant={statusFilter === 'concluido' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('concluido')}
                    className={`h-6 text-xs px-2 ${
                      statusFilter === 'concluido' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200'
                    }`}
                  >
                    Concluído
                  </Button>
                  <Button
                    variant={statusFilter === 'cancelado' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('cancelado')}
                    className={`h-6 text-xs px-2 ${
                      statusFilter === 'cancelado' 
                        ? 'bg-red-600 hover:bg-red-700 text-white' 
                        : 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200'
                    }`}
                  >
                    Cancelado
                  </Button>
                  <Button
                    variant={statusFilter === 'nao_compareceu' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter('nao_compareceu')}
                    className={`h-6 text-xs px-2 ${
                      statusFilter === 'nao_compareceu' 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                    }`}
                  >
                    Não Compareceu
                  </Button>
                </div>
              </div>
            
              <ScrollArea className="h-[300px] pr-4">
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-12 bg-gray-100 animate-pulse rounded-lg" />
                    ))}
                  </div>
                ) : filteredAppointments.length === 0 && filteredServices.length === 0 && filteredTransactions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Nenhum agendamento para esta data.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAppointments.length > 0 && (
                      <div className="space-y-3">
                        {filteredAppointments
                          .sort((a, b) => {
                            // Ordenar por horário
                            const timeA = a.appointment.startTime || '00:00';
                            const timeB = b.appointment.startTime || '00:00';
                            return timeA.localeCompare(timeB);
                          })
                          .map((appointment) => (
                            <AppointmentCard key={appointment.id} appointment={appointment} />
                          ))}
                      </div>
                    )}

                    {filteredServices.length > 0 && (
                      <div className="space-y-2">
                        {filteredServices.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm mb-2">{service.name}</h3>
                              <div className="text-xs text-gray-600">
                                <span className="font-medium text-gray-700">Valor:</span>
                                <span className="ml-1 text-blue-600 font-medium">
                                  {currencyMask(service.price)}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditService(service.id)}
                                className="hover:bg-gray-200 h-8 w-8"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteServiceClick(service.id)}
                                className="hover:bg-red-100 hover:text-red-600 h-8 w-8"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredTransactions.length > 0 && (
                      <div className="space-y-2">
                        {filteredTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm mb-2">{transaction.description}</h3>
                              <div className="text-xs text-gray-600">
                                <span className="font-medium text-gray-700">Valor:</span>
                                <span className={`ml-1 font-medium ${transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                                  {transaction.type === 'entrada' ? '+' : '-'} {currencyMask(transaction.value.toString())}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditTransaction(transaction.id)}
                                className="hover:bg-gray-200 h-8 w-8"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteTransactionClick(transaction.id)}
                                className="hover:bg-red-100 hover:text-red-600 h-8 w-8"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o item selecionado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 mt-2">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Ver Todos os Agendamentos */}
      <AlertDialog open={showAllAppointmentsModal} onOpenChange={setShowAllAppointmentsModal}>
        <AlertDialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <AlertDialogHeader className="flex-shrink-0 relative">
            <div className="absolute top-0 right-0 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAllAppointmentsModal(false)}
                className="h-8 w-8 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogTitle>
              Todos os Agendamentos - {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Lista completa de agendamentos organizados por horário
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {/* Filtros de Status no Modal */}
            <div className="mb-4 p-4 border-b">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === 'todos' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('todos')}
                  className="h-7 text-xs px-3"
                >
                  Todos
                </Button>
                <Button
                  variant={statusFilter === 'pendente' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('pendente')}
                  className={`h-7 text-xs px-3 ${
                    statusFilter === 'pendente' 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                      : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200'
                  }`}
                >
                  Pendente
                </Button>
                <Button
                  variant={statusFilter === 'confirmado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('confirmado')}
                  className={`h-7 text-xs px-3 ${
                    statusFilter === 'confirmado' 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200'
                  }`}
                >
                  Confirmado
                </Button>
                <Button
                  variant={statusFilter === 'concluido' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('concluido')}
                  className={`h-7 text-xs px-3 ${
                    statusFilter === 'concluido' 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-green-100 hover:bg-green-200 text-green-700 border-green-200'
                  }`}
                >
                  Concluído
                </Button>
                <Button
                  variant={statusFilter === 'cancelado' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('cancelado')}
                  className={`h-7 text-xs px-3 ${
                    statusFilter === 'cancelado' 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200'
                  }`}
                >
                  Cancelado
                </Button>
                <Button
                  variant={statusFilter === 'nao_compareceu' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('nao_compareceu')}
                  className={`h-7 text-xs px-3 ${
                    statusFilter === 'nao_compareceu' 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                  }`}
                >
                  Não Compareceu
                </Button>
              </div>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum agendamento para esta data.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments
                  .sort((a, b) => {
                    const timeA = a.appointment.startTime || '00:00';
                    const timeB = b.appointment.startTime || '00:00';
                    return timeA.localeCompare(timeB);
                  })
                  .map((appointment) => (
                    <AppointmentCard key={appointment.id} appointment={appointment} />
                  ))}
              </div>
            )}
          </div>
          
          <AlertDialogFooter className="flex-shrink-0 pt-4">
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Conversão para Serviço */}
      <AlertDialog open={showConversionModal} onOpenChange={setShowConversionModal}>
        <AlertDialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <AlertDialogHeader className="flex-shrink-0 relative">
            <div className="absolute top-0 right-0 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowConversionModal(false)}
                className="h-8 w-8 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Converter Agendamento para Serviço
            </AlertDialogTitle>
            <AlertDialogDescription>
              Preencha os dados para converter o agendamento em um serviço
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Progress Steps */}
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${conversionStep >= step ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-600'}
                  `}>
                    {step}
                  </div>
                  {step < 5 && (
                    <div className={`
                      w-12 h-0.5 mx-2
                      ${conversionStep > step ? 'bg-pink-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {appointmentToConvert && (
              <>
                {/* Etapa 1: Dados do Cliente */}
                {conversionStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Dados do Cliente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientName">Nome Completo</Label>
                        <Input
                          id="clientName"
                          value={appointmentToConvert.client.name}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientPhone">Telefone</Label>
                        <Input
                          id="clientPhone"
                          value={appointmentToConvert.client.phone}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          value={appointmentToConvert.client.email}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientCpf">CPF</Label>
                        <Input
                          id="clientCpf"
                          placeholder="Digite o CPF do cliente"
                          value={conversionData.clientCpf}
                          onChange={(e) => setConversionData(prev => ({
                            ...prev,
                            clientCpf: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Etapa 2: Informações do Procedimento */}
                {conversionStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Informações do Procedimento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="procedureName">Nome do Procedimento</Label>
                        <Input
                          id="procedureName"
                          value={appointmentToConvert.appointment.serviceName || appointmentToConvert.appointment.procedureName || ''}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="procedurePrice">Valor</Label>
                        <Input
                          id="procedurePrice"
                          value={formatAppointmentPrice(appointmentToConvert.appointment.servicePrice || appointmentToConvert.appointment.procedurePrice)}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="professionalName">Profissional</Label>
                        <Input
                          id="professionalName"
                          value={appointmentToConvert.appointment.professionalName || ''}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="procedureDate">Data</Label>
                        <Input
                          id="procedureDate"
                          value={appointmentToConvert.appointment.date}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Etapa 3: Pagamento e Financeiro */}
                {conversionStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Pagamento e Financeiro</h3>
                    
                    <Card className="p-4">
                      <h3 className="text-lg font-medium mb-2">Formas de Pagamento</h3>
                      
                      <div className="bg-gray-50 p-3 rounded-md mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span>Valor total do serviço:</span>
                          <span className="font-semibold">{currencyMask(totalPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total pago:</span>
                          <span className="font-semibold text-green-600">
                            {currencyMask(totalPaid)}
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
                              value={newPayment.value === currencyMask(totalPrice) ? "full" : "partial"}
                              onValueChange={(value) => {
                                if (value === "full") {
                                  setNewPayment({...newPayment, value: currencyMask(totalPrice)});
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
                              disabled={newPayment.value === currencyMask(totalPrice)}
                            />
                          </div>
                        </div>

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
                  </div>
                )}

                {/* Etapa 4: Observações e Anexos */}
                {conversionStep === 4 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Observações e Anexos</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="observations">Observações</Label>
                        <Textarea
                          id="observations"
                          placeholder="Digite observações sobre o serviço..."
                          rows={4}
                          value={conversionData.observations}
                          onChange={(e) => setConversionData(prev => ({
                            ...prev,
                            observations: e.target.value
                          }))}
                        />
                      </div>

                      {/* Fotos Antes */}
                      <Card className="p-4">
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
                            {conversionData.beforePhotos.length === 0 ? (
                              <div className="col-span-3 text-center py-8 text-gray-500">
                                Nenhuma foto adicionada
                              </div>
                            ) : (
                              conversionData.beforePhotos.map((photo, index) => (
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

                      {/* Fotos Depois */}
                      <Card className="p-4">
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
                            {conversionData.afterPhotos.length === 0 ? (
                              <div className="col-span-3 text-center py-8 text-gray-500">
                                Nenhuma foto adicionada
                              </div>
                            ) : (
                              conversionData.afterPhotos.map((photo, index) => (
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
                    </div>
                  </div>
                )}

                {/* Etapa 5: Revisão e Confirmação */}
                {conversionStep === 5 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Revisão e Confirmação</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Dados do Cliente */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Dados do Cliente
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                          <p><strong>Nome:</strong> {appointmentToConvert.client.name}</p>
                          <p><strong>Telefone:</strong> {appointmentToConvert.client.phone}</p>
                          <p><strong>Email:</strong> {appointmentToConvert.client.email}</p>
                        </div>
                      </div>

                      {/* Informações do Procedimento */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Informações do Procedimento
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                          <p><strong>Procedimento:</strong> {appointmentToConvert.appointment.serviceName || appointmentToConvert.appointment.procedureName}</p>
                          <p><strong>Valor:</strong> {formatAppointmentPrice(appointmentToConvert.appointment.servicePrice || appointmentToConvert.appointment.procedurePrice)}</p>
                          <p><strong>Profissional:</strong> {appointmentToConvert.appointment.professionalName}</p>
                          <p><strong>Data:</strong> {formatDateToBrazilian(appointmentToConvert.appointment.date)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Atenção:</strong> Ao confirmar, o agendamento será convertido em serviço e removido da agenda.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botões de Navegação */}
          <AlertDialogFooter className="flex-shrink-0 pt-4">
            <div className="flex justify-between w-full">
              <Button
                variant="outline"
                onClick={() => {
                  if (conversionStep > 1) {
                    setConversionStep(conversionStep - 1);
                  } else {
                    setShowConversionModal(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {conversionStep === 1 ? 'Cancelar' : 'Anterior'}
              </Button>
              
              <div className="flex gap-2">
                {conversionStep < 5 ? (
                  <Button
                    onClick={() => setConversionStep(conversionStep + 1)}
                    className="flex items-center gap-2"
                  >
                    Próximo
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => appointmentToConvert && convertToService(appointmentToConvert)}
                    className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700"
                  >
                    <FileText className="h-4 w-4" />
                    Converter para Serviço
                  </Button>
                )}
              </div>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}