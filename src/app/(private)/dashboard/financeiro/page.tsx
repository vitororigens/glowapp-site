"use client";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import { currencyMask } from "@/utils/maks/masks";
import { useState } from "react";
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

  const handleEdit = (id: string, collection: "Revenue" | "Expense") => {
    router.push(`/dashboard/financeiro/novo?id=${id}&type=${collection}`);
  };

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
    ...(revenues || []).map(rev => ({ ...rev, collection: "Revenue" as const })),
    ...(expenses || []).map(exp => ({ ...exp, collection: "Expense" as const })),
    // Adiciona serviços não-orçamentos como receitas
    ...(services || [])
      .filter(service => !service.budget)
      .map(service => ({
        id: service.id,
        name: service.name,
        date: service.date,
        value: service.price,
        type: "Serviço",
        category: "Serviços",
        description: "Serviço realizado",
        collection: "Revenue" as const
      }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calcula totais
  const totalRevenue = [
    ...(revenues || []),
    ...(services || [])
      .filter(service => !service.budget)
      .map(service => ({ value: service.price }))
  ].reduce((acc, curr) => {
    const value = parseFloat(String(curr.value).replace(/[^\d,-]/g, "").replace(",", "."));
    return acc + value;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-500">Receitas (incluindo serviços)</h3>
          <p className="text-2xl font-bold text-green-600">{currencyMask(totalRevenue.toString())}</p>
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
                <TableHead>Valor</TableHead>
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
                    {formatPrice(transaction.value, transaction.collection === "Expense")}
                  </TableCell>
                  <TableCell className="text-right">
                    {transaction.type !== "Serviço" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2"
                          onClick={() => handleEdit(transaction.id, transaction.collection)}
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
