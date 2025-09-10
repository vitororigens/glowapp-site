"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyFromCents } from "@/utils/maks/masks";
import { formatDateToBrazilian } from "@/utils/formater/date";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import { usePlanContext } from "@/context/PlanContext";
import UpgradeBanner from "@/components/UpgradeBanner";
import ProcedureCard from "@/components/ProcedureCard";
import ServiceViewModal from "@/components/ServiceViewModal";
import { Users, Calendar, DollarSign, Scissors, Plus, Eye } from "lucide-react";
import { useRouter } from "next/navigation";

interface Service {
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
  budget: boolean;
  sendToFinance: boolean;
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
  beforePhotos?: Array<{
    url: string;
    description?: string;
  }>;
  afterPhotos?: Array<{
    url: string;
    description?: string;
  }>;
  payments?: Array<{
    method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
    value: string | number;
    date: string;
    installments?: number;
  }>;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Appointment {
  id: string;
  client: {
    name: string;
    phone: string;
    email: string;
  };
  appointment: {
    date: string;
    startTime: string;
    endTime: string;
    serviceName?: string;
    servicePrice?: number;
    procedureName?: string;
    procedurePrice?: number;
    professionalName?: string;
    observations?: string;
  };
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'nao_compareceu';
  createdAt: string;
}

interface DashboardData {
  totalClients: number;
  totalServices: number;
  totalRevenue: number;
  todayAppointments: number;
  recentServices: Array<{
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
    budget: boolean;
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
    beforePhotos?: Array<{
      url: string;
      description?: string;
    }>;
    afterPhotos?: Array<{
      url: string;
      description?: string;
    }>;
    payments?: Array<{
      method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
      value: string | number;
      date: string;
      installments?: number;
    }>;
  }>;
}

export default function DashboardHome() {
  const { data: services, loading: servicesLoading, error: servicesError } = useFirestoreCollection<Service>("Services");
  const { data: clients, loading: clientsLoading, error: clientsError } = useFirestoreCollection<Contact>("Contacts");
  const { data: appointments, loading: appointmentsLoading, error: appointmentsError } = useFirestoreCollection<Appointment>("Appointments");
  const { currentPlan, loading: planLoading } = usePlanContext();
  const router = useRouter();
  
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    todayAppointments: 0,
    recentServices: [],
  });

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  const handleViewServiceDetails = (service: any) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };

  useEffect(() => {
    if (!services || !clients) return;

    const totalServices = services.filter(service => !service.budget).length;
    const totalClients = clients.length;
    
    const totalRevenue = services
      .filter(service => !service.budget)
      .reduce((acc, service) => {
        if (service.payments && service.payments.length > 0) {
          return acc + service.payments
            .reduce((sum, payment) => {
              const paymentValue = typeof payment.value === 'number' 
                ? payment.value 
                : Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", "."));
              return sum + paymentValue;
            }, 0);
        } else {
          return acc;
        }
      }, 0);

    // Calcular agendamentos de hoje
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments 
      ? appointments.filter(appointment => appointment.appointment.date === today).length 
      : 0;

    // Últimos serviços (todos os serviços, não apenas com fotos)
    const recentServices = [...services]
      .filter(service => {
        // Debug: verificar estrutura dos serviços
        if (!service.id) {
          console.warn('Service without ID:', service);
          return false;
        }
        
        const hasPhotos = (service.beforePhotos && service.beforePhotos.length > 0) || (service.afterPhotos && service.afterPhotos.length > 0);
        console.log('Service:', service.name, 'hasPhotos:', hasPhotos, 'beforePhotos:', service.beforePhotos, 'afterPhotos:', service.afterPhotos);
        
        // Mostrar todos os serviços, não apenas os com fotos
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 6)
      .map(service => {
        // Debug: verificar se o ID é válido
        if (!service.id || typeof service.id !== 'string') {
          console.error('Invalid service ID:', service.id, 'for service:', service);
        }
        
        return {
          id: service.id,
          name: service.name,
          cpf: service.cpf,
          phone: service.phone,
          email: service.email,
          date: service.date,
          time: service.time,
          price: service.price,
          priority: service.priority,
          duration: service.duration,
          budget: service.budget,
          observations: service.observations,
          services: service.services,
          professionals: service.professionals,
          beforePhotos: service.beforePhotos,
          afterPhotos: service.afterPhotos,
          payments: service.payments
        };
      });

    setDashboardData({
      totalClients,
      totalServices,
      totalRevenue,
      todayAppointments,
      recentServices,
    });
  }, [services, clients, appointments]);

  if (servicesLoading || clientsLoading || appointmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (servicesError || clientsError || appointmentsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p>Erro ao carregar dados. Por favor, tente novamente mais tarde.</p>
          <p className="text-sm mt-2">Detalhes: {servicesError?.message || clientsError?.message || appointmentsError?.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Visão geral do seu negócio</p>
        </div>

        {/* Banner de Upgrade - Mostrar apenas para usuários do plano Start */}
        {!planLoading && currentPlan === 'glow-start' && (
          <div className="mb-8">
            <UpgradeBanner />
          </div>
        )}

        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Clientes */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Clientes</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.totalClients}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agendamentos Hoje */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Agendamentos</p>
                  <p className="text-xs text-gray-500 mb-1">Hoje</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.todayAppointments}</p>
                </div>
                <div className="p-3 bg-pink-100 rounded-full">
                  <Calendar className="w-6 h-6 text-pink-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total de Serviços */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Serviços Realizados</p>
                  <p className="text-3xl font-bold text-gray-900">{dashboardData.totalServices}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Scissors className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valores Recebidos */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Valores Recebidos</p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrencyFromCents(dashboardData.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Acessos Rápidos */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acessos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/dashboard/agenda/novo')}
              className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-colors duration-200"
            >
              <Calendar className="w-6 h-6" />
              <span className="font-medium">Agendamento</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/servicos/novo')}
              className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-colors duration-200"
            >
              <Scissors className="w-6 h-6" />
              <span className="font-medium">Serviço</span>
            </button>
            <button
              onClick={() => router.push('/dashboard/clientes')}
              className="bg-pink-500 hover:bg-pink-600 text-white p-4 rounded-xl flex items-center justify-center space-x-3 transition-colors duration-200"
            >
              <Users className="w-6 h-6" />
              <span className="font-medium">Cliente</span>
            </button>
          </div>
        </div>

        {/* Últimos Serviços */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Últimos Serviços</h2>
            <button
              onClick={() => router.push('/dashboard/servicos')}
              className="text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center space-x-1"
            >
              <span>Ver Todos</span>
              <Eye className="w-4 h-4" />
            </button>
          </div>
          
          {dashboardData.recentServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.recentServices
                .filter(service => service.id && typeof service.id === 'string')
                .map((service) => (
                  <ProcedureCard 
                    key={service.id} 
                    service={service} 
                    onViewDetails={handleViewServiceDetails}
                  />
                ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Scissors className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum serviço encontrado</h3>
              <p className="text-gray-500 mb-4">Comece criando seu primeiro serviço com fotos</p>
              <button
                onClick={() => router.push('/dashboard/servicos/novo')}
                className="bg-pink-500 hover:bg-pink-600 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Serviço</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Visualização de Serviço */}
      <ServiceViewModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        service={selectedService}
      />
    </div>
  );
}