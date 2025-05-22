"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { database } from "@/services/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuthContext } from "@/context/AuthContext";
import { currencyMask } from "@/utils/maks/masks";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";

interface Service {
  id: string;
  name: string;
  date: string;
  price: string | number;
  budget: boolean;
  payments?: Array<{
    method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
    value: string | number;
    date: string;
    installments?: number;
    status: 'pendente' | 'pago';
  }>;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface DashboardData {
  totalClients: number;
  totalServices: number;
  totalRevenue: number;
  totalPending: number;
  recentServices: Array<{
    id: string;
    name: string;
    date: string;
    price: string | number;
    budget: boolean;
    payments?: Array<{
      method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
      value: string | number;
      date: string;
      installments?: number;
      status: 'pendente' | 'pago';
    }>;
  }>;
}

export default function DashboardHome() {
  const { data: services, loading: servicesLoading, error: servicesError } = useFirestoreCollection<Service>("Services");
  const { data: clients, loading: clientsLoading, error: clientsError } = useFirestoreCollection<Contact>("Contacts");
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    totalPending: 0,
    recentServices: [],
  });

  useEffect(() => {
    if (!services || !clients) return;

    // Calcula totais
    const totalServices = services.filter(service => !service.budget).length;
    const totalClients = clients.length;
    
    // Calcula o faturamento total apenas dos serviços (não orçamentos)
    // Apenas considera valores com status "pago"
    const totalRevenue = services
      .filter(service => !service.budget)
      .reduce((acc, service) => {
        // Verifica se tem pagamentos
        if (service.payments && service.payments.length > 0) {
          // Soma apenas pagamentos com status "pago"
          return acc + service.payments
            .filter(payment => payment.status === 'pago')
            .reduce((sum, payment) => {
              const paymentValue = typeof payment.value === 'number' 
                ? payment.value 
                : Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", "."));
              return sum + paymentValue;
            }, 0);
        } else {
          // Se não tiver pagamentos, não considera no total
          return acc;
        }
      }, 0);
      
    // Calcula valores pendentes
    const totalPending = services
      .filter(service => !service.budget)
      .reduce((acc, service) => {
        // Verifica se tem pagamentos
        if (service.payments && service.payments.length > 0) {
          // Soma apenas pagamentos com status "pendente"
          return acc + service.payments
            .filter(payment => payment.status === 'pendente')
            .reduce((sum, payment) => {
              const paymentValue = typeof payment.value === 'number' 
                ? payment.value 
                : Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", "."));
              return sum + paymentValue;
            }, 0);
        } else {
          // Se não tiver pagamentos, não considera no total
          return acc;
        }
      }, 0);

    // Ordena serviços por data (mais recentes primeiro)
    const recentServices = [...services]
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(service => ({
        id: service.id,
        name: service.name,
        date: service.date,
        price: service.price,
        budget: service.budget,
        payments: service.payments
      }));

    setDashboardData({
      totalClients,
      totalServices,
      totalRevenue,
      totalPending,
      recentServices,
    });
  }, [services, clients]);

  if (servicesLoading || clientsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (servicesError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p>Erro ao carregar serviços. Por favor, tente novamente mais tarde.</p>
          <p className="text-sm mt-2">Detalhes: {servicesError.message}</p>
        </div>
      </div>
    );
  }

  if (clientsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center text-red-500">
          <p>Erro ao carregar clientes. Por favor, tente novamente mais tarde.</p>
          <p className="text-sm mt-2">Detalhes: {clientsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboardData.totalClients}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total de Serviços Realizados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboardData.totalServices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valores Recebidos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {currencyMask(dashboardData.totalRevenue.toString())}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Valores a Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-500">
              {currencyMask(dashboardData.totalPending.toString())}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Serviços Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Cliente</th>
                  <th className="text-left py-2">Data</th>
                  <th className="text-left py-2">Valor Pago</th>
                  <th className="text-left py-2">Valor Pendente</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentServices.map((service) => {
                  // Calcular valor pago e pendente
                  const paidAmount = service.payments 
                    ? service.payments
                        .filter(p => p.status === 'pago')
                        .reduce((sum, p) => {
                          const value = typeof p.value === 'number' 
                            ? p.value 
                            : Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", "."));
                          return sum + value;
                        }, 0)
                    : 0;
                    
                  const pendingAmount = service.payments 
                    ? service.payments
                        .filter(p => p.status === 'pendente')
                        .reduce((sum, p) => {
                          const value = typeof p.value === 'number' 
                            ? p.value 
                            : Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", "."));
                          return sum + value;
                        }, 0)
                    : 0;
                    
                  return (
                    <tr key={service.id} className="border-b">
                      <td className="py-2">{service.name}</td>
                      <td className="py-2">{service.date}</td>
                      <td className="py-2 text-green-600">
                        {paidAmount > 0 ? currencyMask(paidAmount.toString()) : "-"}
                      </td>
                      <td className="py-2 text-orange-500">
                        {pendingAmount > 0 ? currencyMask(pendingAmount.toString()) : "-"}
                      </td>
                      <td className="py-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            service.budget
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {service.budget ? "Orçamento" : "Serviço"}
                        </span>
                      </td>
                      <td className="py-2">
                        {service.budget ? (
                          "-"
                        ) : service.payments && service.payments.length > 0 ? (
                          <div className="space-y-1">
                            {service.payments.filter(p => p.status === 'pago').length > 0 && (
                              <div>
                                <span className="text-xs text-green-600 font-medium mr-1">Pago:</span>
                                {service.payments.filter(p => p.status === 'pago').map((payment, idx) => (
                                  <span
                                    key={idx}
                                    className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                      payment.method === "dinheiro"
                                        ? "bg-teal-100 text-teal-800"
                                        : payment.method === "pix"
                                        ? "bg-purple-100 text-purple-800"
                                        : payment.method === "boleto"
                                        ? "bg-blue-100 text-blue-800"
                                        : "bg-orange-100 text-orange-800"
                                    }`}
                                  >
                                    {payment.method === "dinheiro"
                                      ? "Dinheiro"
                                      : payment.method === "pix"
                                      ? "PIX"
                                      : payment.method === "boleto"
                                      ? "Boleto"
                                      : `Cartão ${payment.installments ? `${payment.installments}x` : ""}`}
                                  </span>
                                ))}
                              </div>
                            )}
                            {service.payments.filter(p => p.status === 'pendente').length > 0 && (
                              <div>
                                <span className="text-xs text-orange-500 font-medium mr-1">Pendente:</span>
                                {service.payments.filter(p => p.status === 'pendente').map((payment, idx) => (
                                  <span
                                    key={idx}
                                    className={`ml-1 px-2 py-1 rounded-full text-xs ${
                                      payment.method === "dinheiro"
                                        ? "bg-teal-50 text-teal-600"
                                        : payment.method === "pix"
                                        ? "bg-purple-50 text-purple-600"
                                        : payment.method === "boleto"
                                        ? "bg-blue-50 text-blue-600"
                                        : "bg-orange-50 text-orange-600"
                                    }`}
                                  >
                                    {payment.method === "dinheiro"
                                      ? "Dinheiro"
                                      : payment.method === "pix"
                                      ? "PIX"
                                      : payment.method === "boleto"
                                      ? "Boleto"
                                      : `Cartão ${payment.installments ? `${payment.installments}x` : ""}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}