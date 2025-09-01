"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useFirestoreCollection from '@/hooks/useFirestoreCollection';
import { Button } from '@/components/ui/button';
import { currencyMask } from '@/utils/maks/masks';
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
    ...(services || []).map(service => ({
      id: service.id,
      name: service.name,
      date: service.date,
      value: service.price,
      type: "Serviço",
      category: "Serviços",
      description: "Serviço realizado",
      collection: "Revenue" as const,
      payments: service.payments,
      pendingValue: service.payments?.filter((p: any) => p.status === 'pendente').reduce((sum: number, p: any) => sum + Number(p.value), 0) || 0
    }))] :
    transactions || [];

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Histórico de {tipo === 'receita' ? 'Receitas' : 'Despesas'}</h1>
        <Button onClick={() => router.push(`/dashboard/financeiro/novo?type=${tipo}`)}>Novo Registro</Button>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                {tipo === 'receita' && <TableHead>Pagamento</TableHead>}
                {tipo === 'receita' && <TableHead>Valor Pendente</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.name}</TableCell>
                  <TableCell>{formatDateToBrazilian(transaction.date)}</TableCell>
                  <TableCell className={transaction.type === 'Serviço' ? 'text-green-600' : 'text-green-600'}>{currencyMask(transaction.value.toString())}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  {tipo === 'receita' && 'payments' in transaction && Array.isArray(transaction.payments) && (
                    <TableCell>
                      <div className="space-y-1">
                        {transaction.payments.map((payment: any, idx: number) => (
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
                        {transaction.payments.filter((p: any) => p.status === 'pendente').length > 0 && (
                          <div className="mt-1">
                            <span className="text-xs text-orange-500 font-medium">
                              Pendente: {transaction.payments.filter((p: any) => p.status === 'pendente').length} pagamento(s)
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  )}
                  {tipo === 'receita' && 'pendingValue' in transaction && typeof transaction.pendingValue === 'number' && <TableCell className="text-orange-500">{currencyMask(transaction.pendingValue.toString())}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
