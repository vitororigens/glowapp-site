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
import { formatDateToBrazilian } from "@/utils/formater/date";
import { useAuthContext } from "@/context/AuthContext";
import { updateDoc } from "firebase/firestore";

interface Transaction {
  id: string;
  name: string;
  date: string;
  value: string | number;
  type: string;
  category: string;
  description: string;
  collection: "Revenue" | "Expense";
  uid?: string;
}

interface Service {
  id: string;
  name: string;
  date: string;
  price: string;
  budget: boolean;
  sendToFinance: boolean;
  uid?: string;
  payments?: Array<{
    method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
    value: string | number;
    date: string;
    installments?: number;
  }>;
}

export default function Financeiro() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: revenues, loading: revenuesLoading } = useFirestoreCollection<Transaction>("Revenue");
  const { data: expenses, loading: expensesLoading } = useFirestoreCollection<Transaction>("Expense");
  const { data: services, loading: servicesLoading } = useFirestoreCollection<Service>("Services");

  // Debug: logs para verificar dados recebidos
  console.log("=== DEBUG FINANCEIRO ===");
  console.log("Usuário atual:", user);
  console.log("UID do usuário:", user?.uid);
  console.log("Receitas carregadas:", revenues);
  console.log("Despesas carregadas:", expenses);
  console.log("Serviços carregados:", services);
  
  // Verificar se há dados sem UID ou com UID incorreto
  if (revenues) {
    const revenuesWithoutUid = revenues.filter(rev => !rev.uid || rev.uid !== user?.uid);
    if (revenuesWithoutUid.length > 0) {
      console.error("Receitas sem UID ou com UID incorreto:", revenuesWithoutUid);
    }
  }
  
  if (expenses) {
    const expensesWithoutUid = expenses.filter(exp => !exp.uid || exp.uid !== user?.uid);
    if (expensesWithoutUid.length > 0) {
      console.error("Despesas sem UID ou com UID incorreto:", expensesWithoutUid);
    }
  }
  
  if (services) {
    const servicesWithoutUid = services.filter(service => !service.uid || service.uid !== user?.uid);
    if (servicesWithoutUid.length > 0) {
      console.error("Serviços sem UID ou com UID incorreto:", servicesWithoutUid);
    }
  }
  
  console.log("========================");

  // Função para corrigir dados antigos que podem não ter UID
  const fixMissingUid = async (data: any[], collectionName: string) => {
    if (!user?.uid) return;
    
    const itemsWithoutUid = data.filter(item => !item.uid);
    if (itemsWithoutUid.length > 0) {
      console.log(`Corrigindo ${itemsWithoutUid.length} itens sem UID na coleção ${collectionName}`);
      
      for (const item of itemsWithoutUid) {
        try {
          await updateDoc(doc(database, collectionName, item.id), { uid: user.uid });
          console.log(`UID adicionado ao item ${item.id} na coleção ${collectionName}`);
        } catch (error) {
          console.error(`Erro ao corrigir UID do item ${item.id}:`, error);
        }
      }
    }
  };

  // Corrigir dados antigos quando os dados forem carregados
  if (revenues && user?.uid) {
    fixMissingUid(revenues, "Revenue");
  }
  if (expenses && user?.uid) {
    fixMissingUid(expenses, "Expense");
  }
  if (services && user?.uid) {
    fixMissingUid(services, "Services");
  }

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
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
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
      .filter(service => !service.budget && service.sendToFinance)
      .map(service => {
        const paidValue = service.payments 
          ? service.payments
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
      .filter(service => !service.budget && service.sendToFinance)
      .map(service => ({ 
        value: service.payments 
          ? service.payments
              .reduce((sum, payment) => sum + Number(String(payment.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
          : 0 
      }))
  ].reduce((acc, curr) => {
    const value = typeof curr.value === 'number' ? curr.value : parseFloat(String(curr.value).replace(/[^\d,-]/g, "").replace(",", "."));
    return acc + value;
  }, 0);

  const totalPending = 0;

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

      <div className="w-full flex flex-col items-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10 w-full max-w-5xl">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-500">Receitas</h3>
            <p className="text-2xl font-bold text-green-600">{new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(totalRevenue)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-500">Despesas</h3>
            <p className="text-2xl font-bold text-red-600">{new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(totalExpense)}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-gray-500">Saldo</h3>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(balance)}</p>
          </Card>
        </div>
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
                <TableHead>Valor Total</TableHead>
                <TableHead>Valor Pago</TableHead>
                <TableHead>Formas de Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions.filter(t => t.collection === "Revenue").slice(0, 10).map((transaction) => (
                <TableRow key={`${transaction.collection}-${transaction.id}`}>
                  <TableCell>{transaction.name}</TableCell>
                  <TableCell>{formatDateToBrazilian(transaction.date)}</TableCell>
                  <TableCell>
                    {transaction.type === "Serviço" ? 
                      formatPrice(Number((transaction as any).originalPrice) * 100) 
                      : formatPrice(Number(transaction.value) * 100)}
                  </TableCell>
                  <TableCell className="text-green-600">{formatPrice(Number(transaction.value) * 100)}</TableCell>
                  <TableCell>
                    {transaction.type === "Serviço" && (transaction as any).payments && (transaction as any).payments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {(transaction as any).payments.map((payment: any, idx: number) => {
                          const pagamentos = (transaction as any).payments;
                          const valorTotal = Number(String((transaction as any).originalPrice).replace(/[^\d,-]/g, "").replace(",", "."));
                          const mostrarValor = pagamentos.length > 1 || Number(payment.value) !== valorTotal;
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
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(transaction)}
                      >
                        Editar
                      </Button>
                      {transaction.type !== "Serviço" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(transaction.id, transaction.collection)}
                        >
                          Excluir
                        </Button>
                      )}
                    </div>
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
                  <TableCell>{formatDateToBrazilian(transaction.date)}</TableCell>
                  <TableCell className="text-red-600">{formatPrice(Number(transaction.value) * 100, true)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(transaction)}>Editar</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(transaction.id, transaction.collection)}>Excluir</Button>
                    </div>
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
