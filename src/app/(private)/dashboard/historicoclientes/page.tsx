"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { celularMask } from "@/utils/maks/masks";

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

export default function HistoricoClientes() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const { data: contacts, loading } = useFirestoreCollection<Contact>("Contacts");

  const filteredContacts = contacts?.filter(
    (contact) => contact.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleClientClick = (clientId: string, clientName: string) => {
    router.push(`/dashboard/historicoclientes/${clientId}?name=${encodeURIComponent(clientName)}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Histórico de Clientes</h1>
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContacts.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-gray-500">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <Card 
              key={contact.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleClientClick(contact.id, contact.name)}
            >
              <CardContent className="p-4 flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.imageUrl} />
                  <AvatarFallback>
                    {contact.name?.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg">{contact.name}</h3>
                  <p className="text-sm text-gray-500">{celularMask(contact.phone || '')}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 