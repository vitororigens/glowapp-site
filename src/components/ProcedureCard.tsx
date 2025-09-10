"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Calendar, Clock, User } from 'lucide-react';
import { formatDateToBrazilian } from '@/utils/formater/date';
import { formatCurrencyFromCents } from '@/utils/maks/masks';

interface ProcedureCardProps {
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
  };
  onViewDetails: (service: any) => void;
}

export default function ProcedureCard({ service, onViewDetails }: ProcedureCardProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Combinar fotos antes e depois, extraindo as URLs dos objetos
  const allPhotos = [
    ...(service.beforePhotos || []).map(photo => photo.url),
    ...(service.afterPhotos || []).map(photo => photo.url)
  ].filter(url => {
    const isValid = url && typeof url === 'string' && url.trim() !== '';
    if (!isValid) {
      console.log('URL de foto inválida filtrada:', url);
    }
    return isValid;
  });

  // Debug: log das fotos encontradas
  console.log('Service:', service.name, 'beforePhotos:', service.beforePhotos, 'afterPhotos:', service.afterPhotos, 'allPhotos:', allPhotos);

  const handleViewDetails = () => {
    onViewDetails(service);
  };

  const nextImage = () => {
    if (allPhotos.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % allPhotos.length);
      setImageError(false); // Reset error state when changing image
    }
  };

  const prevImage = () => {
    if (allPhotos.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
      setImageError(false); // Reset error state when changing image
    }
  };

  const servicePrice = service.price;

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group"
      onClick={handleViewDetails}
    >
      {/* Imagem do procedimento */}
      <div className="relative h-48 overflow-hidden">
        {allPhotos.length > 0 && !imageError ? (
          <>
            <img
              src={allPhotos[currentImageIndex]}
              alt={`Procedimento ${service.name}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                console.log('Erro ao carregar imagem:', allPhotos[currentImageIndex], e);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Imagem carregada com sucesso:', allPhotos[currentImageIndex]);
                setImageError(false);
              }}
            />
            
            {/* Indicadores de navegação */}
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
                >
                  ←
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full hover:bg-opacity-70 transition-all"
                >
                  →
                </button>
                
                {/* Indicadores de pontos */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {allPhotos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white">
            <div className="text-center text-gray-400">
              <div className="w-24 h-24 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14,6L10.25,11L13.1,14.8L11.5,16C9.81,13.75 7,10 7,10L1,18H23L14,6Z"/>
                </svg>
              </div>
              <p className="text-base font-medium">{allPhotos.length > 0 ? 'Imagem não disponível' : 'Sem fotos'}</p>
            </div>
          </div>
        )}
        
        {/* Badge do tipo */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-pink-500 text-white">
            Procedimento
          </span>
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
              {service.name}
            </h3>
            <div className="flex items-center text-sm text-gray-500 space-x-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDateToBrazilian(service.date)}
              </div>
              {service.time && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {service.time}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
            className="ml-2 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-green-600">
            {formatCurrencyFromCents(Number(servicePrice))}
          </span>
          
          {service.observations && (
            <p className="text-sm text-gray-500 line-clamp-2 max-w-[200px]">
              {service.observations}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}