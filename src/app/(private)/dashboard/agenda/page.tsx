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
import { PlusCircle, Pencil, Trash2, Calendar as CalendarIcon, DollarSign } from "lucide-react";
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

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
       appointment.appointment.serviceName.toLowerCase().includes(searchTerm.toLowerCase()))
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={() => router.push("/dashboard/agenda/novo")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Card className="p-6">
            <Card className="p-6">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                locale={ptBR}
                modifiers={{ hasItems: (date) => hasItemsOnDate(date) }}
                modifiersStyles={{
                  hasItems: {
                    backgroundColor: "rgba(244, 114, 182, 0.2)",
                    borderRadius: "50%",
                  },
                }}
                className={`
                  w-full
                  [&_.rdp-weekdays]:grid
                  [&_.rdp-weekdays]:grid-cols-7
                  [&_.rdp-head_cell]:flex
                  [&_.rdp-head_cell]:items-center
                  [&_.rdp-head_cell]:justify-center
                  [&_.rdp-weekdays]:gap-2
                `}
              />
</Card>

          </Card>
        </div>

        <div className="space-y-4">
          <Input
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">
              Agenda do dia {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </h2>
            
            <ScrollArea className="h-[400px] sm:h-[500px] pr-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : filteredAppointments.length === 0 && filteredServices.length === 0 && filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item encontrado para esta data.
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredAppointments.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm text-gray-500 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Agendamentos
                      </h3>
                      {filteredAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-3">{appointment.client.name}</h3>
                            
                            <div className="space-y-2 text-sm text-gray-600">
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
                              
                              <div>
                                <span className="font-medium text-gray-700">Horário:</span>
                                <span className="ml-1">{appointment.appointment.startTime}</span>
                              </div>
                            </div>
                            
                            {appointment.appointment.observations && (
                              <div className="mt-2 p-2 bg-blue-50 rounded-md">
                                <span className="text-xs font-medium text-blue-700">Observações:</span>
                                <p className="text-xs text-blue-600 mt-1">{appointment.appointment.observations}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(appointment.id)}
                              className="hover:bg-gray-200"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(appointment.id)}
                              className="hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredServices.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm text-gray-500 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Serviços
                      </h3>
                      {filteredServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/servicos/novo?id=${service.id}`)}
                        >
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <div className="text-sm text-gray-500 space-x-2">
                              <span>{service.time}</span>
                              <span>•</span>
                              <span>{currencyMask(service.price.toString())}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-gray-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredTransactions.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm text-gray-500 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Financeiro
                      </h3>
                      {filteredTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/financeiro/novo?id=${transaction.id}&type=${transaction.type === 'entrada' ? 'revenue' : 'expense'}`)}
                        >
                          <div>
                            <h3 className="font-medium">{transaction.description}</h3>
                            <p className={`text-sm ${transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {transaction.type === 'entrada' ? '+' : '-'} {currencyMask(transaction.value.toString())}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="max-w-md mx-auto">
          <AlertDialogHeader className="text-center">
            <AlertDialogTitle className="text-lg font-semibold text-gray-900">
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600 mt-2">
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex justify-end gap-3 mt-6 align-center">
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white mt-2 align-center" 
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}