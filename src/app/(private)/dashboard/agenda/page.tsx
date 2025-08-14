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
import { PlusCircle, CheckCircle2, Circle, Pencil, Trash2, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { currencyMask } from "@/utils/maks/masks";

interface Event {
  id: string;
  name: string;
  category: string;
  date: string;
  hour: string;
  observation: string;
  hasNotification: boolean;
  isChecked: boolean;
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
  const [events, setEvents] = useState<Event[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();

  useEffect(() => {
    if (uid) {
      Promise.all([
        fetchEvents(),
        fetchServices(),
        fetchTransactions()
      ]).finally(() => setIsLoading(false));
    }
  }, [uid]);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(database, "Notebook");
      const q = query(eventsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isChecked: false,
      })) as Event[];
      
      setEvents(eventsData);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      toast.error("Erro ao carregar eventos!");
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
    
    return events.some(event => normalizeDateStr(event.date) === dateStr) ||
           services.some(service => normalizeDateStr(service.date) === dateStr) ||
           transactions.some(transaction => normalizeDateStr(transaction.date) === dateStr);
  };

  const getFilteredItems = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    console.log('Filtrando para a data:', dateStr);
    console.log('Serviços disponíveis:', services);
    console.log('Transações disponíveis:', transactions);

    const filteredEvents = events.filter(event => 
      normalizeDateStr(event.date) === dateStr &&
      (event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       event.category.toLowerCase().includes(searchTerm.toLowerCase()))
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

    return { filteredEvents, filteredServices, filteredTransactions };
  };

  const { filteredEvents, filteredServices, filteredTransactions } = getFilteredItems();

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    try {
      await deleteDoc(doc(database, "Notebook", id));
      setEvents(events.filter(event => event.id !== id));
      toast.success("Evento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast.error("Erro ao excluir evento!");
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/agenda/novo?id=${id}`);
  };

  const handleToggleCheck = (id: string) => {
    setEvents(events.map(event => 
      event.id === id ? { ...event, isChecked: !event.isChecked } : event
    ));
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={() => router.push("/dashboard/agenda/novo")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Evento
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
              ) : filteredEvents.length === 0 && filteredServices.length === 0 && filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum item encontrado para esta data.
                </div>
              ) : (
                <div className="space-y-6">
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

                  {filteredEvents.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium text-sm text-gray-500 flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        Eventos
                      </h3>
                      {filteredEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleToggleCheck(event.id)}
                              className="text-gray-400 hover:text-primary transition-colors"
                            >
                              {event.isChecked ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </button>
                            <div>
                              <h3 className="font-medium">{event.name}</h3>
                              <div className="text-sm text-gray-500 space-x-2">
                                <span>{event.category}</span>
                                <span>•</span>
                                <span>{event.hour.replace(/(\d{2})(\d{2})/, '$1:$2')}</span>
                              </div>
                              {event.observation && (
                                <p className="text-sm text-gray-600 mt-1">{event.observation}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(event.id)}
                              className="hover:bg-gray-200"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(event.id)}
                              className="hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
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
    </div>
  );
}