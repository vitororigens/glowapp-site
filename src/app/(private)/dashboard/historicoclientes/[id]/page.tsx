"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where, doc, getDoc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { currencyMask, phoneMask, cpfMask, formatCurrencyFromCents } from "@/utils/maks/masks";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Edit, Trash2, AlertTriangle, Image, Eye, X, Calendar, Clock, DollarSign, User, Phone, Mail, FileText, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDateToBrazilian } from "@/utils/formater/date";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ServiceViewModal from "@/components/ServiceViewModal";

// Função para carregar valores do banco de dados (valores em centavos)
const loadCurrencyFromDB = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === 0) return '';
  
  // Usar formatCurrencyFromCents como na dashboard para consistência
  return formatCurrencyFromCents(value);
};

interface Service {
  id: string;
  name: string;
  cpf?: string;
  phone?: string;
  email?: string;
  date: string;
  time: string;
  price: number | string;
  priority?: string;
  duration?: string;
  services: Array<{
    id: string;
    code: string;
    name: string;
    price: string;
    date: string;
  }>;
  professionals?: Array<{
    id: string;
    name: string;
    specialty: string;
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
  imagesBefore?: string[];
  imagesAfter?: string[];
  beforePhotos?: Array<{
    url: string;
    description?: string;
  }>;
  afterPhotos?: Array<{
    url: string;
    description?: string;
  }>;
  observations?: string;
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
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  
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
      console.log("🔍 Buscando serviços para o cliente:", {
        clientId,
        clientName,
        uid
      });
      
      const servicesRef = collection(database, "Services");
      
      // Debug: Buscar todos os serviços do usuário para análise
      const qDebug = query(
        servicesRef,
        where("uid", "==", uid)
      );
      const allServicesSnapshot = await getDocs(qDebug);
      console.log(`📊 Total de serviços do usuário: ${allServicesSnapshot.docs.length}`);
      
      // Log dos primeiros 5 serviços para debug
      const sampleServices = allServicesSnapshot.docs.slice(0, 5).map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          contactUid: data.contactUid,
          contactId: data.contactId,
          clientId: data.clientId,
          clientName: data.clientName,
        };
      });
      console.log("📋 Amostra de serviços (primeiros 5):", sampleServices);
      
      // Primeiro, tentar buscar por contactUid (mais preciso)
      try {
        const qExact = query(
          servicesRef,
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
      
      // Se não encontrou por contactUid, buscar por outros campos de ID
      try {
        const qContactId = query(
          servicesRef,
          where("uid", "==", uid),
          where("contactId", "==", clientId)
        );
        
        const querySnapshotContactId = await getDocs(qContactId);
        console.log("Serviços encontrados com contactId:", querySnapshotContactId.docs.length);
        
        if (querySnapshotContactId.docs.length > 0) {
          const contactIdServicesData = querySnapshotContactId.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Service[];
          
          setServices(contactIdServicesData.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ));
          setIsLoadingServices(false);
          return;
        }
      } catch (contactIdError) {
        console.error("Erro na consulta por contactId:", contactIdError);
      }
      
      // Se ainda não encontrou, buscar por clientId
      try {
        const qClientId = query(
          servicesRef,
          where("uid", "==", uid),
          where("clientId", "==", clientId)
        );
        
        const querySnapshotClientId = await getDocs(qClientId);
        console.log("Serviços encontrados com clientId:", querySnapshotClientId.docs.length);
        
        if (querySnapshotClientId.docs.length > 0) {
          const clientIdServicesData = querySnapshotClientId.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Service[];
          
          setServices(clientIdServicesData.sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          ));
          setIsLoadingServices(false);
          return;
        }
      } catch (clientIdError) {
        console.error("Erro na consulta por clientId:", clientIdError);
      }
      
      // Se não encontrou por nenhum ID, buscar por nome do cliente (fallback)
      // Isso resolve casos onde serviços foram criados sem contactUid/clientId
      if (clientName) {
        try {
          console.log("Buscando serviços por nome do cliente:", clientName);
          
          // Buscar todos os serviços do usuário
          const qAll = query(
            servicesRef,
            where("uid", "==", uid)
          );
          
          const querySnapshotAll = await getDocs(qAll);
          console.log(`Total de serviços do usuário: ${querySnapshotAll.docs.length}`);
          
          // Filtrar por nome do cliente
          const servicesByName = querySnapshotAll.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter((service: any) => {
              const serviceName = service.name?.toLowerCase() || '';
              const clientNameLower = clientName.toLowerCase();
              
              // Verificar se o nome do serviço corresponde ao nome do cliente
              const matchesByName = serviceName === clientNameLower || 
                                   service.clientName?.toLowerCase() === clientNameLower;
              
              if (matchesByName) {
                console.log("✅ Serviço encontrado por nome:", service.id, {
                  serviceName: service.name,
                  clientName: clientName
                });
              }
              
              return matchesByName;
            }) as Service[];
          
          console.log(`Serviços encontrados por nome: ${servicesByName.length}`);
          
          if (servicesByName.length > 0) {
            setServices(servicesByName.sort((a, b) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            ));
            setIsLoadingServices(false);
            return;
          }
        } catch (nameError) {
          console.error("Erro na consulta por nome:", nameError);
        }
      }
      
      // Se não encontrou por nenhum método, não mostrar serviços de outros clientes
      console.log("Nenhum serviço encontrado para este cliente específico");
      setServices([]);
      
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
      
      const servicesRef = collection(database, "Services");
      let totalImages = 0;
      let servicesFound = 0;
      
      // Buscar por contactUid primeiro (mais preciso)
      try {
        const qExact = query(
          servicesRef,
          where("uid", "==", uid),
          where("contactUid", "==", clientId)
        );
        
        const querySnapshotExact = await getDocs(qExact);
        console.log(`Serviços encontrados com contactUid: ${querySnapshotExact.docs.length}`);
        
        querySnapshotExact.docs.forEach(doc => {
          const data = doc.data();
          const beforeCount = (data.imagesBefore?.length || 0) + (data.beforePhotos?.length || 0);
          const afterCount = (data.imagesAfter?.length || 0) + (data.afterPhotos?.length || 0);
          totalImages += beforeCount + afterCount;
          servicesFound++;
          console.log(`Serviço do cliente encontrado: ${beforeCount} antes + ${afterCount} depois = ${beforeCount + afterCount} total`);
        });
        
        if (servicesFound > 0) {
          console.log(`Total de imagens para cliente ${clientName}: ${totalImages} (${servicesFound} serviços)`);
          setClientImageCount(totalImages);
          return;
        }
      } catch (exactError) {
        console.error("Erro na consulta exata de imagens:", exactError);
      }
      
      // Se não encontrou por contactUid, tentar por contactId
      try {
        const qContactId = query(
          servicesRef,
          where("uid", "==", uid),
          where("contactId", "==", clientId)
        );
        
        const querySnapshotContactId = await getDocs(qContactId);
        console.log(`Serviços encontrados com contactId: ${querySnapshotContactId.docs.length}`);
        
        querySnapshotContactId.docs.forEach(doc => {
          const data = doc.data();
          const beforeCount = (data.imagesBefore?.length || 0) + (data.beforePhotos?.length || 0);
          const afterCount = (data.imagesAfter?.length || 0) + (data.afterPhotos?.length || 0);
          totalImages += beforeCount + afterCount;
          servicesFound++;
          console.log(`Serviço do cliente encontrado: ${beforeCount} antes + ${afterCount} depois = ${beforeCount + afterCount} total`);
        });
        
        if (servicesFound > 0) {
          console.log(`Total de imagens para cliente ${clientName}: ${totalImages} (${servicesFound} serviços)`);
          setClientImageCount(totalImages);
          return;
        }
      } catch (contactIdError) {
        console.error("Erro na consulta por contactId de imagens:", contactIdError);
      }
      
      // Se não encontrou por nenhum ID, buscar por nome do cliente (fallback)
      if (clientName) {
        try {
          console.log(`Buscando imagens por nome do cliente: ${clientName}`);
          
          // Buscar todos os serviços do usuário
          const qAll = query(
            servicesRef,
            where("uid", "==", uid)
          );
          
          const querySnapshotAll = await getDocs(qAll);
          
          // Filtrar por nome do cliente e contar imagens
          querySnapshotAll.docs.forEach(doc => {
            const data = doc.data();
            const serviceName = data.name?.toLowerCase() || '';
            const clientNameLower = clientName.toLowerCase();
            
            // Verificar se o nome do serviço corresponde ao nome do cliente
            const matchesByName = serviceName === clientNameLower || 
                                 data.clientName?.toLowerCase() === clientNameLower;
            
            if (matchesByName) {
              const beforeCount = (data.imagesBefore?.length || 0) + (data.beforePhotos?.length || 0);
              const afterCount = (data.imagesAfter?.length || 0) + (data.afterPhotos?.length || 0);
              totalImages += beforeCount + afterCount;
              servicesFound++;
              console.log(`Serviço encontrado por nome: ${beforeCount} antes + ${afterCount} depois = ${beforeCount + afterCount} total`);
            }
          });
          
          if (servicesFound > 0) {
            console.log(`Total de imagens para cliente ${clientName}: ${totalImages} (${servicesFound} serviços encontrados por nome)`);
            setClientImageCount(totalImages);
            return;
          }
        } catch (nameError) {
          console.error("Erro na consulta de imagens por nome:", nameError);
        }
      }
      
      // Se não encontrou por nenhum método, não contar imagens de outros clientes
      console.log(`Nenhuma imagem encontrada para cliente ${clientName}`);
      setClientImageCount(0);
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

  const handleViewService = (service: Service) => {
    console.log('🔍 Visualizando serviço:', service);
    console.log('📸 Images Before:', service.imagesBefore);
    console.log('📸 Images After:', service.imagesAfter);
    
    // Adaptar os dados do serviço para o formato esperado pelo ServiceViewModal
    const adaptedService = {
      ...service,
      // Converter imagesBefore e imagesAfter para beforePhotos e afterPhotos se necessário
      beforePhotos: service.beforePhotos || (service.imagesBefore?.map(url => ({ url })) || []),
      afterPhotos: service.afterPhotos || (service.imagesAfter?.map(url => ({ url })) || []),
      // Adicionar dados do cliente se disponível
      name: service.name || clientData?.name || "Cliente",
      cpf: service.cpf || clientData?.cpf,
      phone: service.phone || clientData?.phone,
      email: service.email || clientData?.email,
    };
    
    setSelectedService(adaptedService);
    setIsServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    setSelectedService(null);
    setIsServiceModalOpen(false);
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
              <p className="font-medium">{clientData?.phone ? phoneMask(clientData.phone) : "-"}</p>
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
                <Card key={service.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewService(service)}>
                  <CardContent className="p-0">
                    <div className={`${isBudget ? 'bg-yellow-50' : 'bg-green-50'} p-3`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{mainService}</h3>
                          <p className="text-sm text-gray-600">{formatDateToBrazilian(service.date)} | {service.time}</p>
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
                          <p className="font-medium">{loadCurrencyFromDB(service.price)}</p>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewService(service);
                            }}
                            title="Ver detalhes completos"
                          >
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditService(service.id);
                            }}
                            title="Editar serviço"
                          >
                            <Edit className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteService(service.id);
                            }}
                            title="Excluir serviço"
                          >
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

      {/* Modal de Detalhes do Serviço */}
      <ServiceViewModal
        isOpen={isServiceModalOpen}
        onClose={closeServiceModal}
        service={selectedService}
      />
    </div>
  );
}