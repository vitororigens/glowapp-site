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
import { formatDateToBrazilian } from "@/utils/formater/date";
import { formatCurrencyFromCents } from "@/utils/maks/masks";

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
        totalServices: 0, 
        totalBudgets: 0 
      };
    }

    // Debug: log dos serviços para verificar duplicação
    console.log('Serviços carregados:', services);
    console.log('Total de serviços no array:', services.length);

    // Contar serviços e orçamentos separadamente
    const totalServices = services.filter(s => !s.budget).length;
    const totalBudgets = services.filter(s => s.budget).length;

    console.log('Serviços (não orçamentos):', totalServices);
    console.log('Orçamentos:', totalBudgets);

    // Calcular total pago apenas
    const totalPaid = services
      .filter(service => !service.budget && service.payments && service.payments.length > 0)
      .reduce((acc, service) => {
        const paidAmount = service.payments
          ?.reduce((sum, p) => {
            const value = typeof p.value === 'number' 
              ? p.value 
              : Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", "."));
            // Os valores já estão em centavos, mantemos como estão
            return sum + value;
          }, 0) || 0;
        return acc + paidAmount;
      }, 0);

    return { totalPaid, totalServices, totalBudgets };
  };

  const { totalPaid, totalServices: servicesCount, totalBudgets } = calculateTotals();

  const formatPrice = (price: number | string) => {
    return formatCurrencyFromCents(price);
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
                <div className="text-2xl font-bold text-green-600">{formatCurrencyFromCents(totalPaid)}</div>
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
                        // Os valores já estão em centavos, mantemos como estão
                        return sum + value;
                      }, 0)
                    : 0;
                  const valorTotal = service.price;
                  console.log(valorTotal);
                  return (
                    <TableRow key={service.id}>
                      <TableCell>{service.name}</TableCell>
                      <TableCell>{formatDateToBrazilian(service.date)}</TableCell>
                      <TableCell>{service.time}</TableCell>
                      <TableCell>{formatCurrencyFromCents(valorTotal)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrencyFromCents(paidAmount)}</TableCell>
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
                            {service.payments
                              .filter((payment, idx, arr) => {
                                // Filtrar pagamentos duplicados ou com valor zero desnecessário
                                const paymentValue = typeof payment.value === 'number' 
                                  ? payment.value 
                                  : Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", "."));
                                
                                // Se o valor é zero, só mostrar se for o único pagamento
                                if (paymentValue === 0 && arr.length > 1) {
                                  return false;
                                }
                                
                                // Se há múltiplos pagamentos com o mesmo método e valor, mostrar apenas um
                                const isDuplicate = arr.slice(0, idx).some((prevPayment, prevIdx) => 
                                  prevPayment.method === payment.method && 
                                  prevPayment.installments === payment.installments &&
                                  (typeof prevPayment.value === 'number' ? prevPayment.value : Number(String(prevPayment.value).replace(/[^\d,-]/g, "").replace(",", "."))) === paymentValue
                                );
                                
                                return !isDuplicate;
                              })
                              .map((payment, idx) => {
                                // Debug: log dos pagamentos filtrados
                                console.log(`Pagamento filtrado ${idx}:`, payment);
                                
                                const paymentValue = typeof payment.value === 'number' 
                                  ? payment.value 
                                  : Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", "."));
                                
                                const mostrarValor = service.payments && (service.payments.length > 1 || paymentValue !== valorTotal);
                                
                                return (
                                  <span
                                    key={`${payment.method}-${paymentValue}-${idx}`}
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
                                    {mostrarValor ? ` ${formatCurrencyFromCents(Number(payment.value))}` : ""}
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