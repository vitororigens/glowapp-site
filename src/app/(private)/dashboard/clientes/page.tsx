"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where, deleteDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { phoneMask, cpfMask } from "@/utils/maks/masks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, PlusCircle } from "lucide-react";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Contact {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  observations: string;
  imageUrl?: string;
  createdAt: string;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');  // ✅ Adicionar busca
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const { planLimits, canAddClient, getRemainingClients } = usePlanLimitations();

  useEffect(() => {
    if (uid) {
      fetchContacts();
    }
  }, [uid]);

  const fetchContacts = async () => {
    try {
      const contactsRef = collection(database, "Contacts");
      const q = query(contactsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const contactsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contact[];
      
      setContacts(contactsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error("Erro ao carregar clientes!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    try {
      await deleteDoc(doc(database, "Contacts", id));
      setContacts(contacts.filter(contact => contact.id !== id));
      toast.success("Cliente excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente!");
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/clientes/novo?id=${id}`);
  };

  // ✅ Filtrar clientes pela busca
  const filteredContacts = contacts.filter((contact) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(searchLower) ||
      contact.phone.includes(searchTerm) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.cpf?.includes(searchTerm)
    );
  });

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Clientes</h1>
            <p className="text-sm text-gray-600">
              {contacts.length} de {planLimits.clients} clientes utilizados
              {getRemainingClients(contacts.length) > 0 && (
                <span className="text-green-600">
                  {" "}
                  • {getRemainingClients(contacts.length)} restantes
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              onClick={() => router.push("/dashboard/clientes/novo")}
              disabled={!canAddClient(contacts.length)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="sm:hidden">Novo</span>
              <span className="hidden sm:inline">Novo Cliente</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        {!canAddClient(contacts.length) && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Você atingiu o limite de {planLimits.clients} clientes do seu plano {planLimits.planName}.
              <Button
                variant="link"
                className="p-0 h-auto font-semibold text-yellow-800"
                onClick={() => router.push("/dashboard/planos")}
              >
                Faça upgrade para adicionar mais clientes.
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-4">
            <Input
              type="text"
              placeholder="Pesquisar por nome, telefone, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        {searchTerm.trim()
                          ? "Nenhum cliente encontrado para esta busca."
                          : "Nenhum cliente encontrado."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={contact.imageUrl} />
                              <AvatarFallback>
                                {contact.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span>{contact.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{cpfMask(contact.cpf)}</TableCell>
                        <TableCell>{phoneMask(contact.phone)}</TableCell>
                        <TableCell>{contact.email}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(contact.id)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(contact.id)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
