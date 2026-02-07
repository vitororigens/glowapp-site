"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useFirestoreCollection from '@/hooks/useFirestoreCollection';
import { Button } from '@/components/ui/button';
import { currencyMask, formatCurrencyFromCents } from '@/utils/maks/masks';
import { toast } from "react-toastify";;
import { deleteDoc, doc } from 'firebase/firestore';
import { database } from "@/services/firebase";
import { formatDateToBrazilian } from "@/utils/formater/date";

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
  price: string | number;
  payments?: { method: string; value: string | number; status: string }[];
  pendingValue?: number;
  originalPrice?: string | number;
}

export default function Historico() {
  const searchParams = useSearchParams();
  const tipo = searchParams.get('tipo');
  const { data: transactions, loading } = useFirestoreCollection<Transaction>(tipo === 'receita' ? 'Revenue' : 'Expense');
  const { data: services } = useFirestoreCollection<Service>("Services");
  const router = useRouter();

  if (loading) {
    return <p>Carregando...</p>;
  }

  const handleEdit = (transaction: Transaction) => {
    const typeMapped = transaction.collection === "Revenue" ? "revenue" : "expense";
    router.push(`/dashboard/financeiro/novo?id=${transaction.id}&type=${typeMapped}`);
  };

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

  const filteredTransactions = tipo === 'receita' ?
    [...(transactions || []),
    ...(services || []).map(service => {
      const paidValue = service.payments 
        ? service.payments
            .reduce((sum, p) => sum + Number(String(p.value).replace(/[^\d,-]/g, "").replace(",", ".")), 0)
        : 0;
      
      return {
        id: service.id,
        name: service.name,
        date: service.date,
        value: paidValue, // Valor pago
        type: "Serviço",
        category: "Serviços",
        description: "Serviço realizado",
        collection: "Revenue" as const,
        payments: service.payments,
        originalPrice: service.price, // Valor total
        pendingValue: service.payments?.filter((p: any) => p.status === 'pendente').reduce((sum: number, p: any) => sum + Number(p.value), 0) || 0
      };
    })] :
    transactions || [];

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {tipo === 'receita' ? '💰 Histórico de Receitas' : '💸 Histórico de Despesas'}
        </h1>
        <Button 
          onClick={() => router.push(`/dashboard/financeiro/novo?type=${tipo}`)}
          className={tipo === 'receita' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
        >
          Novo Registro
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-lg shadow-lg ${
          tipo === 'receita' 
            ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200' 
            : 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200'
        } border`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              tipo === 'receita' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <span className="text-white text-xl">{tipo === 'receita' ? '💰' : '💸'}</span>
            </div>
            <h3 className={`text-sm font-bold ${
              tipo === 'receita' ? 'text-green-700' : 'text-red-700'
            }`}>
              Total de {tipo === 'receita' ? 'Receitas' : 'Despesas'}
            </h3>
          </div>
          <p className={`text-2xl font-bold ${
            tipo === 'receita' ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrencyFromCents(
              filteredTransactions.reduce((sum, t) => sum + Number(t.value), 0)
            )}
          </p>
        </div>
        
        <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">📊</span>
            </div>
            <h3 className="text-sm font-bold text-blue-700">Total de Registros</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</p>
        </div>
        
        <div className="p-6 rounded-lg shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">📅</span>
            </div>
            <h3 className="text-sm font-bold text-purple-700">Última Atualização</h3>
          </div>
          <p className="text-sm font-bold text-purple-600">
            {filteredTransactions.length > 0 
              ? formatDateToBrazilian(filteredTransactions[0].date)
              : 'N/A'
            }
          </p>
        </div>
      </div>
      
      <div className={`p-6 rounded-lg mb-6 border ${
        tipo === 'receita' 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
          : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
      }`}>
        <div className="mb-4 text-sm bg-white p-3 rounded-lg border">
          <strong>📅 Ordenado por data:</strong> {tipo === 'receita' ? 'Receitas' : 'Despesas'} mais recentes aparecem primeiro
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className={tipo === 'receita' ? 'bg-green-50' : 'bg-red-50'}>
                <TableHead className={`font-semibold ${tipo === 'receita' ? 'text-green-800' : 'text-red-800'}`}>👤 Nome</TableHead>
                <TableHead className={`font-semibold ${tipo === 'receita' ? 'text-green-800' : 'text-red-800'}`}>📅 Data</TableHead>
                <TableHead className={`font-semibold ${tipo === 'receita' ? 'text-green-800' : 'text-red-800'}`}>💰 Valor</TableHead>
                <TableHead className={`font-semibold ${tipo === 'receita' ? 'text-green-800' : 'text-red-800'}`}>📂 Categoria</TableHead>
                <TableHead className={`font-semibold ${tipo === 'receita' ? 'text-green-800' : 'text-red-800'}`}>📝 Descrição</TableHead>
                {tipo === 'receita' && <TableHead className={`font-semibold ${tipo === 'receita' ? 'text-green-800' : 'text-red-800'}`}>💳 Pagamento</TableHead>}
                {tipo === 'receita' && <TableHead className={`font-semibold ${tipo === 'receita' ? 'text-green-800' : 'text-red-800'}`}>⏳ Valor Pendente</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((transaction) => (
                <TableRow 
                  key={transaction.id}
                  className={`hover:${tipo === 'receita' ? 'bg-green-50' : 'bg-red-50'} transition-colors duration-200 border-b ${tipo === 'receita' ? 'border-green-100' : 'border-red-100'}`}
                >
                  <TableCell className="font-medium">{transaction.name}</TableCell>
                  <TableCell className="font-medium">
                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm ${
                      tipo === 'receita' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {formatDateToBrazilian(transaction.date)}
                    </span>
                  </TableCell>
                  <TableCell className={tipo === 'receita' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    {formatCurrencyFromCents(Number(transaction.value))}
                  </TableCell>
                  <TableCell className="text-gray-600">{transaction.category}</TableCell>
                  <TableCell className="text-gray-600">{transaction.description}</TableCell>
                  {tipo === 'receita' && 'payments' in transaction && Array.isArray(transaction.payments) && (
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {transaction.payments.map((payment: any, idx: number) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              payment.method === "dinheiro"
                                ? "bg-teal-100 text-teal-800 border border-teal-200"
                                : payment.method === "pix"
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : payment.method === "boleto"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-orange-100 text-orange-800 border border-orange-200"
                            }`}
                          >
                            {payment.method === "dinheiro"
                              ? "💰 Dinheiro"
                              : payment.method === "pix"
                              ? "💜 PIX"
                              : payment.method === "boleto"
                              ? "📄 Boleto"
                              : `💳 Cartão ${(payment as any).parcelas || payment.installments ? `${(payment as any).parcelas || payment.installments}x` : ""}`}
                            <span className="ml-1 font-bold">
                              {formatCurrencyFromCents(Number(payment.value))}
                            </span>
                          </span>
                        ))}
                        {transaction.payments.filter((p: any) => p.status === 'pendente').length > 0 && (
                          <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 border border-orange-200 font-medium">
                            ⏳ {transaction.payments.filter((p: any) => p.status === 'pendente').length} pendente(s)
                          </span>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {tipo === 'receita' && 'pendingValue' in transaction && typeof transaction.pendingValue === 'number' && (
                    <TableCell>
                      {transaction.type === "Serviço" ? (
                        (() => {
                          const originalPrice = Number(String((transaction as any).originalPrice).replace(/[^\d,-]/g, "").replace(",", "."));
                          const paidValue = Number(transaction.value);
                          const pendingValue = originalPrice - paidValue;
                          return (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-sm font-semibold ${
                              pendingValue > 0 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              ⏳ {formatCurrencyFromCents(pendingValue)}
                            </span>
                          );
                        })()
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
