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
import { PlusCircle, CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function Agenda() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();

  // Função para verificar se uma data tem eventos
  const hasEventsOnDate = (date: Date) => {
    return events.some(event => {
      try {
        const [day, month, year] = event.date.split('/');
        const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return eventDate.getDate() === date.getDate() &&
               eventDate.getMonth() === date.getMonth() &&
               eventDate.getFullYear() === date.getFullYear();
      } catch (error) {
        console.error('Erro ao processar data do evento:', error);
        return false;
      }
    });
  };

  useEffect(() => {
    if (uid) {
      fetchEvents();
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
      
      console.log('Eventos carregados:', eventsData);
      setEvents(eventsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      toast.error("Erro ao carregar eventos!");
    } finally {
      setIsLoading(false);
    }
  };

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

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    try {
      const [day, month, year] = event.date.split('/');
      const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      console.log('Comparando datas:', {
        eventDate: eventDate.toISOString(),
        selectedDate: selectedDate.toISOString(),
        matches: eventDate.getDate() === selectedDate.getDate() &&
                eventDate.getMonth() === selectedDate.getMonth() &&
                eventDate.getFullYear() === selectedDate.getFullYear()
      });
      
      const matchesDate = eventDate.getDate() === selectedDate.getDate() &&
                         eventDate.getMonth() === selectedDate.getMonth() &&
                         eventDate.getFullYear() === selectedDate.getFullYear();
      
      return matchesSearch && matchesDate;
    } catch (error) {
      console.error('Erro ao processar data do evento:', error);
      return false;
    }
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <Button onClick={() => router.push("/dashboard/agenda/novo")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            className="rounded-md border w-full p-3"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex justify-between w-full",
              head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
              row: "flex w-full mt-2 justify-between",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
              day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            modifiers={{
              hasEvents: (date) => hasEventsOnDate(date),
              selected: (date) => date.getTime() === selectedDate.getTime(),
            }}
            modifiersStyles={{
              hasEvents: {
                backgroundColor: 'rgba(244, 114, 182, 0.2)',
                borderRadius: '50%',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
              },
              selected: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                borderRadius: '50%',
                alignItems: 'center',
                justifyContent: 'center',
                display: 'flex',
              },
            }}
          />
        </Card>

        <div className="space-y-4">
          <Input
            placeholder="Pesquisar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">
              Eventos para {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </h2>
            
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum evento encontrado para esta data.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleToggleCheck(event.id)}
                          className="text-gray-400 hover:text-primary"
                        >
                          {event.isChecked ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-medium">{event.name}</h3>
                          <p className="text-sm text-gray-500">
                            {event.category} • {event.hour.replace(/(\d{2})(\d{2})/, '$1:$2')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(event.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}