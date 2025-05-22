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
      // Quando for serviço, redireciona para a página de edição de serviços
      router.push(`/dashboard/servicos/novo?id=${item.id}`);
    } else {
      // Para outros registros (receitas e despesas)
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

  // Combina receitas e despesas em uma única lista
  const allTransactions = [
    ...(revenues || []).map(rev => ({ ...rev, collection: "Revenue" as const, type: "Receita" })),
    ...(expenses || []).map(exp => ({ ...exp, collection: "Expense" as const, type: "Despesa" })),
    // Adiciona serviços não-orçamentos como receitas
    ...(services || [])
      .filter(service => !service.budget)
      .map(service => {
        // Calcula o valor pago
        const paidValue = service.payments 
          ? service.payments
              .filter(p => p.status === 'pago')
              .reduce((sum, p) => sum + Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
          : 0;
        
        return {
          id: service.id,
          name: service.name,
          date: service.date,
          value: paidValue, // Agora value é apenas o valor pago
          type: "Serviço",
          category: "Serviços",
          description: "Serviço realizado",
          collection: "Revenue" as const,
          payments: service.payments,
          originalPrice: service.price // Mantemos o preço original para referência
        };
      })
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calcula totais
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

  // Calcula total pendente
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

      {allTransactions.length === 0 ? (
        <div className="text-center py-4">Nenhum registro encontrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Valor Pendente</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.map((transaction) => (
                <TableRow key={`${transaction.collection}-${transaction.id}`}>
                  <TableCell>{transaction.name}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className={transaction.collection === "Expense" ? "text-red-600" : "text-green-600"}>
                    {transaction.type === "Serviço" ? 
                      formatPrice(
                        (transaction as any).payments 
                          ? (transaction as any).payments
                              .filter((p: any) => p.status === 'pago')
                              .reduce((sum: number, p: any) => sum + Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
                          : 0, 
                        transaction.collection === "Expense"
                      ) 
                      : formatPrice(transaction.value, transaction.collection === "Expense")
                    }
                  </TableCell>
                  <TableCell className="text-orange-500">
                    {transaction.type === "Serviço" ? 
                      formatPrice(
                        (transaction as any).payments 
                          ? (transaction as any).payments
                              .filter((p: any) => p.status === 'pendente')
                              .reduce((sum: number, p: any) => sum + Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
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
                    {transaction.type !== "Serviço" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleEdit(transaction)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(transaction.id, transaction.collection)}
                        >
                          Excluir
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                      >
                        Editar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
