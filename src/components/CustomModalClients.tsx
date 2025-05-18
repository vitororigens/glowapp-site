"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "react-toastify";
import { ScrollArea } from "@/components/ui/scroll-area";
import { celularMask, cpfMask } from "@/utils/maks/masks";

interface Client {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email?: string;
}

interface CustomModalClientsProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (client: Client) => void;
  title: string;
}

export function CustomModalClients({
  visible,
  onClose,
  onSelect,
  title,
}: CustomModalClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthContext();
  const uid = user?.uid;

  useEffect(() => {
    if (visible && uid) {
      fetchClients();
    }
  }, [visible, uid]);

  const fetchClients = async () => {
    try {
      const clientsRef = collection(database, "Contacts");
      const q = query(clientsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const clientsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Client[];

      setClients(clientsData);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast.error("Erro ao carregar clientes!");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm) ||
    client.phone.includes(searchTerm)
  );

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>

        <div className="mb-4">
          <Label>Buscar</Label>
          <Input
            placeholder="Buscar por nome, CPF ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-4">Nenhum cliente encontrado.</div>
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelect(client);
                    onClose();
                  }}
                >
                  <p className="font-medium text-lg text-gray-900">{client.name}</p>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <p>CPF: {cpfMask(client.cpf)}</p>
                    <p>Telefone: {celularMask(client.phone)}</p>
                    {client.email && <p className="md:col-span-2">Email: {client.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
} 