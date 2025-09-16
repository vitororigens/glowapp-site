"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Edit, 
  Trash2,
  Calendar, 
  Clock, 
  DollarSign, 
  FileText, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  CreditCard,
  Image as ImageIcon,
  Eye,
  ZoomIn,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDateToBrazilian } from '@/utils/formater/date';
import { formatCurrencyFromCents } from '@/utils/maks/masks';

interface ServiceViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    cpf?: string;
    phone?: string;
    email?: string;
    date: string;
    time?: string;
    price: string | number;
    priority?: string;
    duration?: string;
    observations?: string;
    services?: Array<{
      id: string;
      code: string;
      name: string;
      price: string;
      date?: string;
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
    }>;
    beforePhotos?: Array<{
      url: string;
      description?: string;
    }>;
    afterPhotos?: Array<{
      url: string;
      description?: string;
    }>;
  } | null;
}

export default function ServiceViewModal({ isOpen, onClose, service }: ServiceViewModalProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentImageType, setCurrentImageType] = useState<'before' | 'after'>('before');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fechar com ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  if (!service) return null;

  const handleEdit = () => {
    router.push(`/dashboard/servicos/novo?id=${service.id}`);
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        const { database } = await import('@/services/firebase');
        const { toast } = await import('react-toastify');
        
        await deleteDoc(doc(database, "Services", service.id));
        toast.success("Serviço excluído com sucesso!");
        onClose();
      } catch (error) {
        console.error("Erro ao excluir serviço:", error);
        const { toast } = await import('react-toastify');
        toast.error("Erro ao excluir serviço!");
      }
    }
  };

  const allPhotos = [
    ...(service.beforePhotos || []).map(photo => ({ ...photo, type: 'before' as const })),
    ...(service.afterPhotos || []).map(photo => ({ ...photo, type: 'after' as const }))
  ];

  const currentPhotos = currentImageType === 'before' ? service.beforePhotos || [] : service.afterPhotos || [];

  const nextImage = () => {
    if (currentPhotos.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % currentPhotos.length);
    }
  };

  const prevImage = () => {
    if (currentPhotos.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + currentPhotos.length) % currentPhotos.length);
    }
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  const servicePrice = service.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhes Completos do Serviço
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Fechar
          </Button>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Informações do Cliente */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{service.name || "Não informado"}</p>
              </div>
              {service.cpf && (
                <div>
                  <p className="text-sm text-gray-500">CPF</p>
                  <p className="font-medium">{service.cpf}</p>
                </div>
              )}
              {service.phone && (
                <div>
                  <p className="text-sm text-gray-500">Telefone</p>
                  <p className="font-medium">{service.phone}</p>
                </div>
              )}
              {service.email && (
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{service.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Informações Básicas do Serviço */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações do Serviço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tipo</p>
                <Badge className={service.budget ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                  {service.budget ? 'Orçamento' : 'Serviço'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data</p>
                <p className="font-medium">{formatDateToBrazilian(service.date)}</p>
              </div>
              {service.time && (
                <div>
                  <p className="text-sm text-gray-500">Horário</p>
                  <p className="font-medium">{service.time}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="font-medium text-lg text-green-600">{formatCurrencyFromCents(servicePrice)}</p>
              </div>
              {service.priority && (
                <div>
                  <p className="text-sm text-gray-500">Prioridade</p>
                  <p className="font-medium">{service.priority}</p>
                </div>
              )}
              {service.duration && (
                <div>
                  <p className="text-sm text-gray-500">Duração</p>
                  <p className="font-medium">{service.duration}</p>
                </div>
              )}
            </div>
            {service.observations && (
              <div className="mt-4">
                <p className="text-sm text-gray-500">Observações</p>
                <p className="font-medium bg-white p-3 rounded border">{service.observations}</p>
              </div>
            )}
          </div>

          {/* Procedimentos Realizados */}
          {service.services && service.services.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Procedimentos Realizados
              </h3>
              <div className="space-y-3">
                {service.services.map((serviceItem, index) => (
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
                        <p className="font-medium">{formatCurrencyFromCents(Number(serviceItem.price))}</p>
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

          {/* Profissionais */}
          {service.professionals && service.professionals.length > 0 && (
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Profissionais
              </h3>
              <div className="space-y-3">
                {service.professionals.map((professional, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Nome</p>
                        <p className="font-medium">{professional.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Especialidade</p>
                        <p className="font-medium">{professional.specialty || "Não informado"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formas de Pagamento */}
          {service.payments && service.payments.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Formas de Pagamento
              </h3>
              <div className="space-y-3">
                {service.payments.map((payment, index) => (
                  <div key={index} className="bg-white p-3 rounded border">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-sm text-gray-500">Método</p>
                        <p className="font-medium capitalize">{payment.method}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Valor</p>
                        <p className="font-medium">{formatCurrencyFromCents(Number(payment.value))}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Data</p>
                        <p className="font-medium">{formatDateToBrazilian(payment.date)}</p>
                      </div>
                      {payment.installments && (
                        <div>
                          <p className="text-sm text-gray-500">Parcelas</p>
                          <p className="font-medium">{payment.installments}x</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Resumo de Pagamentos */}
              <div className="mt-4 p-3 bg-white rounded border">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Valor Total</p>
                    <p className="font-semibold text-lg">{formatCurrencyFromCents(servicePrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Pago</p>
                    <p className="font-semibold text-lg text-green-600">
                      {formatCurrencyFromCents(
                        service.payments.reduce((sum, payment) => {
                          const value = typeof payment.value === 'number' 
                            ? payment.value 
                            : Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", "."));
                          return sum + value;
                        }, 0)
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Saldo Pendente</p>
                    <p className="font-semibold text-lg text-orange-600">
                      {formatCurrencyFromCents(
                        Number(servicePrice) - service.payments.reduce((sum, payment) => {
                          const value = typeof payment.value === 'number' 
                            ? payment.value 
                            : Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", "."));
                          return sum + value;
                        }, 0)
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Galeria de Fotos */}
          {allPhotos.length > 0 && (
            <div className="bg-pink-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
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
                  Fotos Antes ({service.beforePhotos?.length || 0})
                </Button>
                <Button
                  variant={currentImageType === 'after' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setCurrentImageType('after');
                    setCurrentImageIndex(0);
                  }}
                >
                  Fotos Depois ({service.afterPhotos?.length || 0})
                </Button>
              </div>

              {/* Visualizador de imagens */}
              {currentPhotos.length > 0 ? (
                <div className="space-y-4">
                  <div className="relative bg-white rounded-lg overflow-hidden group">
                    <img
                      src={currentPhotos[currentImageIndex]?.url}
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
                            src={photo.url}
                            alt={`Miniatura ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Descrição da foto */}
                  {currentPhotos[currentImageIndex]?.description && (
                    <div className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-500">Descrição</p>
                      <p className="font-medium">{currentPhotos[currentImageIndex]?.description}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhuma foto {currentImageType === 'before' ? 'antes' : 'depois'}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Botões de ação no final do modal */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleEdit}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </Button>
        </div>
      </DialogContent>
      
      {/* Modal de tela cheia */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 z-[60] bg-black bg-opacity-95 flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <div 
            className="relative w-full h-full flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botão fechar */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Imagem em tela cheia */}
            <img
              src={currentPhotos[currentImageIndex]?.url}
              alt={`Foto ${currentImageType} ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {/* Navegação em tela cheia */}
            {currentPhotos.length > 1 && (
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
                  {currentPhotos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Informações da foto */}
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm opacity-75">
                {currentImageType === 'before' ? 'Antes' : 'Depois'} - {currentImageIndex + 1} de {currentPhotos.length}
              </p>
              {currentPhotos[currentImageIndex]?.description && (
                <p className="text-sm mt-1">{currentPhotos[currentImageIndex]?.description}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
