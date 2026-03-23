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
import { currencyMask, formatCurrencyFromCents, normalizeValueToCents } from "@/utils/maks/masks";
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
  payments?: Array<{
    method: 'dinheiro' | 'pix' | 'cartao' | 'boleto';
    value: string | number;
    date: string;
    installments?: number;
    parcelas?: number;
  }>;
  originalPrice?: string | number;
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
    parcelas?: number;
  }>;
  pendingValue?: number;
  originalPrice?: string | number;
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
  const fixMissingUid = async (data: (Transaction | Service)[], collectionName: string) => {
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
    if (price === undefined || price === null || price === '') return "R$ 0,00";
    const valueInCents = normalizeValueToCents(price);
    const formattedValue = formatCurrencyFromCents(valueInCents);
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
      .filter(service => {
        // Incluir todos os serviços que não são orçamentos
        const isService = !service.budget;
        console.log(`Serviço ${service.name}: budget=${service.budget}, sendToFinance=${service.sendToFinance}, isService=${isService}`);
        return isService;
      })
      .map(service => {
        const paidValue = service.payments 
          ? service.payments
              .reduce((sum, p) => sum + Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
          : 0;
        
        console.log(`Processando serviço ${service.name}: paidValue=${paidValue}, originalPrice=${service.price}`);
        
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

  // Calcular total de receitas usando normalizeValueToCents
  const totalRevenue = [
    ...(revenues || []),
    ...(services || [])
      .filter(service => !service.budget)
      .map(service => ({ 
        value: service.payments 
          ? service.payments
              .reduce((sum, payment) => sum + normalizeValueToCents(payment.value), 0)
          : 0 
      }))
  ].reduce((acc, curr) => {
    const valueInCents = normalizeValueToCents(curr.value);
    return acc + valueInCents;
  }, 0);

  const totalPending = 0;

  // Calcular total de despesas usando normalizeValueToCents
  const totalExpense = (expenses || []).reduce((acc, curr) => {
    const valueInCents = normalizeValueToCents(curr.value);
    return acc + valueInCents;
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
    <div className="max-w-full mx-auto p-3 md:p-4 bg-white shadow-md rounded-lg overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-xl md:text-2xl font-bold">Financeiro</h1>
        <Button onClick={() => router.push("/dashboard/financeiro/novo")}>
          Novo Registro
        </Button>
      </div>

      <div className="w-full flex flex-col items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 w-full">
          <Card className="p-4 md:p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">💰</span>
              </div>
              <h3 className="text-sm font-bold text-green-700">Receitas</h3>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-green-600">{formatCurrencyFromCents(totalRevenue)}</p>
          </Card>
          <Card className="p-4 md:p-6 bg-gradient-to-br from-red-50 to-rose-100 border-red-200 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xl">💸</span>
              </div>
              <h3 className="text-sm font-bold text-red-700">Despesas</h3>
            </div>
            <p className="text-2xl md:text-3xl font-bold text-red-600">{formatCurrencyFromCents(totalExpense)}</p>
          </Card>
          <Card className={`p-4 md:p-6 shadow-lg ${balance >= 0 ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200' : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'}`}>
                <span className="text-white text-xl">{balance >= 0 ? '📈' : '📉'}</span>
              </div>
              <h3 className={`text-sm font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>Saldo</h3>
            </div>
            <p className={`text-2xl md:text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrencyFromCents(balance)}</p>
          </Card>
        </div>
      </div>

      {/* Box de Receitas */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 md:p-6 rounded-lg mb-6 border border-green-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-lg md:text-xl font-bold text-green-800 flex items-center gap-2">
            💰 Receitas
          </h2>
          <Button 
            onClick={() => router.push("/dashboard/financeiro/historico?tipo=receita")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Ver Histórico Completo
          </Button>
        </div>
        <div className="mb-4 text-sm text-green-700 bg-green-100 p-3 rounded-lg">
          <strong>📅 Ordenado por data:</strong> Receitas mais recentes aparecem primeiro
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto -mx-4 md:mx-0">
          <div className="min-w-[700px] md:min-w-0 px-4 md:px-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-50">
                <TableHead className="font-semibold text-green-800">👤 Nome</TableHead>
                <TableHead className="font-semibold text-green-800">📅 Data</TableHead>
                <TableHead className="font-semibold text-green-800">💵 Valor Total</TableHead>
                <TableHead className="font-semibold text-green-800">💰 Valor Pago</TableHead>
                <TableHead className="font-semibold text-green-800">⏳ Valor Pendente</TableHead>
                <TableHead className="font-semibold text-green-800">💳 Formas de Pagamento</TableHead>
                <TableHead className="text-right font-semibold text-green-800">⚙️ Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions
                .filter(t => t.collection === "Revenue")
                .slice(0, 10)
                .map((transaction) => (
                <TableRow 
                  key={`${transaction.collection}-${transaction.id}`}
                  className="hover:bg-green-50 transition-colors duration-200 border-b border-green-100"
                >
                  <TableCell className="font-medium">{transaction.name}</TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-800 text-sm">
                      {formatDateToBrazilian(transaction.date)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {transaction.type === "Serviço" ? 
                      formatPrice(Number(transaction.originalPrice)) 
                      : formatPrice(Number(transaction.value))}
                  </TableCell>
                  <TableCell className="text-green-600">{formatPrice(Number(transaction.value))}</TableCell>
                  <TableCell>
                    {transaction.type === "Serviço" ? (
                      (() => {
                        const originalPrice = Number(String(transaction.originalPrice).replace(/[^\d,-]/g, "").replace(",", "."));
                        const paidValue = Number(transaction.value);
                        const pendingValue = originalPrice - paidValue;
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-semibold ${
                            pendingValue > 0 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            ⏳ {formatPrice(pendingValue)}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.type === "Serviço" && transaction.payments && transaction.payments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {transaction.payments.map((payment, idx) => {
                          const pagamentos = transaction.payments!;
                          const valorTotal = Number(String(transaction.originalPrice).replace(/[^\d,-]/g, "").replace(",", "."));
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
                                : `Cartão${payment.parcelas || payment.installments ? ` ${payment.parcelas || payment.installments}x` : ""}`}
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
      </div>

      {/* Box de Despesas */}
      <div className="bg-gradient-to-r from-red-50 to-rose-50 p-4 md:p-6 rounded-lg border border-red-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
          <h2 className="text-lg md:text-xl font-bold text-red-800 flex items-center gap-2">
            💸 Despesas
          </h2>
          <Button 
            onClick={() => router.push("/dashboard/financeiro/historico?tipo=despesa")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Ver Histórico Completo
          </Button>
        </div>
        <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded-lg">
          <strong>📅 Ordenado por data:</strong> Despesas mais recentes aparecem primeiro
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto -mx-4 md:mx-0">
          <div className="min-w-[400px] md:min-w-0 px-4 md:px-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-red-50">
                <TableHead className="font-semibold text-red-800">👤 Nome</TableHead>
                <TableHead className="font-semibold text-red-800">📅 Data</TableHead>
                <TableHead className="font-semibold text-red-800">💰 Valor</TableHead>
                <TableHead className="text-right font-semibold text-red-800">⚙️ Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTransactions
                .filter(t => t.collection === "Expense")
                .slice(0, 10)
                .map((transaction) => (
                <TableRow 
                  key={`${transaction.collection}-${transaction.id}`}
                  className="hover:bg-red-50 transition-colors duration-200 border-b border-red-100"
                >
                  <TableCell className="font-medium">{transaction.name}</TableCell>
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-800 text-sm">
                      {formatDateToBrazilian(transaction.date)}
                    </span>
                  </TableCell>
                  <TableCell className="text-red-600">{formatPrice(Number(transaction.value), true)}</TableCell>
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
    </div>
  );
}
