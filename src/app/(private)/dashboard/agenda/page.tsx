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
      // Converte a data do evento (formato dd/mm/yyyy) para objeto Date
      const [day, month, year] = event.date.split('/');
      const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Compara apenas a data (ignorando o horário)
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
            className="rounded-md border"
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
                            {event.category} • {event.hour}
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