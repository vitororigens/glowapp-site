"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where, doc, getDoc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { currencyMask, celularMask, cpfMask, formatCurrencyFromCents } from "@/utils/maks/masks";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Edit, Trash2, AlertTriangle, Image, Eye, X, Calendar, Clock, DollarSign, User, Phone, Mail, FileText, ZoomIn, ChevronLeft, ChevronRight } from "lucide-react";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDateToBrazilian } from "@/utils/formater/date";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Função para carregar valores do banco de dados (valores em centavos)
const loadCurrencyFromDB = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === 0) return '';
  
  // Usar formatCurrencyFromCents como na dashboard para consistência
  return formatCurrencyFromCents(value);
};

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
  imagesBefore?: string[];
  imagesAfter?: string[];
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageType, setCurrentImageType] = useState<'before' | 'after'>('before');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
          afterPhotos: data.afterPhotos?.length || 0,
          imagesBefore: data.imagesBefore?.length || 0,
          imagesAfter: data.imagesAfter?.length || 0
        });
        
        // Verificar se é do cliente correto
        if (data.contactUid === clientId || data.name === clientName) {
          servicesFound++;
          const beforeCount = (data.imagesBefore?.length || 0) + (data.beforePhotos?.length || 0);
          const afterCount = (data.imagesAfter?.length || 0) + (data.afterPhotos?.length || 0);
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

  const handleViewService = (service: Service) => {
    console.log('🔍 Visualizando serviço:', service);
    console.log('📸 Images Before:', service.imagesBefore);
    console.log('📸 Images After:', service.imagesAfter);
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  const closeServiceModal = () => {
    setSelectedService(null);
    setIsServiceModalOpen(false);
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const nextImage = () => {
    if (selectedService) {
      const currentPhotos = currentImageType === 'before' ? selectedService.imagesBefore || [] : selectedService.imagesAfter || [];
      if (currentPhotos.length > 1) {
        setCurrentImageIndex((prev) => (prev + 1) % currentPhotos.length);
      }
    }
  };

  const prevImage = () => {
    if (selectedService) {
      const currentPhotos = currentImageType === 'before' ? selectedService.imagesBefore || [] : selectedService.imagesAfter || [];
      if (currentPhotos.length > 1) {
        setCurrentImageIndex((prev) => (prev - 1 + currentPhotos.length) % currentPhotos.length);
      }
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
      <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes Completos do Serviço
            </DialogTitle>
          </DialogHeader>
          
          {selectedService && (
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nome do Serviço</p>
                    <p className="font-medium">{selectedService.name || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tipo</p>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedService.budget ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedService.budget ? 'Orçamento' : 'Serviço'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Data</p>
                    <p className="font-medium">{formatDateToBrazilian(selectedService.date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Horário</p>
                    <p className="font-medium">{selectedService.time || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valor Total</p>
                    <p className="font-medium text-lg">{loadCurrencyFromDB(selectedService.price)}</p>
                  </div>
                </div>
              </div>

              {/* Detalhes dos Serviços */}
              {selectedService.services && selectedService.services.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Procedimentos Realizados
                  </h3>
                  <div className="space-y-3">
                    {selectedService.services.map((serviceItem, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <p className="text-sm text-gray-500">Código</p>
                            <p className="font-medium">{serviceItem.code || "Não informado"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Nome do Procedimento</p>
                            <p className="font-medium">{serviceItem.name || "Não informado"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Valor</p>
                            <p className="font-medium">{loadCurrencyFromDB(serviceItem.price)}</p>
                          </div>
                        </div>
                        {serviceItem.date && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">Data do Procedimento</p>
                            <p className="font-medium">{formatDateToBrazilian(serviceItem.date)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formas de Pagamento */}
              {selectedService.payments && selectedService.payments.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Formas de Pagamento
                  </h3>
                  <div className="space-y-3">
                    {selectedService.payments.map((payment, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-sm text-gray-500">Método</p>
                            <p className="font-medium capitalize">{payment.method || "Não informado"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Valor</p>
                            <p className="font-medium">{currencyMask(payment.value)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Parcelas</p>
                            <p className="font-medium">{payment.installments ? `${payment.installments}x` : "À vista"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              payment.status === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status === 'pago' ? 'Pago' : 'Pendente'}
                            </span>
                          </div>
                        </div>
                        {payment.date && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500">Data do Pagamento</p>
                            <p className="font-medium">{formatDateToBrazilian(payment.date)}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informações do Cliente */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações do Cliente
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium">{clientData?.name || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Telefone</p>
                    <p className="font-medium">{clientData?.phone ? celularMask(clientData.phone) : "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{clientData?.email || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CPF</p>
                    <p className="font-medium">{clientData?.cpf ? cpfMask(clientData.cpf) : "Não informado"}</p>
                  </div>
                </div>
                {clientData?.observations && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500">Observações do Cliente</p>
                    <p className="font-medium bg-white p-3 rounded border">{clientData.observations}</p>
                  </div>
                )}
              </div>

              {/* Observações do Serviço */}
              {selectedService.observations && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Observações do Serviço
                  </h3>
                  <div className="bg-white p-3 rounded border">
                    <p className="font-medium">{selectedService.observations}</p>
                  </div>
                </div>
              )}

              {/* Galeria de Fotos */}
              {((selectedService.imagesBefore?.length ?? 0) > 0 || (selectedService.imagesAfter?.length ?? 0) > 0) && (
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Galeria de Fotos
                  </h3>
                  
                  {/* Seletor de tipo de foto */}
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant={currentImageType === 'before' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentImageType('before');
                        setCurrentImageIndex(0);
                      }}
                    >
                      Fotos Antes ({selectedService.imagesBefore?.length || 0})
                    </Button>
                    <Button
                      variant={currentImageType === 'after' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCurrentImageType('after');
                        setCurrentImageIndex(0);
                      }}
                    >
                      Fotos Depois ({selectedService.imagesAfter?.length || 0})
                    </Button>
                  </div>

                  {/* Visualizador de imagens */}
                  {(() => {
                    const currentPhotos = currentImageType === 'before' ? selectedService.imagesBefore || [] : selectedService.imagesAfter || [];
                    return currentPhotos.length > 0 ? (
                      <div className="space-y-4">
                        <div className="relative bg-white rounded-lg overflow-hidden group">
                          <img
                            src={currentPhotos[currentImageIndex]}
                            alt={`Foto ${currentImageType} ${currentImageIndex + 1}`}
                            className="w-full h-80 object-cover cursor-pointer transition-transform duration-200 hover:scale-105"
                            onClick={openFullscreen}
                          />
                          
                          {/* Botão de tela cheia */}
                          <button
                            onClick={openFullscreen}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          >
                            <ZoomIn className="w-4 h-4" />
                          </button>
                          
                          {/* Navegação de imagens */}
                          {currentPhotos.length > 1 && (
                            <>
                              <button
                                onClick={prevImage}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={nextImage}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              
                              {/* Indicadores */}
                              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                                {currentPhotos.map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                                      index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Miniaturas */}
                        {currentPhotos.length > 1 && (
                          <div className="flex space-x-2 overflow-x-auto pb-2">
                            {currentPhotos.map((photo, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                  index === currentImageIndex 
                                    ? 'border-pink-500 ring-2 ring-pink-200' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <img
                                  src={photo}
                                  alt={`Miniatura ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-white rounded-lg">
                        <Image className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">Nenhuma foto {currentImageType === 'before' ? 'antes' : 'depois'}</p>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={closeServiceModal}>
                  <X className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
                <Button onClick={() => {
                  closeServiceModal();
                  handleEditService(selectedService.id);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Serviço
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
        
        {/* Modal de tela cheia */}
        {isFullscreen && selectedService && (
          <div className="fixed inset-0 z-[60] bg-black bg-opacity-95 flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center p-4">
              {/* Botão fechar */}
              <button
                onClick={closeFullscreen}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Imagem em tela cheia */}
              {(() => {
                const currentPhotos = currentImageType === 'before' ? selectedService.imagesBefore || [] : selectedService.imagesAfter || [];
                return currentPhotos.length > 0 ? (
                  <img
                    src={currentPhotos[currentImageIndex]}
                    alt={`Foto ${currentImageType} ${currentImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : null;
              })()}
              
              {/* Navegação em tela cheia */}
              {(() => {
                const currentPhotos = currentImageType === 'before' ? selectedService.imagesBefore || [] : selectedService.imagesAfter || [];
                return currentPhotos.length > 1 ? (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-70"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                    
                    {/* Indicadores em tela cheia */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {(() => {
                        const currentPhotos = currentImageType === 'before' ? selectedService.imagesBefore || [] : selectedService.imagesAfter || [];
                        return currentPhotos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                            }`}
                          />
                        ));
                      })()}
                    </div>
                  </>
                ) : null;
              })()}
              
              {/* Informações da foto */}
              <div className="absolute bottom-4 left-4 text-white">
                {(() => {
                  const currentPhotos = currentImageType === 'before' ? selectedService.imagesBefore || [] : selectedService.imagesAfter || [];
                  return currentPhotos.length > 0 ? (
                    <p className="text-sm opacity-75">
                      {currentImageType === 'before' ? 'Antes' : 'Depois'} - {currentImageIndex + 1} de {currentPhotos.length}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
} 