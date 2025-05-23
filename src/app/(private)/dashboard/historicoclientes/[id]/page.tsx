"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where, doc, getDoc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { currencyMask, celularMask, cpfMask } from "@/utils/maks/masks";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";

interface Service {
  id: string;
  name: string;
  date: string;
  time: string;
  price: number | string;
  services: Array<{
    id: string;
    code: string;
    name: string;
    price: string;
    date: string;
  }>;
  budget: boolean;
  payments?: Array<{
    method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
    value: string | number;
    date: string;
    installments?: number;
    status: 'pendente' | 'pago';
  }>;
  uid: string;
  contactId: string;
  contactUid?: string;
  clientId?: string;
}

interface Client {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  observations?: string;
  imageUrl?: string;
}

export default function ClientHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [clientData, setClientData] = useState<Client | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const clientId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '';
  const clientName = searchParams.get('name') ? decodeURIComponent(searchParams.get('name') || "") : "";
  
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      try {
        const docRef = doc(database, "Contacts", clientId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setClientData({ 
            id: docSnap.id, 
            ...docSnap.data() 
          } as Client);
        } else {
          toast.error("Cliente não encontrado!");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do cliente:", error);
        toast.error("Erro ao carregar dados do cliente!");
      } finally {
        setIsLoadingClient(false);
      }
    };
    
    fetchClientData();
  }, [clientId]);
  
  useEffect(() => {
    if (uid && clientId) {
      fetchClientServices();
    }
  }, [uid, clientId, clientName]);

  const fetchClientServices = async () => {
    try {
      setIsLoadingServices(true);
      console.log("Buscando serviços para o cliente ID:", clientId);
      
      try {
        const servicesRefExact = collection(database, "Services");
        const qExact = query(
          servicesRefExact,
          where("uid", "==", uid),
          where("contactUid", "==", clientId)
        );
        
        const querySnapshotExact = await getDocs(qExact);
        console.log("Serviços encontrados com contactUid:", querySnapshotExact.docs.length);
        
        if (querySnapshotExact.docs.length > 0) {
          const exactServicesData = querySnapshotExact.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Service[];
          
          setServices(exactServicesData.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ));
          setIsLoadingServices(false);
          return;
        }
      } catch (exactError) {
        console.error("Erro na consulta exata:", exactError);
      }
      
      const servicesRef = collection(database, "Services");
      
      const q = query(
        servicesRef, 
        where("uid", "==", uid)
      );
      
      const querySnapshot = await getDocs(q);
      console.log("Total de serviços do usuário:", querySnapshot.docs.length);
      
      if (querySnapshot.docs.length > 0) {
        const sampleDoc = querySnapshot.docs[0].data();
        console.log("Estrutura de exemplo:", Object.keys(sampleDoc));
        console.log("ID do cliente buscado:", clientId);
        console.log("Nome do cliente:", clientName);
      }
      
      const servicesData = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(service => {
          const docData = service as any;
          
          const matchesById = 
            docData.contactId === clientId || 
            docData.contactUid === clientId ||
            docData.clientId === clientId;
          
          const matchesByName = 
            clientName && 
            docData.name && 
            docData.name.toLowerCase() === clientName.toLowerCase();
            
          return matchesById || matchesByName;
        }) as Service[];
      
      console.log("Serviços encontrados para este cliente:", servicesData.length);
      
      if (servicesData.length === 0 && querySnapshot.docs.length > 0) {
        console.log("Tentando abordagem alternativa de busca...");
        
        const alternativeServices = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            const stringData = JSON.stringify(data).toLowerCase();
            const matches = 
              stringData.includes(clientId.toLowerCase()) || 
              (clientName && stringData.includes(clientName.toLowerCase()));
            
            if (matches) {
              return {
                id: doc.id,
                ...data
              };
            }
            return null;
          })
          .filter(service => service !== null) as Service[];
          
        console.log("Serviços encontrados com abordagem alternativa:", alternativeServices.length);
        
        if (alternativeServices.length > 0) {
          setServices(alternativeServices);
          return;
        }
      }
      
      setServices(servicesData.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    } catch (error) {
      console.error("Erro ao buscar serviços do cliente:", error);
      toast.error("Erro ao carregar histórico do cliente!");
    } finally {
      setIsLoadingServices(false);
    }
  };

  const filteredServices = services.filter(service => 
    service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.services?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleNewService = () => {
    router.push(`/dashboard/servicos/novo?contactId=${clientId}`);
  };

  const handleEditService = (serviceId: string) => {
    router.push(`/dashboard/servicos/novo?id=${serviceId}`);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;

    try {
      await deleteDoc(doc(database, "Services", serviceId));
      setServices(services.filter(service => service.id !== serviceId));
      toast.success("Serviço excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      toast.error("Erro ao excluir serviço!");
    }
  };
  
  const isLoading = isLoadingClient || isLoadingServices;
  const hasNoServices = !isLoading && services.length === 0;
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.back()}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Histórico: {clientName}</h1>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Informações do Cliente</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{clientData?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefone</p>
              <p className="font-medium">{clientData?.phone ? celularMask(clientData.phone) : "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">CPF</p>
              <p className="font-medium">{clientData?.cpf ? cpfMask(clientData.cpf) : "-"}</p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{clientData?.email || "-"}</p>
          </div>
          <div className="mt-2">
            <p className="text-sm text-gray-500">Serviços realizados</p>
            <p className="font-medium">{services.length}</p>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Serviços</h2>
          <Button onClick={handleNewService}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Serviço
          </Button>
        </div>
        
        <div className="mb-4">
          <Input
            placeholder="Buscar serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {hasNoServices ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-2">Você ainda não possui nenhum serviço para este cliente.</p>
            <p className="text-gray-500">Comece adicionando um novo serviço.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const mainService = service.services?.[0]?.name || service.name || "Serviço";
              const isBudget = service.budget;
              
              return (
                <Card key={service.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`${isBudget ? 'bg-yellow-50' : 'bg-green-50'} p-3`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{mainService}</h3>
                          <p className="text-sm text-gray-600">{service.date} | {service.time}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          isBudget ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {isBudget ? 'Orçamento' : 'Serviço'}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex justify-between items-center mt-2">
                        <div>
                          <p className="text-sm text-gray-600">Valor:</p>
                          <p className="font-medium">{currencyMask(String(service.price))}</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm" onClick={() => handleEditService(service.id)}>
                            <Edit className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteService(service.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 