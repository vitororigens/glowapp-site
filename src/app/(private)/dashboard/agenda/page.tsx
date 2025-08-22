"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Pencil, Trash2, Calendar as CalendarIcon, DollarSign, Search, X } from "lucide-react";
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
  status: string;
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
      
      const appointmentsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Appointment[];
      
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
       (appointment.appointment.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase()))
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

  const todayAppointments = appointments.filter(appointment => {
    const appointmentLocalDate = createLocalDate(appointment.appointment.date);
    return isSameDate(appointmentLocalDate, new Date());
  }).length;

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
                      <div className="space-y-2">
                        {filteredAppointments
                          .sort((a, b) => {
                            // Ordenar por horário
                            const timeA = a.appointment.startTime || '00:00';
                            const timeB = b.appointment.startTime || '00:00';
                            return timeA.localeCompare(timeB);
                          })
                          .map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                  {appointment.appointment.startTime}
                                </span>
                                <h3 className="font-semibold text-gray-900 text-sm">{appointment.client.name}</h3>
                              </div>
                              
                              <div className="space-y-1 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium text-gray-700">Serviço:</span>
                                  <span className="ml-1">{appointment.appointment.serviceName || appointment.appointment.procedureName || 'Não especificado'}</span>
                                </div>
                                
                                <div>
                                  <span className="font-medium text-gray-700">Valor:</span>
                                  <span className="ml-1 text-blue-600 font-medium">
                                    {formatAppointmentPrice(appointment.appointment.servicePrice || appointment.appointment.procedurePrice)}
                                  </span>
                                </div>
                                
                                {appointment.appointment.professionalName && (
                                  <div>
                                    <span className="font-medium text-gray-700">Profissional:</span>
                                    <span className="ml-1">{appointment.appointment.professionalName}</span>
                                  </div>
                                )}
                              </div>
                              
                              {appointment.appointment.observations && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                  <span className="text-xs font-medium text-blue-700">Observações:</span>
                                  <p className="text-xs text-blue-600 mt-1">{appointment.appointment.observations}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(appointment.id)}
                                className="hover:bg-gray-200 h-8 w-8"
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(appointment.id)}
                                className="hover:bg-red-100 hover:text-red-600 h-8 w-8"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
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
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                            {appointment.appointment.startTime}
                          </span>
                          <h3 className="font-semibold text-gray-900 text-lg">{appointment.client.name}</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium text-gray-700">Serviço:</span>
                            <span className="ml-2">{appointment.appointment.serviceName || appointment.appointment.procedureName || 'Não especificado'}</span>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Valor:</span>
                            <span className="ml-2 text-blue-600 font-medium">
                              {formatAppointmentPrice(appointment.appointment.servicePrice || appointment.appointment.procedurePrice)}
                            </span>
                          </div>
                          
                          {appointment.appointment.professionalName && (
                            <div>
                              <span className="font-medium text-gray-700">Profissional:</span>
                              <span className="ml-2">{appointment.appointment.professionalName}</span>
                            </div>
                          )}
                          
                          <div>
                            <span className="font-medium text-gray-700">Telefone:</span>
                            <span className="ml-2">{appointment.client.phone || 'Não informado'}</span>
                          </div>
                        </div>
                        
                        {appointment.appointment.observations && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-md">
                            <span className="text-sm font-medium text-blue-700">Observações:</span>
                            <p className="text-sm text-blue-600 mt-1">{appointment.appointment.observations}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleEdit(appointment.id);
                            setShowAllAppointmentsModal(false);
                          }}
                          className="w-full"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleDeleteClick(appointment.id);
                            setShowAllAppointmentsModal(false);
                          }}
                          className="w-full text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          
          <AlertDialogFooter className="flex-shrink-0 pt-4">
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}