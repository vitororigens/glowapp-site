"use client";

import { useState, useEffect, Fragment } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database, storage } from "@/services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, addDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addDays, subDays, startOfMonth, endOfMonth, isSameMonth, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Pencil, Trash2, Calendar as CalendarIcon,  Search, X, CheckCircle, XCircle, User, ArrowLeft, ArrowRight, FileText, CreditCard, Receipt, AlertTriangle, Filter, Settings, HelpCircle, MessageCircle, ChevronLeft, ChevronRight, Clock, Users, Eye, List, Grid3X3, DollarSign } from "lucide-react";
import { currencyMask, formatCurrencyFromCents, normalizeValueToCents } from "@/utils/maks/masks";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
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
const formatAppointmentPrice = (price: number | string | undefined) => {
  return formatCurrencyFromCents(price);
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
    procedureIds?: string[];
    procedureNames?: string[];
    procedureCodes?: string[];
    procedurePrices?: number[];
    totalPrice?: number;
    professionalName?: string;
    professionalId?: string;
    observations?: string;
  };
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'nao_compareceu';
  createdAt: string;
}

interface Professional {
  id: string;
  name: string;
  specialty?: string;
}

type ViewMode = 'dia' | 'semana' | 'mes' | 'lista';

interface Service {
  id: string;
  name: string;
  date: string;
  time: string;
  price: number;
  budget: boolean;
  beforePhotos?: Array<{ url: string; description?: string }>;
  afterPhotos?: Array<{ url: string; description?: string }>;
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
  const [professionals, setProfessionals] = useState<Professional[]>([]);
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
  const [showDayAppointmentsModal, setShowDayAppointmentsModal] = useState(false);
  const [selectedDayForModal, setSelectedDayForModal] = useState<Date | null>(null);
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false);
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<Appointment | null>(null);
  
  // Novos estados para o design moderno
  const [viewMode, setViewMode] = useState<ViewMode>('semana');
  const [selectedProfessional, setSelectedProfessional] = useState<string>('todos');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  
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
  const { planLimits, canAddImageToClient, getRemainingImagesForClient } = usePlanLimitations();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (uid) {
      console.log('🔄 Iniciando carregamento de dados para UID:', uid);
      Promise.all([
        fetchAppointments(),
        fetchServices(),
        fetchTransactions(),
        fetchProfessionals()
      ]).finally(() => {
        console.log('✅ Carregamento de dados concluído');
        setIsLoading(false);
      });
    } else {
      console.log('❌ UID não disponível, não carregando dados');
    }
  }, [uid]);

  // Detectar parâmetro convert na URL e abrir modal automaticamente
  useEffect(() => {
    const convertId = searchParams.get('convert');
    if (convertId && appointments.length > 0) {
      const appointmentToConvert = appointments.find(apt => apt.id === convertId);
      if (appointmentToConvert) {
        openConversionModal(appointmentToConvert);
        // Limpar o parâmetro da URL
        router.replace('/dashboard/agenda');
      }
    }
  }, [searchParams, appointments, router]);

  // Fechar menu de filtros quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterMenu) {
        const target = event.target as Element;
        if (!target.closest('.filter-menu-container')) {
          setShowFilterMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterMenu]);

  // ✅ Função para normalizar dados antigos e novos
  const normalizeAppointmentData = (data: any, docId: string): Appointment | null => {
    try {
      // Verificar estrutura mínima
      const hasNewStructure = data.client && data.appointment;
      const hasOldStructure = data.clientName && (data.date || data.time);
      
      if (!hasNewStructure && !hasOldStructure) {
        console.warn('⚠️ Estrutura de dados inválida:', docId);
        return null;
      }

      // Normalizar data (DD/MM/YYYY → YYYY-MM-DD)
      const normalizeDate = (dateStr: string) => {
        if (!dateStr) return format(new Date(), 'yyyy-MM-dd');
        if (dateStr.includes('/')) {
          const [day, month, year] = dateStr.split('/');
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        return dateStr;
      };

      // Estrutura normalizada
      const normalized: Appointment = {
        id: docId,
        client: {
          name: data.client?.name || data.clientName || '',
          phone: data.client?.phone || data.clientPhone || '',
          email: data.client?.email || data.clientEmail || '',
        },
        appointment: {
          // ✅ Data normalizada (sempre YYYY-MM-DD)
          date: data.appointment?.date 
            ? normalizeDate(data.appointment.date)
            : normalizeDate(data.date || ''),
          // ✅ Horários
          startTime: data.appointment?.startTime || data.time || '',
          endTime: data.appointment?.endTime || '',
          // ✅ Nomes e IDs
          serviceName: data.appointment?.serviceName || '',
          servicePrice: data.appointment?.servicePrice || data.appointment?.totalPrice || 0,
          procedureName: data.appointment?.procedureName || '',
          procedurePrice: data.appointment?.procedurePrice || 0,
          // ✅ Arrays (novo padrão)
          procedureIds: data.appointment?.procedureIds || [],
          procedureNames: data.appointment?.procedureNames || [],
          procedureCodes: data.appointment?.procedureCodes || [],
          procedurePrices: data.appointment?.procedurePrices || [],
          totalPrice: data.appointment?.totalPrice || data.totalPrice || 0,
          // ✅ Profissional
          professionalName: data.appointment?.professionalName || data.professionalName || '',
          professionalId: data.appointment?.professionalId || data.professionalId || '',
          // ✅ Extras
          observations: data.appointment?.observations || data.observations || '',
        },
        status: (data.status === 'agendado' || !data.status) ? 'pendente' : data.status,
        createdAt: data.createdAt || new Date().toISOString(),
      };

      return normalized;
    } catch (error) {
      console.error('❌ Erro ao normalizar agendamento:', docId, error);
      return null;
    }
  };

  const fetchAppointments = async () => {
    try {
      console.log('🔍 Buscando agendamentos para UID:', uid);
      const appointmentsRef = collection(database, "Appointments");
      const q = query(appointmentsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      console.log('📊 Total de documentos encontrados:', querySnapshot.docs.length);
      
      const appointmentsData = querySnapshot.docs
        .filter(doc => {
          const data = doc.data();
          
          // Verificar se o UID realmente corresponde
          if (data.uid !== uid) {
            console.warn('⚠️ UID não corresponde! Documento:', doc.id);
            return false;
          }
          
          return true;
        })
        .map(doc => normalizeAppointmentData(doc.data(), doc.id))
        .filter(appointment => appointment !== null) as Appointment[];
      
      console.log('✅ Agendamentos carregados e normalizados:', appointmentsData.length);
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

  const fetchProfessionals = async () => {
    try {
      const professionalsRef = collection(database, "Profissionals");
      const q = query(professionalsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const professionalsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Professional[];
      
      console.log('Profissionais carregados:', professionalsData);
      setProfessionals(professionalsData);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
    }
  };

  const hasItemsOnDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return appointments.some(appointment => 
      appointment.appointment?.date && normalizeDateStr(appointment.appointment.date) === dateStr
    ) ||
           services.some(service => service.date && normalizeDateStr(service.date) === dateStr) ||
           transactions.some(transaction => transaction.date && normalizeDateStr(transaction.date) === dateStr);
  };

  const getFilteredItems = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    console.log('Filtrando para a data:', dateStr);
    console.log('Serviços disponíveis:', services);
    console.log('Transações disponíveis:', transactions);

    const filteredAppointments = appointments.filter(appointment => {
      // Verificar se appointment.appointment existe e tem a propriedade date
      if (!appointment.appointment || !appointment.appointment.date) {
        return false;
      }
      
      // Filtro por data baseado no modo de visualização
      let dateMatches = false;
      if (viewMode === 'dia') {
        dateMatches = normalizeDateStr(appointment.appointment.date) === dateStr;
      } else if (viewMode === 'semana') {
        const appointmentDate = createLocalDate(appointment.appointment.date);
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
        dateMatches = appointmentDate >= weekStart && appointmentDate <= weekEnd;
      } else if (viewMode === 'mes') {
        const appointmentDate = createLocalDate(appointment.appointment.date);
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        dateMatches = appointmentDate >= monthStart && appointmentDate <= monthEnd;
      } else if (viewMode === 'lista') {
        // Para lista, mostrar todos os agendamentos
        dateMatches = true;
      }
      
      // Aplicar filtro de status apenas para visualizações de dia e semana
      // Mas permitir mostrar se o usuário filtrar especificamente por esses status
      const statusFilterApplied = (viewMode === 'dia' || viewMode === 'semana') 
        ? (appointment.status !== 'cancelado' && appointment.status !== 'nao_compareceu') || 
          (statusFilter === 'cancelado' || statusFilter === 'nao_compareceu')
        : true;
      
      return dateMatches &&
        statusFilterApplied &&
        (appointment.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         (appointment.appointment.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'todos' || appointment.status === statusFilter) &&
        (selectedProfessional === 'todos' || appointment.appointment?.professionalId === selectedProfessional)
    });

    const filteredTransactions = transactions.filter(transaction => 
      normalizeDateStr(transaction.date) === dateStr &&
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { filteredAppointments, filteredTransactions };
  };

  const { filteredAppointments, filteredTransactions } = getFilteredItems();

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
      clientCpf: (appointment.client as any).cpf || '',
      observations: appointment.appointment?.observations || '',
      beforePhotos: [],
      afterPhotos: [],
    });
    setPayments([]);
    setNewPayment({
      method: "dinheiro",
      value: "",
      date: new Date().toISOString().split('T')[0],
      installments: undefined,
    });
    setCurrentPaymentIndex(-1);
    setShowConversionModal(true);
  };

  const openDayAppointmentsModal = (day: Date) => {
    setSelectedDayForModal(day);
    setShowDayAppointmentsModal(true);
  };

  const openAppointmentDetailsModal = (appointment: Appointment) => {
    setSelectedAppointmentForDetails(appointment);
    setShowAppointmentDetailsModal(true);
  };

// Funções para pagamentos - todos os valores em centavos
const totalPrice = appointmentToConvert ? 
  normalizeValueToCents(appointmentToConvert.appointment?.servicePrice || appointmentToConvert.appointment?.procedurePrice || 0) : 0;

const totalPaid = payments.reduce((acc, payment) => {
  // Normalizar valor do pagamento para centavos
  return acc + normalizeValueToCents(payment.value);
}, 0);

const formattedTotalPrice = formatCurrencyFromCents(totalPrice);
const formattedTotalPaid = formatCurrencyFromCents(totalPaid);
const formattedPendingBalance = formatCurrencyFromCents(Math.max(totalPrice - totalPaid, 0));

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

    const value = normalizeValueToCents(newPayment.value);
    
    if (value <= 0) {
      toast.error("O valor do pagamento deve ser maior que zero");
      return;
    }

    let adjustedTotalPaid = totalPaid;
    
    if (currentPaymentIndex !== -1) {
      const oldPaymentValue = normalizeValueToCents(payments[currentPaymentIndex].value);
      adjustedTotalPaid = adjustedTotalPaid - oldPaymentValue;
    }
    
  if (adjustedTotalPaid + value > totalPrice) {
    toast.error(`O valor total dos pagamentos (${formatCurrencyFromCents(adjustedTotalPaid + value)}) não pode exceder o valor do serviço (${formattedTotalPrice})`);
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
      installments: undefined,
    });
  };

  // Função para upload de arquivos
  const handleFileUpload = async (files: FileList | null, type: 'before' | 'after') => {
    if (!files || files.length === 0) return;
    
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
      // Verificar limitação de imagens por cliente antes de converter
      if (planLimits) {
        const beforePhotosCount = conversionData.beforePhotos.length;
        const afterPhotosCount = conversionData.afterPhotos.length;
        const totalNewImages = beforePhotosCount + afterPhotosCount;
        
        if (totalNewImages > 0) {
          // Buscar contagem atual de imagens do cliente
          let contactUid: string | undefined = undefined;
          try {
            const contactsRef = collection(database, "Contacts");
            const cpfNumeric = (conversionData.clientCpf || '').replace(/\D/g, '');
            let qContacts;
            if (cpfNumeric) {
              qContacts = query(contactsRef, where("cpf", "==", cpfNumeric));
            } else {
              qContacts = query(contactsRef, where("name", "==", appointment.client.name));
            }
            const contactsSnap = await getDocs(qContacts);
            if (!contactsSnap.empty) {
              contactUid = contactsSnap.docs[0].id;
            }
          } catch (e) {
            console.warn('Não foi possível identificar o contato para validação:', e);
          }

          if (contactUid) {
            // Buscar imagens existentes do cliente
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

            const totalImages = existingImages + totalNewImages;
            
            if (totalImages > planLimits.images) {
              const remaining = Math.max(0, planLimits.images - existingImages);
              toast.error(`Limite de ${planLimits.images} imagens por cliente atingido! Você pode adicionar mais ${remaining} imagens. Faça upgrade para adicionar mais imagens.`);
              return;
            }
          } else {
            // Se não há contactUid, verificar limite geral de imagens
            if (totalNewImages > planLimits.images) {
              toast.error(`Limite de ${planLimits.images} imagens por cliente atingido! Faça upgrade para adicionar mais imagens.`);
              return;
            }
          }
        }
      }

      // Usar o contactUid do agendamento se disponível, senão buscar/criar
      let contactUid: string | null = (appointment as any).contactUid || null;
      
      // Se não temos contactUid do agendamento, buscar ou criar
      if (!contactUid) {
        try {
          const contactsRef = collection(database, "Contacts");
          const cpfNumeric = (conversionData.clientCpf || '').replace(/\D/g, '');
          let qContacts;
          if (cpfNumeric) {
            qContacts = query(contactsRef, where("cpf", "==", cpfNumeric));
          } else {
            qContacts = query(contactsRef, where("name", "==", appointment.client.name));
          }
          const contactsSnap = await getDocs(qContacts);
          if (!contactsSnap.empty) {
            contactUid = contactsSnap.docs[0].id;
          }
        } catch (e) {
          console.warn('Não foi possível identificar o contato para contactUid:', e);
        }

        // Se ainda não encontrou o contato, criar um novo
        if (!contactUid) {
          try {
            const newContactData = {
              name: appointment.client?.name || '',
              phone: appointment.client?.phone || '',
              email: appointment.client?.email || '',
              cpf: (conversionData.clientCpf || '').replace(/\D/g, ''),
              uid: uid,
              createdAt: new Date().toISOString()
            };
            
            const contactsRef = collection(database, "Contacts");
            const newContactRef = await addDoc(contactsRef, newContactData);
            contactUid = newContactRef.id;
            console.log('Novo contato criado:', contactUid);
          } catch (e) {
            console.warn('Não foi possível criar novo contato:', e);
            contactUid = null;
          }
        }
      }

      // Preparar pagamentos no formato do serviço padrão (valor em centavos)
      const processedPayments = payments.map(p => ({
        method: p.method,
        value: normalizeValueToCents(p.value || ''),
        date: p.date || '',
        installments: p.installments ?? null,
      }));
      const paidAmount = processedPayments.reduce((sum, p) => sum + (p.value || 0), 0);

      // Criar um novo serviço baseado no formato de servicos/novo
      const serviceData = {
        name: appointment.client?.name || '',
        cpf: (conversionData.clientCpf || '').replace(/\D/g, ''),
        phone: appointment.client?.phone || '',
        email: appointment.client?.email || '',
        date: appointment.appointment?.date || '',
        time: appointment.appointment?.startTime || '',
        price: (appointment.appointment?.servicePrice || appointment.appointment?.procedurePrice || 0),
        paidAmount,
        priority: "",
        duration: "",
        observations: conversionData.observations || '',
        services: ((appointment.appointment as any)?.procedureIds || []).map((procedureId: string, index: number) => ({
          id: procedureId,
          code: (appointment as any).appointment?.procedureCodes?.[index] || '',
          name: (appointment as any).appointment?.procedureNames?.[index] || 'Serviço',
          price: String((appointment as any).appointment?.procedurePrices?.[index] || 0),
          date: appointment.appointment?.date || ''
        })),
        professionals: appointment.appointment?.professionalName ? [
          {
            id: appointment.appointment?.professionalId || '',
            name: appointment.appointment?.professionalName,
            specialty: ''
          }
        ] : [],
        budget: false,
        sendToFinance: false,
        payments: processedPayments,
        documents: [],
        beforePhotos: conversionData.beforePhotos.map(p => ({ url: p.url, description: p.description ?? '' })),
        afterPhotos: conversionData.afterPhotos.map(p => ({ url: p.url, description: p.description ?? '' })),
        uid: uid,
        contactUid: contactUid || null,
        convertedFromAppointment: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Adicionar o serviço
      const servicesRef = collection(database, "Services");
      const docRef = await addDoc(servicesRef, serviceData);
      
      // Excluir o agendamento
      await deleteDoc(doc(database, "Appointments", appointment.id));
      
      // Atualizar estados locais (forma funcional para evitar estado stale)
      setServices((prev) => [...prev, { id: docRef.id, ...serviceData }]);
      setAppointments((prev) => prev.filter(a => a.id !== appointment.id));
      
      toast.success("Agendamento convertido para serviço com sucesso!");
      setShowConversionModal(false);
      setAppointmentToConvert(null);
    } catch (error) {
      console.error("Erro ao converter para serviço:", error);
      toast.error("Erro ao converter para serviço!");
    }
  };

  const todayAppointments = appointments.filter(appointment => {
    if (!appointment.appointment?.date) return false;
    const appointmentLocalDate = createLocalDate(appointment.appointment.date);
    const isToday = isSameDate(appointmentLocalDate, new Date());
    console.log('📅 Verificando agendamento:', appointment.id, 'Data:', appointment.appointment.date, 'É hoje?', isToday);
    return isToday;
  }).length;

  // Funções de navegação
  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setCurrentWeek(today);
    setCurrentMonth(today);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = direction === 'prev' 
      ? subDays(currentWeek, 7)
      : addDays(currentWeek, 7);
    setCurrentWeek(newWeek);
    setSelectedDate(newWeek);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = direction === 'prev'
      ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(newMonth);
    setSelectedDate(newMonth);
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDay = direction === 'prev'
      ? subDays(selectedDate, 1)
      : addDays(selectedDate, 1);
    setSelectedDate(newDay);
  };

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
            <span>
              {appointment.appointment?.date ? formatDateToBrazilian(appointment.appointment.date) : 'Data não informada'} às {appointment.appointment?.startTime || 'Horário não informado'}
            </span>
          </div>
          
          
          <div className="flex items-center gap-2">
            

            <span className="font-medium text-blue-600">
              {formatAppointmentPrice(appointment.appointment?.totalPrice || appointment.appointment?.servicePrice || appointment.appointment?.procedurePrice || 0)}
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
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <Settings className="h-5 w-5" />
            </Button>
            <div className="relative filter-menu-container">
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => setShowFilterMenu(!showFilterMenu)}
              >
                <Filter className="h-4 w-4" />
                Filtrar
                {statusFilter !== 'todos' && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {statusFilter === 'pendente' ? 'Pendente' :
                     statusFilter === 'confirmado' ? 'Confirmado' :
                     statusFilter === 'concluido' ? 'Concluído' :
                     statusFilter === 'cancelado' ? 'Cancelado' :
                     statusFilter === 'nao_compareceu' ? 'Não Compareceu' : ''}
                  </span>
                )}
              </Button>
              
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-2">Filtrar por Status</div>
                    <div className="space-y-1">
                      <button
                        onClick={() => {
                          setStatusFilter('todos');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                          statusFilter === 'todos' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('pendente');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                          statusFilter === 'pendente' ? 'bg-orange-50 text-orange-700' : 'text-gray-700'
                        }`}
                      >
                        Pendente
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('confirmado');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                          statusFilter === 'confirmado' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        Confirmado
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('concluido');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                          statusFilter === 'concluido' ? 'bg-green-50 text-green-700' : 'text-gray-700'
                        }`}
                      >
                        Concluído
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('cancelado');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                          statusFilter === 'cancelado' ? 'bg-red-50 text-red-700' : 'text-gray-700'
                        }`}
                      >
                        Cancelado
                      </button>
                      <button
                        onClick={() => {
                          setStatusFilter('nao_compareceu');
                          setShowFilterMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 ${
                          statusFilter === 'nao_compareceu' ? 'bg-gray-50 text-gray-700' : 'text-gray-700'
                        }`}
                      >
                        Não Compareceu
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button 
              onClick={() => router.push('/dashboard/agenda/novo')} 
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Novo Agendamento
            </Button>
          </div>
        </div>
      </div>

      {/* Barra de Controles */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos profissionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos profissionais</SelectItem>
                {professionals.map((professional) => (
                  <SelectItem key={professional.id} value={professional.id}>
                    {professional.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (viewMode === 'dia') navigateDay('prev');
                else if (viewMode === 'semana') navigateWeek('prev');
                else if (viewMode === 'mes') navigateMonth('prev');
              }}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (viewMode === 'dia') navigateDay('next');
                else if (viewMode === 'semana') navigateWeek('next');
                else if (viewMode === 'mes') navigateMonth('next');
              }}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={goToToday}
              className="px-3 py-1 text-sm"
            >
              Hoje
            </Button>
            {viewMode === 'dia' && (
              <div className="text-sm font-medium text-gray-700">
                {format(selectedDate, "EEEE, dd/MM", { locale: ptBR })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: ViewMode) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dia">Dia</SelectItem>
                <SelectItem value="semana">Semana</SelectItem>
                <SelectItem value="mes">Mês</SelectItem>
                <SelectItem value="lista">Lista</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 p-6">


        {/* Conteúdo Principal baseado no modo de visualização */}
        {viewMode === 'dia' && (
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="p-0 relative">
              {/* Grid único com todas as células */}
              <div className="grid border border-gray-300" style={{ gridTemplateColumns: "100px 1fr", gridTemplateRows: "auto repeat(15, 80px)" }}>
                {/* Cabeçalho do dia */}
                <div className="border-r border-b border-gray-300 bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-500">Horário</div>
                </div>
                <div className="text-center p-3 border-b border-gray-300 bg-gray-50">
                  <div className="text-sm font-medium text-gray-500 mb-1">
                    {format(selectedDate, "EEE", { locale: ptBR })}
                  </div>
                  <div className={`text-lg font-semibold ${isToday(selectedDate) ? 'text-blue-600' : 'text-gray-900'}`}>
                    {format(selectedDate, "dd")}
                  </div>
                </div>
                
                {/* Grade de horários */}
                {Array.from({ length: 15 }, (_, i) => {
                  const hour = i + 6; // 6:00 às 20:00
                  return [
                    // Coluna de horário
                    <div key={`${hour}-time`} className="flex items-center justify-start pl-3 text-sm text-gray-500 h-20 border-r border-b border-gray-300 bg-gray-50 relative">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                      {hour.toString().padStart(2, '0')}:00
                    </div>,
                    
                    // Coluna do dia
                    <div key={`${hour}-day`} className="h-20 border-b border-gray-300 relative bg-white hover:bg-gray-50">
                      {/* Linha horizontal em cima da hora */}
                      <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                      {/* Linha de meia hora */}
                      <div className="absolute top-10 left-0 right-0 h-px bg-gray-200"></div>
                        
                      {/* Mostrar agendamentos neste horário */}
                      {(() => {
                        // Buscar agendamentos para este dia e horário
                        const dayAppointments = filteredAppointments.filter(appointment => {
                          if (!appointment.appointment?.date) return false;
                          const appointmentDate = createLocalDate(appointment.appointment.date);
                          const appointmentHour = parseInt(appointment.appointment?.startTime?.split(':')[0] || '0');
                          return isSameDay(appointmentDate, selectedDate) && appointmentHour === hour;
                        });
                        
                        if (dayAppointments.length === 0) return null;
                        
                        const getStatusColor = (status: Appointment['status']) => {
                          switch (status) {
                            case 'pendente': return 'bg-orange-100 border-orange-300 text-orange-800';
                            case 'confirmado': return 'bg-blue-100 border-blue-300 text-blue-800';
                            case 'concluido': return 'bg-green-100 border-green-300 text-green-800';
                            case 'nao_compareceu': return 'bg-gray-100 border-gray-300 text-gray-800';
                            default: return 'bg-orange-100 border-orange-300 text-orange-800';
                          }
                        };
                        
                        // Lógica com slots de 30 minutos: altura dinâmica + divisão horizontal
                        const HOUR_HEIGHT = 80; // altura total de uma hora (2 linhas de 40px)
                        const SLOT_HEIGHT = 40; // altura de um slot de 30 minutos
                        
                        // 1. Função para determinar o slot de 30 minutos baseado no horário
                        const getTimeSlot = (startTime: string) => {
                          const [hourStr, minuteStr] = startTime.split(':');
                          const hour = parseInt(hourStr, 10);
                          const minute = parseInt(minuteStr, 10);
                          
                          // Se minuto < 30, vai para o primeiro slot (0-29)
                          // Se minuto >= 30, vai para o segundo slot (30-59)
                          const slotMinute = minute < 30 ? 0 : 30;
                          return `${hour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
                        };
                        
                        // 2. Contar quantos agendamentos existem na mesma hora (para altura)
                        const hourCounts = dayAppointments.reduce((acc, appointment) => {
                          const startTime = appointment.appointment?.startTime || '00:00';
                          const [hourStr] = startTime.split(':');
                          const hour = parseInt(hourStr, 10);
                          acc[hour] = (acc[hour] || 0) + 1;
                          return acc;
                        }, {} as Record<number, number>);
                        
                        // 3. Agrupar por slot de 30 minutos (para divisão horizontal)
                        const appointmentsBySlot = dayAppointments.reduce((acc, appointment) => {
                          const startTime = appointment.appointment?.startTime || '00:00';
                          const slot = getTimeSlot(startTime);
                          if (!acc[slot]) {
                            acc[slot] = [];
                          }
                          acc[slot].push(appointment);
                          return acc;
                        }, {} as Record<string, typeof dayAppointments>);
                        
                        // 4. Renderizar cada grupo de slot
                        return Object.entries(appointmentsBySlot).map(([slot, appointments]) => {
                          const [hourStr, minuteStr] = slot.split(':');
                          const hour = parseInt(hourStr, 10);
                          const minute = parseInt(minuteStr, 10);
                          
                          // Posição vertical baseada no slot (0 ou 30 minutos)
                          const topPosition = minute * (HOUR_HEIGHT / 60) - 1;
                          
                          // Altura: 80px se único na hora, 40px se múltiplos na hora
                          const appointmentsInHour = hourCounts[hour] || 0;
                          const cardHeight = appointmentsInHour === 1 ? '80px' : '40px';
                          
                          // Largura e posição horizontal: dividir apenas se múltiplos no mesmo slot
                          const totalAppointments = appointments.length;
                          const cardWidth = totalAppointments > 1 ? `${100 / totalAppointments}%` : 'calc(100% - 4px)';
                          
                          return appointments.map((appointment, index) => {
                            const leftPosition = totalAppointments > 1 ? `${(index * 100) / totalAppointments}%` : '2px';
                            
                            return (
                              <div
                                key={appointment.id}
                                className={`absolute border rounded text-xs p-1 flex flex-col justify-center shadow-sm cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(appointment.status)}`}
                                style={{
                                  top: `${topPosition + 2}px`,
                                  left: leftPosition,
                                  width: cardWidth,
                                  height: cardHeight,
                                  zIndex: 10,
                                  marginRight: totalAppointments > 1 ? '1px' : '2px'
                                }}
                                onClick={() => openAppointmentDetailsModal(appointment)}
                              >
                                <div className="font-medium truncate text-xs">{appointment.client.name}</div>
                                <div className="opacity-75 truncate text-xs">
                                  {appointment.appointment?.startTime}
                                </div>
                              </div>
                            );
                          });
                        }).flat();
                      })()}
                    </div>
                  ];
                }).flat()}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'semana' && (
          <div className="bg-white border border-gray-300 rounded-lg shadow-sm">
            <div className="p-0 relative">
              {/* Grid único com todas as células */}
              <div className="grid border border-gray-300" style={{ gridTemplateColumns: "100px repeat(5, 1fr)", gridTemplateRows: "auto repeat(15, 80px)" }}>
                {/* Cabeçalho da semana */}
                <div className="border-r border-b border-gray-300 bg-gray-50 p-3">
                  <div className="text-sm font-medium text-gray-500">Horário</div>
                </div>
                {eachDayOfInterval({
                  start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
                  end: addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 4) 
                }).map((day, index) => (
                  <div key={day.toISOString()} className={`text-center p-3 border-b border-gray-300 bg-gray-50 ${index < 4 ? 'border-r-4 border-gray-600' : ''}`}>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      {format(day, "EEE", { locale: ptBR })}
                    </div>
                    <div className={`text-lg font-semibold ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>
                      {format(day, "dd")}
                    </div>
                  </div>
                ))}
                
                {/* Grade de horários */}
                {Array.from({ length: 15 }, (_, i) => {
                  const hour = i + 6; // 6:00 às 20:00
                  return [
                    // Coluna de horário
                    <div key={`${hour}-time`} className="flex items-center justify-start pl-3 text-sm text-gray-500 h-20 border-r border-b border-gray-300 bg-gray-50 relative">
                      <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                      {hour.toString().padStart(2, '0')}:00
                    </div>,
                    
                    // Colunas dos dias
                    ...eachDayOfInterval({
                      start: startOfWeek(currentWeek, { weekStartsOn: 1 }),
                      end: addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 4)
                    }).map((day, dayIndex) => {
                      // Buscar agendamentos para este dia e horário
                      const dayAppointments = filteredAppointments.filter(appointment => {
                        if (!appointment.appointment?.date) return false;
                        const appointmentDate = createLocalDate(appointment.appointment.date);
                        const appointmentHour = parseInt(appointment.appointment?.startTime?.split(':')[0] || '0');
                        return isSameDay(appointmentDate, day) && appointmentHour === hour;
                      });
                      
                      return (
                        <div key={`${hour}-${day.toISOString()}`} className={`h-20 border-b border-gray-300 relative bg-white hover:bg-gray-50 ${dayIndex < 4 ? 'border-r-4 border-gray-600' : ''}`}>
                          {/* Linha horizontal em cima da hora */}
                          <div className="absolute top-0 left-0 right-0 h-px bg-gray-300"></div>
                          {/* Linha de meia hora */}
                          <div className="absolute top-10 left-0 right-0 h-px bg-gray-200"></div>
                            
                            {/* Mostrar agendamentos neste horário */}
                            {(() => {
                              // Filtrar agendamentos para este horário específico
                              const hourAppointments = dayAppointments.filter(appointment => {
                                const appointmentHour = parseInt(appointment.appointment?.startTime?.split(':')[0] || '0');
                                return appointmentHour === hour;
                              });
                              
                              if (hourAppointments.length === 0) return null;
                              
                              const getStatusColor = (status: Appointment['status']) => {
                                switch (status) {
                                  case 'pendente': return 'bg-orange-100 border-orange-300 text-orange-800';
                                  case 'confirmado': return 'bg-blue-100 border-blue-300 text-blue-800';
                                  case 'concluido': return 'bg-green-100 border-green-300 text-green-800';
                                  case 'nao_compareceu': return 'bg-gray-100 border-gray-300 text-gray-800';
                                  default: return 'bg-orange-100 border-orange-300 text-orange-800';
                                }
                              };
                              
                              // Lógica com slots de 30 minutos: altura dinâmica + divisão horizontal
                              const HOUR_HEIGHT = 80; // altura total de uma hora (2 linhas de 40px)
                              const SLOT_HEIGHT = 40; // altura de um slot de 30 minutos
                              
                              // 1. Função para determinar o slot de 30 minutos baseado no horário
                              const getTimeSlot = (startTime: string) => {
                                const [hourStr, minuteStr] = startTime.split(':');
                                const hour = parseInt(hourStr, 10);
                                const minute = parseInt(minuteStr, 10);
                                
                                // Se minuto < 30, vai para o primeiro slot (0-29)
                                // Se minuto >= 30, vai para o segundo slot (30-59)
                                const slotMinute = minute < 30 ? 0 : 30;
                                return `${hour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
                              };
                              
                              // 2. Contar quantos agendamentos existem na mesma hora (para altura)
                              const hourCounts = hourAppointments.reduce((acc, appointment) => {
                                const startTime = appointment.appointment?.startTime || '00:00';
                                const [hourStr] = startTime.split(':');
                                const hour = parseInt(hourStr, 10);
                                acc[hour] = (acc[hour] || 0) + 1;
                                return acc;
                              }, {} as Record<number, number>);
                              
                              // 3. Agrupar por slot de 30 minutos (para divisão horizontal)
                              const appointmentsBySlot = hourAppointments.reduce((acc, appointment) => {
                                const startTime = appointment.appointment?.startTime || '00:00';
                                const slot = getTimeSlot(startTime);
                                if (!acc[slot]) {
                                  acc[slot] = [];
                                }
                                acc[slot].push(appointment);
                                return acc;
                              }, {} as Record<string, typeof hourAppointments>);
                              
                              // 4. Renderizar cada grupo de slot
                              return Object.entries(appointmentsBySlot).map(([slot, appointments]) => {
                                const [hourStr, minuteStr] = slot.split(':');
                                const hour = parseInt(hourStr, 10);
                                const minute = parseInt(minuteStr, 10);
                                
                                // Posição vertical baseada no slot (0 ou 30 minutos)
                                const topPosition = minute * (HOUR_HEIGHT / 60) - 2;
                                
                                // Altura: 80px se único na hora, 40px se múltiplos na hora
                                const appointmentsInHour = hourCounts[hour] || 0;
                                const cardHeight = appointmentsInHour === 1 ? '80px' : '40px';
                                
                                // Largura e posição horizontal: dividir apenas se múltiplos no mesmo slot
                                const totalAppointments = appointments.length;
                                const cardWidth = totalAppointments > 1 ? `${100 / totalAppointments}%` : 'calc(100% - 4px)';
                                
                                return appointments.map((appointment, index) => {
                                  const leftPosition = totalAppointments > 1 ? `${(index * 100) / totalAppointments}%` : '2px';
                                  
                                  return (
                                    <div
                                      key={appointment.id}
                                      className={`absolute border rounded text-xs p-1 flex flex-col justify-center shadow-sm cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(appointment.status)}`}
                                      style={{
                                        top: `${topPosition + 2}px`,
                                        left: leftPosition,
                                        width: cardWidth,
                                        height: cardHeight,
                                        zIndex: 10,
                                        marginRight: totalAppointments > 1 ? '1px' : '2px'
                                      }}
                                      onClick={() => openAppointmentDetailsModal(appointment)}
                                    >
                                      <div className="font-medium truncate text-xs">{appointment.client.name}</div>
                                      <div className="opacity-75 truncate text-xs">
                                        {appointment.appointment?.startTime}
                                      </div>
                                    </div>
                                  );
                                });
                              }).flat();
                            })()}
                          </div>
                        );
                      })
                  ];
                }).flat()}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'mes' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Legenda:</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                    <span>Pendente</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Confirmado</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Concluído</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Cancelado</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>Não Compareceu</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-7 gap-1">
                {/* Cabeçalho dos dias da semana */}
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                
                {/* Dias do mês */}
                {(() => {
                  const monthStart = startOfMonth(currentMonth);
                  const monthEnd = endOfMonth(currentMonth);
                  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
                  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
                  
                  return eachDayOfInterval({ start: startDate, end: endDate }).map((day) => {
                    const isCurrentMonth = isSameMonth(day, currentMonth);
                    const isTodayDate = isToday(day);
                    const isSelected = isSameDay(day, selectedDate);
                    
                    const dayAppointments = appointments.filter(appointment => {
                      if (!appointment.appointment?.date) return false;
                      const appointmentDate = createLocalDate(appointment.appointment.date);
                      return isSameDay(appointmentDate, day);
                    });
                    
                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => {
                          if (isCurrentMonth) {
                            setSelectedDate(day);
                            if (dayAppointments.length > 0) {
                              openDayAppointmentsModal(day);
                            }
                          }
                        }}
                        className={`
                          min-h-[100px] p-2 border border-gray-100 cursor-pointer transition-colors
                          ${isCurrentMonth ? 'hover:bg-gray-50' : 'bg-gray-50 text-gray-400'}
                          ${isTodayDate ? 'bg-blue-50 border-blue-200' : ''}
                          ${isSelected ? 'bg-blue-100 border-blue-300' : ''}
                        `}
                      >
                        <div className={`text-sm font-medium mb-1 ${isTodayDate ? 'text-blue-600' : ''}`}>
                          {format(day, "d")}
                        </div>
                        <div className="space-y-1">
                          {dayAppointments.slice(0, 3).map((appointment) => {
                            const getStatusColor = (status: Appointment['status']) => {
                              switch (status) {
                                case 'pendente': return 'bg-orange-100 text-orange-800';
                                case 'confirmado': return 'bg-blue-100 text-blue-800';
                                case 'concluido': return 'bg-green-100 text-green-800';
                                case 'cancelado': return 'bg-red-100 text-red-800';
                                case 'nao_compareceu': return 'bg-gray-100 text-gray-800';
                                default: return 'bg-orange-100 text-orange-800';
                              }
                            };
                            
                            return (
                              <div
                                key={appointment.id}
                                className={`text-xs p-1 rounded ${getStatusColor(appointment.status)} truncate`}
                              >
                                {appointment.appointment?.startTime} - {appointment.client.name}
                              </div>
                            );
                          })}
                          {dayAppointments.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{dayAppointments.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'lista' && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Agendamentos da Semana</h2>
              <p className="text-sm text-gray-500">Gerencie todos os agendamentos da semana atual</p>
            </div>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (() => {
                // Filtrar agendamentos da semana atual (segunda a sexta)
                const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
                const weekEnd = addDays(weekStart, 4); // Apenas segunda a sexta
                
                const weeklyAppointments = appointments.filter(appointment => {
                  if (!appointment.appointment?.date) return false;
                  const appointmentDate = createLocalDate(appointment.appointment.date);
                  return appointmentDate >= weekStart && appointmentDate <= weekEnd;
                });

                if (weeklyAppointments.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm font-medium">Nenhum agendamento nesta semana</p>
                      <p className="text-xs">Crie um novo agendamento para começar</p>
                    </div>
                  );
                }

                // Agrupar por dia da semana
                const appointmentsByDay = weeklyAppointments.reduce((acc, appointment) => {
                  if (!appointment.appointment?.date) return acc;
                  const appointmentDate = createLocalDate(appointment.appointment.date);
                  const dayKey = format(appointmentDate, 'yyyy-MM-dd');
                  
                  if (!acc[dayKey]) {
                    acc[dayKey] = {
                      date: appointmentDate,
                      appointments: []
                    };
                  }
                  acc[dayKey].appointments.push(appointment);
                  return acc;
                }, {} as Record<string, { date: Date; appointments: Appointment[] }>);

                const getStatusConfig = (status: Appointment['status']) => {
                  switch (status) {
                    case 'pendente':
                      return {
                        label: 'PENDENTE',
                        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      };
                    case 'confirmado':
                      return {
                        label: 'CONFIRMADO',
                        className: 'bg-blue-100 text-blue-800 border-blue-200'
                      };
                    case 'concluido':
                      return {
                        label: 'CONCLUÍDO',
                        className: 'bg-green-100 text-green-800 border-green-200'
                      };
                    case 'cancelado':
                      return {
                        label: 'CANCELADO',
                        className: 'bg-red-100 text-red-800 border-red-200'
                      };
                    case 'nao_compareceu':
                      return {
                        label: 'NÃO COMPARECEU',
                        className: 'bg-gray-100 text-gray-800 border-gray-200'
                      };
                    default:
                      return {
                        label: 'PENDENTE',
                        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      };
                  }
                };

                const formatTime = (time: string) => {
                  return time.substring(0, 5); // Remove segundos se houver
                };

                return (
                  <div className="space-y-6">
                    {Object.values(appointmentsByDay)
                      .sort((a, b) => a.date.getTime() - b.date.getTime())
                      .map((dayData) => (
                        <div key={dayData.date.toISOString()}>
                          <div className="flex items-center gap-2 mb-4">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {format(dayData.date, "EEEE", { locale: ptBR })}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {format(dayData.date, "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dayData.appointments
                              .sort((a, b) => {
                                const timeA = a.appointment?.startTime || '00:00';
                                const timeB = b.appointment?.startTime || '00:00';
                                return timeA.localeCompare(timeB);
                              })
                              .map((appointment) => {
                                const statusConfig = getStatusConfig(appointment.status);
                                const price = appointment.appointment?.servicePrice || appointment.appointment?.procedurePrice || 0;
                                
                                return (
                                  <div key={appointment.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg cursor-pointer" onClick={() => openAppointmentDetailsModal(appointment)}>
                                    <div className="p-6">
                                      {/* Header com nome e status */}
                                      <div className="flex items-start justify-between mb-4">
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                          {appointment.appointment?.serviceName || appointment.appointment?.procedureName || 'Serviço'}
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}>
                                          {statusConfig.label}
                                        </span>
                                      </div>

                                      {/* Data e hora */}
                                      <div className="flex items-center space-x-2 mb-3">
                                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                                          <CalendarIcon className="w-4 h-4 text-pink-600" />
                                        </div>
                                        <span className="text-sm text-gray-600">
                                          {formatDateToBrazilian(appointment.appointment?.date || '')} às {formatTime(appointment.appointment?.startTime || '')}
                                        </span>
                                      </div>

                                      {/* Cliente */}
                                      <div className="flex items-center space-x-2 mb-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                          <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm text-gray-600">{appointment.client.name}</span>
                                      </div>

                                      {/* Valor */}
                                      <div className="flex items-center space-x-2 mb-4">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                          <DollarSign className="w-4 h-4 text-green-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">
                                          {formatAppointmentPrice(price)}
                                        </span>
                                      </div>

                                      {/* Ações baseadas no status */}
                                      <div className="mt-4">
                                        {appointment.status === 'pendente' && (
                                          <div className="flex gap-2">
                                            <Button
                                              onClick={() => updateAppointmentStatus(appointment.id, 'confirmado')}
                                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                                            >
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Confirmar
                                            </Button>
                                            <Button
                                              onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                                              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
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
                                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                                            >
                                              <CheckCircle className="h-4 w-4 mr-2" />
                                              Concluir
                                            </Button>
                                            <Button
                                              onClick={() => updateAppointmentStatus(appointment.id, 'nao_compareceu')}
                                              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm"
                                            >
                                              <XCircle className="h-4 w-4 mr-2" />
                                              Não Compareceu
                                            </Button>
                                          </div>
                                        )}

                                        {appointment.status === 'concluido' && (
                                          <Button
                                            onClick={() => openConversionModal(appointment)}
                                            className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm"
                                          >
                                            Converter para Serviço
                                          </Button>
                                        )}

                                        {appointment.status === 'nao_compareceu' && (
                                          <div className="w-full text-center text-sm text-gray-500 py-2">
                                            Cliente não compareceu
                                          </div>
                                        )}

                                        {appointment.status === 'cancelado' && (
                                          <div className="w-full text-center text-sm text-gray-500 py-2">
                                            Agendamento cancelado
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
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
                    const timeA = a.appointment?.startTime || '00:00';
                    const timeB = b.appointment?.startTime || '00:00';
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

      {/* Modal de Agendamentos do Dia */}
      <AlertDialog open={showDayAppointmentsModal} onOpenChange={setShowDayAppointmentsModal}>
        <AlertDialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <AlertDialogHeader className="flex-shrink-0 relative">
            <div className="absolute top-0 right-0 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDayAppointmentsModal(false)}
                className="h-8 w-8 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogTitle className="pr-8">
              {selectedDayForModal && format(selectedDayForModal, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Agendamentos do dia selecionado
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedDayForModal && (() => {
              const dayAppointments = appointments.filter(appointment => {
                if (!appointment.appointment?.date) return false;
                const appointmentDate = createLocalDate(appointment.appointment.date);
                return isSameDay(appointmentDate, selectedDayForModal);
              });

              if (dayAppointments.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium">Nenhum agendamento neste dia</p>
                    <p className="text-xs">Crie um novo agendamento para começar</p>
                  </div>
                );
              }

              // Ordenar agendamentos por horário
              const sortedAppointments = dayAppointments.sort((a, b) => {
                const timeA = a.appointment?.startTime || '00:00';
                const timeB = b.appointment?.startTime || '00:00';
                return timeA.localeCompare(timeB);
              });

              const getStatusConfig = (status: Appointment['status']) => {
                switch (status) {
                  case 'pendente':
                    return {
                      label: 'PENDENTE',
                      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    };
                  case 'confirmado':
                    return {
                      label: 'CONFIRMADO',
                      className: 'bg-blue-100 text-blue-800 border-blue-200'
                    };
                  case 'concluido':
                    return {
                      label: 'CONCLUÍDO',
                      className: 'bg-green-100 text-green-800 border-green-200'
                    };
                  case 'cancelado':
                    return {
                      label: 'CANCELADO',
                      className: 'bg-red-100 text-red-800 border-red-200'
                    };
                  case 'nao_compareceu':
                    return {
                      label: 'NÃO COMPARECEU',
                      className: 'bg-gray-100 text-gray-800 border-gray-200'
                    };
                  default:
                    return {
                      label: 'PENDENTE',
                      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    };
                }
              };

              const formatTime = (time: string) => {
                return time.substring(0, 5); // Remove segundos se houver
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                  {sortedAppointments.map((appointment) => {
                    const statusConfig = getStatusConfig(appointment.status);
                    const price = appointment.appointment?.servicePrice || appointment.appointment?.procedurePrice || 0;
                    
                    return (
                      <div key={appointment.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg cursor-pointer" onClick={() => openAppointmentDetailsModal(appointment)}>
                        <div className="p-6">
                          {/* Header com nome e status */}
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">
                              {appointment.appointment?.serviceName || appointment.appointment?.procedureName || 'Serviço'}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}>
                              {statusConfig.label}
                            </span>
                          </div>

                          {/* Data e hora */}
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                              <CalendarIcon className="w-4 h-4 text-pink-600" />
                            </div>
                            <span className="text-sm text-gray-600">
                              {formatDateToBrazilian(appointment.appointment?.date || '')} às {formatTime(appointment.appointment?.startTime || '')}
                            </span>
                          </div>

                          {/* Cliente */}
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm text-gray-600">{appointment.client.name}</span>
                          </div>

                          {/* Valor */}
                          <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {formatAppointmentPrice(price)}
                            </span>
                          </div>

                          {/* Ações baseadas no status */}
                          <div className="mt-4">
                            {appointment.status === 'pendente' && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'confirmado')}
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirmar
                                </Button>
                                <Button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
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
                                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Concluir
                                </Button>
                                <Button
                                  onClick={() => updateAppointmentStatus(appointment.id, 'nao_compareceu')}
                                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Não Compareceu
                                </Button>
                              </div>
                            )}

                            {appointment.status === 'concluido' && (
                              <Button
                                onClick={() => openConversionModal(appointment)}
                                className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm"
                              >
                                Converter para Serviço
                              </Button>
                            )}

                            {appointment.status === 'nao_compareceu' && (
                              <div className="w-full text-center text-sm text-gray-500 py-2">
                                Cliente não compareceu
                              </div>
                            )}

                            {appointment.status === 'cancelado' && (
                              <div className="w-full text-center text-sm text-gray-500 py-2">
                                Agendamento cancelado
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </AlertDialogContent>
      </AlertDialog>

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
              const appointmentDate = createLocalDate(appointment.appointment?.date || '');
              const price = appointment.appointment?.servicePrice || appointment.appointment?.procedurePrice || 0;
              
              const getStatusConfig = (status: Appointment['status']) => {
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
                          return (professional as any)?.registrationNumber || "Não informado";
                        })()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">{(() => {
                          const professional = professionals.find(p => p.id === appointment.appointment?.professionalId);
                          return (professional as any)?.phone || "Não informado";
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
                        <p className="font-medium">{(appointment.client as any).cpf || "Não informado"}</p>
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
                        onClick={() => handleEdit(appointment.id)}
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
                              updateAppointmentStatus(appointment.id, 'confirmado');
                              setShowAppointmentDetailsModal(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-medium"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Confirmar
                          </Button>
                          <Button
                            onClick={() => {
                              updateAppointmentStatus(appointment.id, 'cancelado');
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
                              updateAppointmentStatus(appointment.id, 'concluido');
                              setShowAppointmentDetailsModal(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-medium"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Concluir
                          </Button>
                          <Button
                            onClick={() => {
                              updateAppointmentStatus(appointment.id, 'nao_compareceu');
                              setShowAppointmentDetailsModal(false);
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 text-base font-medium"
                          >
                            <XCircle className="h-5 w-5 mr-2" />
                            Não Compareceu
                          </Button>
                        </>
                      )}

                      {appointment.status === 'concluido' && (
                        <Button
                          onClick={() => {
                            openConversionModal(appointment);
                            setShowAppointmentDetailsModal(false);
                          }}
                          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 text-base font-medium"
                        >
                          <FileText className="h-5 w-5 mr-2" />
                          Converter para Serviço
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
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
                          value={appointmentToConvert?.client?.name || ''}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientPhone">Telefone</Label>
                        <Input
                          id="clientPhone"
                          value={appointmentToConvert?.client?.phone || ''}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientEmail">Email</Label>
                        <Input
                          id="clientEmail"
                          value={appointmentToConvert?.client?.email || ''}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientCpf">CPF</Label>
                        <Input
                          id="clientCpf"
                          readOnly
                          value={conversionData.clientCpf}
                          onChange={(e) => setConversionData(prev => ({
                            ...prev,
                            clientCpf: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                    
                    {/* Status do Cliente */}
                    {planLimits && appointmentToConvert && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="font-semibold text-blue-800">Status do Cliente</span>
                          </div>
                          <span className="text-sm text-blue-600">
                            {(() => {
                              // Calcular imagens existentes do cliente
                              const clientName = appointmentToConvert.client?.name;
                              if (!clientName) return "0/0 imagens";
                              
                              // Buscar imagens existentes do cliente
                              const existingImages = services
                                .filter(service => service.name === clientName)
                                .reduce((total, service) => {
                                  const beforeCount = service.beforePhotos?.length || 0;
                                  const afterCount = service.afterPhotos?.length || 0;
                                  return total + beforeCount + afterCount;
                                }, 0);
                              
                              return `${existingImages}/${planLimits.images} imagens`;
                            })()}
                          </span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (() => {
                                const clientName = appointmentToConvert.client?.name;
                                if (!clientName) return 'bg-gray-500';
                                
                                const existingImages = services
                                  .filter(service => service.name === clientName)
                                  .reduce((total, service) => {
                                    const beforeCount = service.beforePhotos?.length || 0;
                                    const afterCount = service.afterPhotos?.length || 0;
                                    return total + beforeCount + afterCount;
                                  }, 0);
                                
                                const ratio = existingImages / planLimits.images;
                                return ratio > 0.9 ? 'bg-red-500' :
                                       ratio > 0.8 ? 'bg-orange-500' : 'bg-green-500';
                              })()
                            }`}
                            style={{ 
                              width: `${Math.min((() => {
                                const clientName = appointmentToConvert.client?.name;
                                if (!clientName) return 0;
                                
                                const existingImages = services
                                  .filter(service => service.name === clientName)
                                  .reduce((total, service) => {
                                    const beforeCount = service.beforePhotos?.length || 0;
                                    const afterCount = service.afterPhotos?.length || 0;
                                    return total + beforeCount + afterCount;
                                  }, 0);
                                
                                return (existingImages / planLimits.images) * 100;
                              })(), 100)}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-sm text-blue-700">
                          {(() => {
                            const clientName = appointmentToConvert.client?.name;
                            if (!clientName) return "Cliente não identificado";
                            
                            const existingImages = services
                              .filter(service => service.name === clientName)
                              .reduce((total, service) => {
                                const beforeCount = service.beforePhotos?.length || 0;
                                const afterCount = service.afterPhotos?.length || 0;
                                return total + beforeCount + afterCount;
                              }, 0);
                            
                            const remaining = Math.max(0, planLimits.images - existingImages);
                            
                            if (remaining === 0) {
                              return (
                                <span className="text-red-600 font-medium">
                                  ⚠️ Limite atingido! Não é possível adicionar mais imagens.
                                </span>
                              );
                            } else if (remaining <= 2) {
                              return (
                                <span className="text-orange-600 font-medium">
                                  ⚠️ Limite próximo! Restam apenas {remaining} imagens disponíveis.
                                </span>
                              );
                            } else {
                              return (
                                <span className="text-green-600">
                                  ✅ Restam {remaining} imagens disponíveis para este cliente.
                                </span>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    )}
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
                          value={appointmentToConvert?.appointment?.serviceName || appointmentToConvert?.appointment?.procedureName || ''}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="procedurePrice">Valor</Label>
                        <Input
                          id="procedurePrice"
                          value={formatAppointmentPrice(appointmentToConvert?.appointment?.totalPrice || appointmentToConvert?.appointment?.servicePrice || appointmentToConvert?.appointment?.procedurePrice || 0)}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="professionalName">Profissional</Label>
                        <Input
                          id="professionalName"
                          value={appointmentToConvert?.appointment?.professionalName || ''}
                          readOnly
                          className="bg-gray-50"
                        />
                      </div>
                      <div>
                        <Label htmlFor="procedureDate">Data</Label>
                        <Input
                          id="procedureDate"
                          value={appointmentToConvert?.appointment?.date || ''}
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
                          <span className="font-semibold">{formattedTotalPrice}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total pago:</span>
                          <span className="font-semibold text-green-600">
                            {formattedTotalPaid}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Saldo pendente:</span>
                          <span className="font-semibold text-orange-600">
                            {formattedPendingBalance}
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
                              value={newPayment.value === formattedTotalPrice ? "full" : "partial"}
                              onValueChange={(value) => {
                                if (value === "full") {
                                  setNewPayment({...newPayment, value: formattedTotalPrice});
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
                              disabled={newPayment.value === formattedTotalPrice}
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
                                      : payment.method === "cartao"
                                      ? `Cartão ${payment.installments ? `${payment.installments}x` : ""}`
                                      : "Cartão"}
                                  </div>
                                  <div className="text-sm">
                                    {formatDateToBrazilian(payment.date)} - {payment.value}
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
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Fotos Antes</h3>
                          {planLimits && appointmentToConvert && (
                            <div className="text-sm text-gray-600">
                              {(() => {
                                const clientName = appointmentToConvert.client?.name;
                                if (!clientName) return "0/0 imagens";
                                
                                const existingImages = services
                                  .filter(service => service.name === clientName)
                                  .reduce((total, service) => {
                                    const beforeCount = service.beforePhotos?.length || 0;
                                    const afterCount = service.afterPhotos?.length || 0;
                                    return total + beforeCount + afterCount;
                                  }, 0);
                                
                                const beforePhotos = conversionData.beforePhotos.length;
                                const afterPhotos = conversionData.afterPhotos.length;
                                const serviceImages = beforePhotos + afterPhotos;
                                const totalImages = existingImages + serviceImages;
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
                                if (!planLimits || !appointmentToConvert) return false;
                                
                                const clientName = appointmentToConvert.client?.name;
                                if (!clientName) return false;
                                
                                const existingImages = services
                                  .filter(service => service.name === clientName)
                                  .reduce((total, service) => {
                                    const beforeCount = service.beforePhotos?.length || 0;
                                    const afterCount = service.afterPhotos?.length || 0;
                                    return total + beforeCount + afterCount;
                                  }, 0);
                                
                                const beforePhotos = conversionData.beforePhotos.length;
                                const afterPhotos = conversionData.afterPhotos.length;
                                const serviceImages = beforePhotos + afterPhotos;
                                const totalImages = existingImages + serviceImages;
                                
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
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium">Fotos Depois</h3>
                          {planLimits && appointmentToConvert && (
                            <div className="text-sm text-gray-600">
                              {(() => {
                                const clientName = appointmentToConvert.client?.name;
                                if (!clientName) return "0/0 imagens";
                                
                                const existingImages = services
                                  .filter(service => service.name === clientName)
                                  .reduce((total, service) => {
                                    const beforeCount = service.beforePhotos?.length || 0;
                                    const afterCount = service.afterPhotos?.length || 0;
                                    return total + beforeCount + afterCount;
                                  }, 0);
                                
                                const beforePhotos = conversionData.beforePhotos.length;
                                const afterPhotos = conversionData.afterPhotos.length;
                                const serviceImages = beforePhotos + afterPhotos;
                                const totalImages = existingImages + serviceImages;
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
                                if (!planLimits || !appointmentToConvert) return false;
                                
                                const clientName = appointmentToConvert.client?.name;
                                if (!clientName) return false;
                                
                                const existingImages = services
                                  .filter(service => service.name === clientName)
                                  .reduce((total, service) => {
                                    const beforeCount = service.beforePhotos?.length || 0;
                                    const afterCount = service.afterPhotos?.length || 0;
                                    return total + beforeCount + afterCount;
                                  }, 0);
                                
                                const beforePhotos = conversionData.beforePhotos.length;
                                const afterPhotos = conversionData.afterPhotos.length;
                                const serviceImages = beforePhotos + afterPhotos;
                                const totalImages = existingImages + serviceImages;
                                
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
                          <p><strong>Nome:</strong> {appointmentToConvert?.client?.name || 'Não informado'}</p>
                          <p><strong>Telefone:</strong> {appointmentToConvert?.client?.phone || 'Não informado'}</p>
                          <p><strong>Email:</strong> {appointmentToConvert?.client?.email || 'Não informado'}</p>
                        </div>
                      </div>

                      {/* Informações do Procedimento */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Informações do Procedimento
                        </h4>
                        <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                          <p><strong>Procedimento:</strong> {appointmentToConvert?.appointment?.serviceName || appointmentToConvert?.appointment?.procedureName || 'Não informado'}</p>
                          <p><strong>Valor:</strong> {formatAppointmentPrice(appointmentToConvert?.appointment?.totalPrice || appointmentToConvert?.appointment?.servicePrice || appointmentToConvert?.appointment?.procedurePrice || 0)}</p>
                          <p><strong>Profissional:</strong> {appointmentToConvert?.appointment?.professionalName || 'Não informado'}</p>
                          <p><strong>Data:</strong> {appointmentToConvert?.appointment?.date ? formatDateToBrazilian(appointmentToConvert.appointment.date) : 'Não informado'}</p>
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
