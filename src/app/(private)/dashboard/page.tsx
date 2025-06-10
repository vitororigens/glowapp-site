"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { currencyMask } from "@/utils/maks/masks";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";

interface Service {
  id: string;
  name: string;
  date: string;
  price: string | number;
  budget: boolean;
  sendToFinance: boolean;
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
    sendToFinance: boolean;
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
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    totalPending: 0,
    recentServices: [],
  });

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
      
    const totalPending = services
      .filter(service => !service.budget)
      .reduce((acc, service) => {
        const servicePrice = typeof service.price === 'number' 
          ? service.price 
          : Number(String(service.price).replace(/[^\d,-]/g, "").replace(",", "."));
        
        const paidAmount = service.payments 
          ? service.payments.reduce((sum, payment) => {
              const paymentValue = typeof payment.value === 'number' 
                ? payment.value 
                : Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", "."));
              return sum + paymentValue;
            }, 0)
          : 0;
        
        return acc + (servicePrice - paidAmount);
      }, 0);

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
        sendToFinance: service.sendToFinance,
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

      <div className="w-full flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10 w-full max-w-5xl">
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
        </div>
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
                  <th className="text-left py-2">Valor Total</th>
                  <th className="text-left py-2">Valor Pago</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Formas de Pagamento</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentServices.map((service) => {
                  const servicePrice = typeof service.price === 'number' 
                    ? service.price 
                    : Number(String(service.price).replace(/[^\d,-]/g, "").replace(",", "."));
                    
                  const paidAmount = service.payments 
                    ? service.payments.reduce((sum, p) => {
                        const value = typeof p.value === 'number' 
                          ? p.value 
                          : Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", "."));
                        return sum + value;
                      }, 0)
                    : 0;
                    
                  const pendingAmount = servicePrice - paidAmount;
                    
                  return (
                    <tr key={service.id} className="border-b">
                      <td className="py-2">{service.name}</td>
                      <td className="py-2">{service.date}</td>
                      <td className="py-2">{currencyMask(servicePrice.toString())}</td>
                      <td className="py-2 text-green-600">{currencyMask(paidAmount.toString())}</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${service.budget ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                          {service.budget ? "Orçamento" : "Serviço"}
                        </span>
                      </td>
                      <td className="py-2">
                        {service.payments && service.payments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {service.payments.map((payment, idx) => {
                              const valorTotal = typeof service.price === 'number' ? service.price : Number(String(service.price).replace(/[^\d,-]/g, "").replace(",", "."));
                              const mostrarValor = (service.payments && service.payments.length > 1) || Number(payment.value) !== valorTotal;
                              return (
                                <span
                                  key={idx}
                                  className={`px-2 py-1 rounded-full text-xs ${
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
                                    : `Cartão${payment.installments ? ` ${payment.installments}x` : ""}`}
                                  {mostrarValor ? ` ${currencyMask(String(payment.value))}` : ""}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500">Sem pagamentos</span>
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