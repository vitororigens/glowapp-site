"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Calendar, User, DollarSign, CheckCircle, XCircle, ArrowRight, ChevronLeft, ChevronRight, X, Phone, Mail, Clock, FileText, UserCheck, Settings, Pencil } from "lucide-react";
import { formatDateToBrazilian } from "@/utils/formater/date";
import { useRouter } from "next/navigation";

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

// Função para formatar valor do agendamento
const formatAppointmentPrice = (value: number) => {
  const valueInReais = value / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInReais);
};

export default function TodayAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAppointmentDetailsModal, setShowAppointmentDetailsModal] = useState(false);
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<Appointment | null>(null);
  
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();

  useEffect(() => {
    if (uid) {
      fetchTodayAppointments();
    }
  }, [uid]);

  const fetchTodayAppointments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const appointmentsRef = collection(database, "Appointments");
      const q = query(appointmentsRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const appointmentsData = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Appointment))
        .filter(appointment => 
          appointment.appointment && 
          appointment.appointment.date && 
          appointment.appointment.date === today
        )
        .sort((a, b) => a.appointment.startTime.localeCompare(b.appointment.startTime));

      setAppointments(appointmentsData);
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
      toast.error("Erro ao carregar agendamentos!");
    } finally {
      setIsLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: Appointment['status']) => {
    try {
      const appointmentRef = doc(database, "Appointments", appointmentId);
      await updateDoc(appointmentRef, { status: newStatus });
      
      // Atualizar estado local
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === appointmentId 
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );
      
      toast.success(`Agendamento ${newStatus === 'confirmado' ? 'confirmado' : newStatus === 'cancelado' ? 'cancelado' : 'concluído'} com sucesso!`);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar agendamento!");
    }
  };

  const openAppointmentDetailsModal = (appointment: Appointment) => {
    setSelectedAppointmentForDetails(appointment);
    setShowAppointmentDetailsModal(true);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/agenda/novo?id=${id}`);
  };

  // Funções do carrossel
  const nextSlide = () => {
    const maxIndex = Math.max(0, appointments.length - 3);
    setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1));
  };

  const prevSlide = () => {
    const maxIndex = Math.max(0, appointments.length - 3);
    setCurrentIndex((prev) => (prev - 1 + maxIndex + 1) % (maxIndex + 1));
  };


  const getStatusConfig = (status: Appointment['status']) => {
    switch (status) {
      case 'pendente':
        return {
          label: 'PENDENTE',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'confirmado':
        return {
          label: 'CONFIRMADO',
          className: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'concluido':
        return {
          label: 'CONCLUÍDO',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'cancelado':
        return {
          label: 'CANCELADO',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'nao_compareceu':
        return {
          label: 'NÃO COMPARECEU',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return {
          label: 'PENDENTE',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5); // Remove segundos se houver
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Agendamentos de Hoje</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Agendamentos de Hoje</h2>
          <button
            onClick={() => router.push('/dashboard/agenda')}
            className="text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center space-x-1"
          >
            <span>Ver Todos</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum agendamento hoje</h3>
          <p className="text-gray-500 mb-4">Você não tem agendamentos para hoje</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Agendamentos de Hoje</h2>
        <button
          onClick={() => router.push('/dashboard/agenda')}
          className="text-pink-600 hover:text-pink-700 text-sm font-medium flex items-center space-x-1"
        >
          <span>Ver Todos</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative">
        {/* Carrossel Container */}
        <div className="overflow-hidden">
          <div className="flex transition-transform duration-300 ease-in-out" style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}>
            {appointments.map((appointment) => {
          const statusConfig = getStatusConfig(appointment.status);
          const price = appointment.appointment.servicePrice || appointment.appointment.procedurePrice || 0;
          
          return (
            <div key={appointment.id} className="w-1/3 flex-shrink-0 px-3">
              <Card 
                className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow duration-300 h-full cursor-pointer"
                onClick={() => openAppointmentDetailsModal(appointment)}
              >
                <CardContent className="p-6">
                {/* Header com nome e status */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {appointment.appointment.serviceName || appointment.appointment.procedureName || 'Serviço'}
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.className}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Data e hora */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-pink-600" />
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatDateToBrazilian(appointment.appointment.date)} às {formatTime(appointment.appointment.startTime)}
                  </span>
                </div>

                {/* Cliente */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-600">{appointment.client.name}</span>
                </div>

                {/* Valor */}
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatAppointmentPrice(price)}
                  </span>
                </div>

                {/* Ações baseadas no status */}
                <div className="mt-4">
                  {appointment.status === 'pendente' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateAppointmentStatus(appointment.id, 'confirmado')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirmar
                      </Button>
                      <Button
                        onClick={() => updateAppointmentStatus(appointment.id, 'cancelado')}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}

                  {appointment.status === 'confirmado' && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => updateAppointmentStatus(appointment.id, 'concluido')}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Concluir
                      </Button>
                      <Button
                        onClick={() => updateAppointmentStatus(appointment.id, 'nao_compareceu')}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Não Compareceu
                      </Button>
                    </div>
                  )}

                  {appointment.status === 'concluido' && (
                    <Button
                      onClick={() => router.push(`/dashboard/agenda?convert=${appointment.id}`)}
                      className="w-full bg-pink-600 hover:bg-pink-700 text-white text-sm"
                    >
                      Converter para Serviço
                    </Button>
                  )}
                </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
          </div>
        </div>

        {/* Botões de navegação do carrossel */}
        {appointments.length > 3 && (
          <>
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow duration-200 z-10"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </>
        )}
      </div>

      {/* Modal de Detalhes do Agendamento */}
      <AlertDialog open={showAppointmentDetailsModal} onOpenChange={setShowAppointmentDetailsModal}>
        <AlertDialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <AlertDialogHeader className="flex-shrink-0 relative">
            <div className="absolute top-0 right-0 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAppointmentDetailsModal(false)}
                className="h-8 w-8 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <AlertDialogTitle className="pr-8 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Detalhes Completo do Agendamento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Informações detalhadas do agendamento selecionado
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex-1 overflow-y-auto min-h-0">
            {selectedAppointmentForDetails && (() => {
              const appointment = selectedAppointmentForDetails;
              const price = appointment.appointment?.servicePrice || appointment.appointment?.procedurePrice || 0;
              
              const getStatusConfig = (status: Appointment['status']) => {
                switch (status) {
                  case 'pendente':
                    return {
                      label: 'PENDENTE',
                      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      bgColor: 'bg-yellow-50',
                      textColor: 'text-yellow-900'
                    };
                  case 'confirmado':
                    return {
                      label: 'CONFIRMADO',
                      className: 'bg-blue-100 text-blue-800 border-blue-200',
                      bgColor: 'bg-blue-50',
                      textColor: 'text-blue-900'
                    };
                  case 'concluido':
                    return {
                      label: 'CONCLUÍDO',
                      className: 'bg-green-100 text-green-800 border-green-200',
                      bgColor: 'bg-green-50',
                      textColor: 'text-green-900'
                    };
                  case 'cancelado':
                    return {
                      label: 'CANCELADO',
                      className: 'bg-red-100 text-red-800 border-red-200',
                      bgColor: 'bg-red-50',
                      textColor: 'text-red-900'
                    };
                  case 'nao_compareceu':
                    return {
                      label: 'NÃO COMPARECEU',
                      className: 'bg-gray-100 text-gray-800 border-gray-200',
                      bgColor: 'bg-gray-50',
                      textColor: 'text-gray-900'
                    };
                  default:
                    return {
                      label: 'PENDENTE',
                      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      bgColor: 'bg-yellow-50',
                      textColor: 'text-yellow-900'
                    };
                }
              };

              const statusConfig = getStatusConfig(appointment.status);

              return (
                <div className="space-y-6 pb-4">
                  {/* Header com Status */}
                  <div className={`p-6 rounded-lg border ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">
                          {appointment.appointment?.serviceName || appointment.appointment?.procedureName || 'Serviço'}
                        </h2>
                        <p className="text-lg opacity-80">
                          {appointment.client.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold border ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                        <p className="text-2xl font-bold mt-2">
                          {formatAppointmentPrice(price)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Agendamento */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Informações do Agendamento
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.className}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Data</p>
                        <p className="font-medium">{formatDateToBrazilian(appointment.appointment?.date || '')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Horário</p>
                        <p className="font-medium">{appointment.appointment?.startTime} - {appointment.appointment?.endTime}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Valor Total</p>
                        <p className="font-medium text-lg text-green-600">{formatAppointmentPrice(price)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Serviço</p>
                        <p className="font-medium">{appointment.appointment?.serviceName || appointment.appointment?.procedureName || "Não informado"}</p>
                      </div>
                    </div>
                    {appointment.appointment?.observations && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">Observações</p>
                        <p className="font-medium bg-white p-3 rounded border">{appointment.appointment.observations}</p>
                      </div>
                    )}
                  </div>

                  {/* Informações do Profissional */}
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Informações do Profissional
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nome</p>
                        <p className="font-medium">{appointment.appointment?.professionalName || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Especialidade</p>
                        <p className="font-medium">Não informado</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Registro</p>
                        <p className="font-medium">Não informado</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">Não informado</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Cliente */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informações do Cliente
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nome</p>
                        <p className="font-medium">{appointment.client.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="font-medium">{appointment.client.phone || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{appointment.client.email || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">CPF</p>
                        <p className="font-medium">{(appointment.client as any).cpf || "Não informado"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Ações
                    </h3>
                    <div className="flex flex-wrap gap-3 justify-between">
                      {/* Botão Editar - Sempre primeiro */}
                      <Button
                        onClick={() => handleEdit(appointment.id)}
                        variant="outline"
                        className="border-gray-300 px-6 py-3 text-base font-medium hover:bg-gray-50"
                      >
                        <Pencil className="h-5 w-5 mr-2" />
                        Editar
                      </Button>

                      {/* Botões de ação baseados no status */}
                      {appointment.status === 'pendente' && (
                        <>
                          <Button
                            onClick={() => {
                              updateAppointmentStatus(appointment.id, 'confirmado');
                              setShowAppointmentDetailsModal(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-medium"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Confirmar
                          </Button>
                          <Button
                            onClick={() => {
                              updateAppointmentStatus(appointment.id, 'cancelado');
                              setShowAppointmentDetailsModal(false);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-base font-medium"
                          >
                            <XCircle className="h-5 w-5 mr-2" />
                            Cancelar
                          </Button>
                        </>
                      )}

                      {appointment.status === 'confirmado' && (
                        <>
                          <Button
                            onClick={() => {
                              updateAppointmentStatus(appointment.id, 'concluido');
                              setShowAppointmentDetailsModal(false);
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-base font-medium"
                          >
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Concluir
                          </Button>
                          <Button
                            onClick={() => {
                              updateAppointmentStatus(appointment.id, 'nao_compareceu');
                              setShowAppointmentDetailsModal(false);
                            }}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 text-base font-medium"
                          >
                            <XCircle className="h-5 w-5 mr-2" />
                            Não Compareceu
                          </Button>
                        </>
                      )}

                      {appointment.status === 'concluido' && (
                        <Button
                          onClick={() => {
                            router.push(`/dashboard/agenda?convert=${appointment.id}`);
                            setShowAppointmentDetailsModal(false);
                          }}
                          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 text-base font-medium"
                        >
                          <FileText className="h-5 w-5 mr-2" />
                          Converter para Serviço
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
