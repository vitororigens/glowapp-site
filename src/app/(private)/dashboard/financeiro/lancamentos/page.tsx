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
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";
import { currencyMask } from "@/utils/maks/masks";

// Definir interfaces para os tipos de dados
interface FinancialItem {
  uid: string;
  description: string;
  date: string;
  value: string | number;
  [key: string]: any; // Para outras propriedades que possam existir
}

interface TransactionItem extends FinancialItem {
  type: string;
  textColor: string;
  value: number;
}

export default function LancamentosPage() {
  const router = useRouter();
  const { data: revenueData, loading: revenueLoading } = useFirestoreCollection("Revenue");
  const { data: expenseData, loading: expenseLoading  } = useFirestoreCollection("Expense");

  console.log(revenueData, expenseData);

  function handleNewLaunch() {
    router.push("/dashboard/financeiro/lancamentos/novo");
  }

  const transactions = [
    ...(revenueData || []).map((item: FinancialItem) => ({
      ...item,
      type: "Receita",
      textColor: "text-green-600",
      value: parseFloat(String(item.value).replace(',', '.'))
    })),
    ...(expenseData || []).map((item: FinancialItem) => ({
      ...item,
      type: "Despesa",
      textColor: "text-red-600",
      value: parseFloat(String(item.value).replace(',', '.'))
    })),
  ];

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Lançamentos</h1>
        <Button onClick={handleNewLaunch}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Adicionar lançamento
        </Button>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Transações</h2>
        {revenueLoading || expenseLoading ? (
          <p>Carregando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((item: TransactionItem) => (
                <TableRow key={item.uid}>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell className={`text-right ${item.textColor}`}>
                    R$ {currencyMask(item.value.toFixed(2))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
