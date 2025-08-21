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
import { ArrowLeft, Plus, Edit, Trash2, AlertTriangle, Image } from "lucide-react";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [clientImageCount, setClientImageCount] = useState(0);
  
  const { user } = useAuthContext();
  const { planLimits, canAddImageToClient, getRemainingImagesForClient } = usePlanLimitations();
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
      fetchClientImageCount();
    }
  }, [uid, clientId, clientName]);

  // Atualizar quando a página recebe foco (quando volta do serviço)
  useEffect(() => {
    const handleFocus = () => {
      if (uid && clientId) {
        fetchClientImageCount();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && uid && clientId) {
        fetchClientImageCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [uid, clientId]);

  // Atualizar contagem de imagens quando os serviços mudam
  useEffect(() => {
    if (services.length > 0 && uid && clientId) {
      fetchClientImageCount();
    }
  }, [services.length, uid, clientId]);

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

  const fetchClientImageCount = async () => {
    if (!clientId || !uid) return;

    try {
      console.log(`Buscando imagens para cliente: ${clientId}`);
      
      // Buscar todos os serviços do usuário
      const servicesRef = collection(database, "Services");
      const q = query(
        servicesRef,
        where("uid", "==", uid)
      );
      
      const querySnapshot = await getDocs(q);
      let totalImages = 0;
      let servicesFound = 0;
      
      console.log(`Total de serviços encontrados: ${querySnapshot.docs.length}`);
      
      querySnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log(`Serviço ${doc.id}:`, {
          contactUid: data.contactUid,
          name: data.name,
          beforePhotos: data.beforePhotos?.length || 0,
          afterPhotos: data.afterPhotos?.length || 0
        });
        
        // Verificar se é do cliente correto
        if (data.contactUid === clientId || data.name === clientName) {
          servicesFound++;
          const beforeCount = data.beforePhotos?.length || 0;
          const afterCount = data.afterPhotos?.length || 0;
          totalImages += beforeCount + afterCount;
          console.log(`Serviço do cliente encontrado: ${beforeCount} antes + ${afterCount} depois = ${beforeCount + afterCount} total`);
        }
      });
      
      console.log(`Serviços do cliente encontrados: ${servicesFound}`);
      console.log(`Total de imagens do cliente ${clientId}: ${totalImages}`);
      
      setClientImageCount(totalImages);
    } catch (error) {
      console.error('Erro ao buscar contagem de imagens do cliente:', error);
      setClientImageCount(0);
    }
  };

  // Função para atualizar manualmente
  const refreshImageCount = () => {
    fetchClientImageCount();
  };

  const filteredServices = services.filter(service =>
    service.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.services?.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleNewService = () => {
    // Atualizar contagem antes de ir para o serviço
    fetchClientImageCount();
    router.push(`/dashboard/servicos/novo?contactId=${clientId}`);
  };

  // Atualizar periodicamente para pegar mudanças
  useEffect(() => {
    if (uid && clientId) {
      const interval = setInterval(() => {
        fetchClientImageCount();
      }, 2000); // Atualiza a cada 2 segundos

      return () => clearInterval(interval);
    }
  }, [uid, clientId]);

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
          
          {/* Controle de Imagens do Cliente */}
          {planLimits && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-blue-800">Controle de Imagens</span>
                </div>

              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-blue-700">Total de imagens do cliente:</span>
                <span className="font-medium">{clientImageCount} de {planLimits.images}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full ${
                    clientImageCount / planLimits.images > 0.9 ? 'bg-red-500' :
                    clientImageCount / planLimits.images > 0.8 ? 'bg-orange-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((clientImageCount / planLimits.images) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-600">
                {clientImageCount >= planLimits.images ? (
                  <span className="text-red-600 font-medium">
                    Limite atingido! Não é possível adicionar mais imagens.
                  </span>
                ) : (
                  <span>
                    Restam {getRemainingImagesForClient(clientImageCount)} imagens disponíveis para este cliente.
                  </span>
                )}
              </div>
              
              {/* Alerta quando limite está próximo ou atingido */}
              {clientImageCount >= planLimits.images && (
                <Alert className="mt-2 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    Limite de {planLimits.images} imagens por cliente atingido! 
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-semibold text-red-800"
                      onClick={() => router.push('/dashboard/planos')}
                    >
                      Faça upgrade para adicionar mais imagens.
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              {clientImageCount >= planLimits.images * 0.8 && clientImageCount < planLimits.images && (
                <Alert className="mt-2 border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    Limite próximo! {Math.round((clientImageCount / planLimits.images) * 100)}% das imagens utilizadas.
                    <Button 
                      variant="link" 
                      className="p-0 h-auto font-semibold text-orange-800"
                      onClick={() => router.push('/dashboard/planos')}
                    >
                      Considere fazer upgrade.
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
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