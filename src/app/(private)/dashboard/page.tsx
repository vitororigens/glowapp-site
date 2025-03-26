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
  price: string;
  budget: boolean;
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
  recentServices: Array<{
    id: string;
    name: string;
    date: string;
    price: string;
    budget: boolean;
  }>;
}

export default function DashboardHome() {
  const { data: services, loading: servicesLoading, error: servicesError } = useFirestoreCollection<Service>("Services");
  const { data: clients, loading: clientsLoading, error: clientsError } = useFirestoreCollection<Contact>("Contacts");
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    recentServices: [],
  });

  useEffect(() => {
    if (!services || !clients) return;

    // Calcula totais
    const totalServices = services.length;
    const totalClients = clients.length;
    const totalRevenue = services.reduce((acc, service) => {
      const price = parseFloat(service.price.replace(/[^\d,-]/g, "").replace(",", "."));
      return acc + price;
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
        budget: service.budget
      }));

    setDashboardData({
      totalClients,
      totalServices,
      totalRevenue,
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
            <CardTitle>Total de Serviços</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{dashboardData.totalServices}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {currencyMask(dashboardData.totalRevenue.toString())}
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
                  <th className="text-left py-2">Valor</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentServices.map((service) => (
                  <tr key={service.id} className="border-b">
                    <td className="py-2">{service.name}</td>
                    <td className="py-2">{service.date}</td>
                    <td className="py-2">{currencyMask(service.price)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.budget 
                          ? "bg-yellow-100 text-yellow-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {service.budget ? "Orçamento" : "Serviço"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}