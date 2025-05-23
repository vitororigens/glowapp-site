"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import { currencyMask } from "@/utils/maks/masks";
import { database } from "@/services/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { toast } from "react-toastify";

interface Transaction {
  id: string;
  name: string;
  date: string;
  value: string | number;
  type: string;
  category: string;
  description: string;
  collection: "Revenue" | "Expense";
}

interface Service {
  id: string;
  name: string;
  date: string;
  price: string;
  budget: boolean;
  payments?: Array<{
    method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
    value: string | number;
    date: string;
    installments?: number;
    status: 'pendente' | 'pago';
  }>;
}

export default function Financeiro() {
  const router = useRouter();
  const { data: revenues, loading: revenuesLoading } = useFirestoreCollection<Transaction>("Revenue");
  const { data: expenses, loading: expensesLoading } = useFirestoreCollection<Transaction>("Expense");
  const { data: services, loading: servicesLoading } = useFirestoreCollection<Service>("Services");

  const handleDelete = async (id: string, collection: "Revenue" | "Expense") => {
    if (window.confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        await deleteDoc(doc(database, collection, id));
        toast.success("Registro excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir registro:", error);
        toast.error("Erro ao excluir registro!");
      }
    }
  };

  function handleEdit(item: { id: string, type: string, collection?: "Revenue" | "Expense" }) {
    if (item.type === "Serviço") {
      router.push(`/dashboard/servicos/novo?id=${item.id}`);
    } else {
      const typeMapped = item.collection === "Revenue" ? "revenue" : "expense";
      router.push(`/dashboard/financeiro/novo?id=${item.id}&type=${typeMapped}`);
    }
  }

  const formatPrice = (price: string | number | undefined, isExpense: boolean = false) => {
    if (!price) return "R$ 0,00";
    const formattedValue = currencyMask(String(price));
    return isExpense ? `- ${formattedValue}` : formattedValue;
  };

  if (revenuesLoading || expensesLoading || servicesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados...</p>
        </div>
      </div>
    );
  }

  const allTransactions = [
    ...(revenues || []).map(rev => ({ ...rev, collection: "Revenue" as const, type: "Receita" })),
    ...(expenses || []).map(exp => ({ ...exp, collection: "Expense" as const, type: "Despesa" })),
    ...(services || [])
      .filter(service => !service.budget)
      .map(service => {
        const paidValue = service.payments 
          ? service.payments
              .filter(p => p.status === 'pago')
              .reduce((sum, p) => sum + Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
          : 0;
        
        return {
          id: service.id,
          name: service.name,
          date: service.date,
          value: paidValue, 
          type: "Serviço",
          category: "Serviços",
          description: "Serviço realizado",
          collection: "Revenue" as const,
          payments: service.payments,
          originalPrice: service.price 
        };
      })
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalRevenue = [
    ...(revenues || []),
    ...(services || [])
      .filter(service => !service.budget)
      .map(service => ({ 
        value: service.payments 
          ? service.payments
              .filter(payment => payment.status === 'pago')
              .reduce((sum, payment) => sum + Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
          : 0 
      }))
  ].reduce((acc, curr) => {
    const value = typeof curr.value === 'number' ? curr.value : parseFloat(String(curr.value).replace(/[^\d,-]/g, "").replace(",", "."));
    return acc + value;
  }, 0);

  const totalPending = (services || [])
    .filter(service => !service.budget)
    .reduce((acc, service) => {
      const pendingAmount = service.payments 
        ? service.payments
            .filter(payment => payment.status === 'pendente')
            .reduce((sum, payment) => sum + Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
        : 0;
      return acc + pendingAmount;
    }, 0);

  const totalExpense = (expenses || []).reduce((acc, curr) => {
    const value = parseFloat(String(curr.value).replace(/[^\d,-]/g, "").replace(",", "."));
    return acc + value;
  }, 0);

  const balance = totalRevenue - totalExpense;

  // Função para resetar valores no dia 1 de cada mês
  const resetMonthlyValues = () => {
    const today = new Date();
    if (today.getDate() === 1) {
      // Lógica para resetar valores
      // Isso pode envolver limpar ou arquivar dados antigos
    }
  };

  // Chamar a função de reset ao carregar o componente
  resetMonthlyValues();

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <Button onClick={() => router.push("/dashboard/financeiro/novo")}>
          Novo Registro
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Receitas (valores pagos)</h3>
          <p className="text-2xl font-bold text-green-600">{currencyMask(totalRevenue.toString())}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Valores Pendentes</h3>
          <p className="text-2xl font-bold text-orange-500">{currencyMask(totalPending.toString())}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Despesas</h3>
          <p className="text-2xl font-bold text-red-600">{currencyMask(totalExpense.toString())}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Saldo</h3>
          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {currencyMask(balance.toString())}
          </p>
        </Card>
      </div>

      {/* Box de Receitas */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Receitas</h2>
          <Button onClick={() => router.push("/dashboard/financeiro/historico?tipo=receita")}>Ver Histórico Completo</Button>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Valor Pendente</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.filter(t => t.collection === "Revenue").slice(0, 10).map((transaction) => (
                <TableRow key={`${transaction.collection}-${transaction.id}`}>
                  <TableCell>{transaction.name}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell className="text-green-600">{formatPrice(transaction.value)}</TableCell>
                  <TableCell className="text-orange-500">
                    {transaction.type === "Serviço" ? 
                      formatPrice(
                        (transaction as any).payments 
                          ? (transaction as any).payments
                              .filter((p: any) => p.status === 'pendente')
                              .reduce((sum: number, p: any) => sum + Number(String(p.value).replace(/[^-\d]/g, "").replace(",", ".")), 0)
                          : 0
                      ) 
                      : "-"
                    }
                  </TableCell>
                  <TableCell>
                    {transaction.type === "Serviço" && (transaction as any).payments && (transaction as any).payments.length > 0 ? (
                      <div className="space-y-1">
                        {(transaction as any).payments
                          .filter((p: any) => p.status === 'pago')
                          .map((payment: any, idx: number) => (
                            <div key={idx} className="mb-1">
                              <span
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
                                  : `Cartão ${payment.installments ? `${payment.installments}x` : ""}`}
                                &nbsp;({currencyMask(String(payment.value))})
                              </span>
                            </div>
                          ))}
                        {(transaction as any).payments.filter((p: any) => p.status === 'pendente').length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-orange-500 font-medium">
                              Pendente: {(transaction as any).payments.filter((p: any) => p.status === 'pendente').length} pagamento(s)
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)}>Editar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Box de Despesas */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Despesas</h2>
          <Button onClick={() => router.push("/dashboard/financeiro/historico?tipo=despesa")}>Ver Histórico Completo</Button>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.filter(t => t.collection === "Expense").slice(0, 10).map((transaction) => (
                <TableRow key={`${transaction.collection}-${transaction.id}`}>
                  <TableCell>{transaction.name}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell className="text-red-600">{formatPrice(transaction.value, true)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(transaction.id, transaction.collection)}>Excluir</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
