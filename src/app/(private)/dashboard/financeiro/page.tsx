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

export default function FinanceiroPage() {
  const router = useRouter();
  const [period, setPeriod] = useState("mes");

  const getStartDate = (period: string) => {
    const today = new Date();
    let startDate = new Date();
  
    if (period === "mes") {
      startDate.setMonth(today.getMonth() - 1);
    } else if (period === "trimestre") {
      startDate.setMonth(today.getMonth() - 3);
    } else if (period === "ano") {
      startDate.setFullYear(today.getFullYear() - 1);
    }
  
    return startDate.toISOString().split("T")[0]; // Formato "YYYY-MM-DD"
  };
  
  const queryParams = {
    mes: { field: "date", operator: ">=", value: getStartDate("mes") },
    trimestre: { field: "date", operator: ">=", value: getStartDate("trimestre") },
    ano: { field: "date", operator: ">=", value: getStartDate("ano") },
  };
  
  const { data: revenueData, loading: revenueLoading } = useFirestoreCollection(
    "Revenue",
    queryParams[period]
  );
  const { data: expenseData, loading: expenseLoading } = useFirestoreCollection(
    "Expense",
    queryParams[period]
  );

  const transactions = [
    ...(revenueData || []).map((item) => ({
      ...item,
      type: "Receita",
      textColor: "text-green-600",
      value: parseFloat(String(item.value).replace(",", ".")),
    })),
    ...(expenseData || []).map((item) => ({
      ...item,
      type: "Despesa",
      textColor: "text-red-600",
      value: parseFloat(String(item.value).replace(",", ".")),
    })),
  ];

  const totalReceita = transactions
    .filter((t) => t.type === "Receita")
    .reduce((acc, curr) => acc + curr.value, 0);
  const totalDespesa = transactions
    .filter((t) => t.type === "Despesa")
    .reduce((acc, curr) => acc + curr.value, 0);

  function handleNewLaunch() {
    router.push("/dashboard/financeiro/lancamentos/novo");
  }
  function handleHistoric() {
    router.push("/dashboard/financeiro/lancamentos");
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <Button onClick={() => handleNewLaunch()}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Adicionar lançamento
        </Button>
      </div>
      <div className="flex items-center justify-between">
        <Select defaultValue="mes" onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes">Último Mês</SelectItem>
            <SelectItem value="trimestre">Último Trimestre</SelectItem>
            <SelectItem value="ano">Último Ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-lg font-medium">Receita Total</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">R$ {currencyMask(totalReceita.toFixed(2))}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Despesas</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">R$ {currencyMask(totalDespesa.toFixed(2))}</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Lucro</h3>
          <p className="mt-2 text-3xl font-bold">R$ {currencyMask((totalReceita - totalDespesa).toFixed(2))}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Últimas Transações</h2>
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
              {transactions.map((item) => (
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
