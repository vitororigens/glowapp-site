"use client";

import { Button } from "@/components/ui/button";
import { database } from "@/services/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";

interface Service {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  price: number;
  priority: string;
  duration: string;
  observations: string;
  services: Array<{
    id: string;
    code: string;
    name: string;
    price: string;
    date: string;
  }>;
  professionals: Array<{
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
}

export default function Services() {
  const { data: services, loading } = useFirestoreCollection<Service>("Services");
  const router = useRouter();

  const calculateTotals = () => {
    if (!services || services.length === 0) {
      return { 
        totalPaid: 0, 
        totalPending: 0, 
        totalServices: 0, 
        totalBudgets: 0 
      };
    }

    const totalServices = services.filter(s => !s.budget).length;
    const totalBudgets = services.filter(s => s.budget).length;

    const { totalPaid, totalPending } = services.reduce((acc, service) => {
      if (service.budget) return acc;

      if (service.payments && service.payments.length > 0) {
        const paidAmount = service.payments
          .filter(p => p.status === 'pago')
          .reduce((sum, p) => {
            const value = typeof p.value === 'number' 
              ? p.value 
              : Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", "."));
            return sum + value;
          }, 0);

        const pendingAmount = service.payments
          .filter(p => p.status === 'pendente')
          .reduce((sum, p) => {
            const value = typeof p.value === 'number' 
              ? p.value 
              : Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", "."));
            return sum + value;
          }, 0);

        return {
          totalPaid: acc.totalPaid + paidAmount,
          totalPending: acc.totalPending + pendingAmount
        };
      }

      return acc;
    }, { totalPaid: 0, totalPending: 0 });

    return { totalPaid, totalPending, totalServices, totalBudgets };
  };

  const { totalPaid, totalPending, totalServices: servicesCount, totalBudgets } = calculateTotals();

  const formatPrice = (price: number | string) => {
    if (typeof price === 'string') {
      price = Number(price.replace(/\D/g, ''));
    }
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price / 100);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        await deleteDoc(doc(database, "Services", id));
        toast.success("Serviço excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir serviço:", error);
        toast.error("Erro ao excluir serviço!");
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/servicos/novo?id=${id}`);
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <Button onClick={() => router.push("/dashboard/servicos/novo")}>
          Novo Serviço
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Carregando...</div>
      ) : !services || services.length === 0 ? (
        <div className="text-center py-4">Nenhum serviço cadastrado.</div>
      ) : (
        <>
          <div className="w-full flex flex-col items-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10 w-full max-w-5xl">
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500 mb-1">Total de Serviços</div>
                <div className="text-2xl font-bold text-blue-600">{servicesCount}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500 mb-1">Total de Orçamentos</div>
                <div className="text-2xl font-bold text-yellow-600">{totalBudgets}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow border">
                <div className="text-sm text-gray-500 mb-1">Valores Recebidos</div>
                <div className="text-2xl font-bold text-green-600">{formatPrice(totalPaid)}</div>
              </div>
            </div>
          </div>
        
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Formas de Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service: Service) => {
                  const paidAmount = service.payments 
                    ? service.payments.reduce((sum, p) => {
                        const value = typeof p.value === 'number' 
                          ? p.value 
                          : Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", "."));
                        return sum + value;
                      }, 0)
                    : 0;
                  const valorTotal = typeof service.price === 'number' ? service.price : Number(String(service.price).replace(/[^\d,-]/g, "").replace(",", "."));
                  return (
                    <TableRow key={service.id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{service.date}</TableCell>
                      <TableCell>{service.time}</TableCell>
                      <TableCell>{formatPrice(valorTotal)}</TableCell>
                      <TableCell className="text-green-600">{formatPrice(paidAmount)}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            service.budget
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {service.budget ? "Orçamento" : "Serviço"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {service.payments && service.payments.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {service.payments.map((payment, idx) => {
                              const mostrarValor = service.payments && (service.payments.length > 1 || Number(payment.value) !== valorTotal);
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
                                  {mostrarValor ? ` ${formatPrice(payment.value)}` : ""}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-500">Sem pagamentos</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(service.id)}>
                            Editar
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(service.id)}>
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}