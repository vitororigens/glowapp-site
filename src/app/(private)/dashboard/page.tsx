"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { currencyMask } from "@/utils/maks/masks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardHome() {
  const [contacts, setContacts] = useState([]);
  const [events, setEvents] = useState([]);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthContext();
  const uid = user?.uid;

  useEffect(() => {
    if (uid) {
      fetchData();
    }
  }, [uid]);

  const fetchData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Buscar contatos
      const contactsRef = collection(database, "Contacts");
      const contactsQuery = query(contactsRef, where("uid", "==", uid));
      const contactsSnapshot = await getDocs(contactsQuery);
      setContacts(contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Buscar eventos do dia
      const eventsRef = collection(database, "Notebook");
      const eventsQuery = query(eventsRef, where("uid", "==", uid), where("date", "==", today));
      const eventsSnapshot = await getDocs(eventsQuery);
      setEvents(eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Buscar serviços do mês
      const servicesRef = collection(database, "Services");
      const servicesQuery = query(servicesRef, where("uid", "==", uid));
      const servicesSnapshot = await getDocs(servicesQuery);
      setServices(servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calcularReceitaMensal = () => {
    return services.reduce((total, service) => total + Number(service.price.replace(/\D/g, '')), 0);
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-lg font-medium">Total de Clientes</h3>
          <p className="mt-2 text-3xl font-bold">{contacts.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Agendamentos Hoje</h3>
          <p className="mt-2 text-3xl font-bold">{events.length}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Receita Mensal</h3>
          <p className="mt-2 text-3xl font-bold">{currencyMask(calcularReceitaMensal().toString())}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Serviços Ativos</h3>
          <p className="mt-2 text-3xl font-bold">{services.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Próximos Agendamentos</h3>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>{event.hour}</TableCell>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{event.isChecked ? "Confirmado" : "Pendente"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Últimos Serviços</h3>
          <ScrollArea className="h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.slice(0, 5).map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{currencyMask(service.price)}</TableCell>
                    <TableCell>{format(new Date(service.date), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}