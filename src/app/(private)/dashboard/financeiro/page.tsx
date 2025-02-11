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

const data = [
  { name: "Jan", receita: 4000, despesa: 2400 },
  { name: "Fev", receita: 3000, despesa: 1398 },
  { name: "Mar", receita: 2000, despesa: 9800 },
  { name: "Abr", receita: 2780, despesa: 3908 },
];

export default function FinanceiroPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financeiro</h1>
        <Select defaultValue="mes">
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
          <p className="mt-2 text-3xl font-bold text-green-600">R$ 15.000</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Despesas</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">R$ 5.000</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Lucro</h3>
          <p className="mt-2 text-3xl font-bold">R$ 10.000</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-medium">Média Diária</h3>
          <p className="mt-2 text-3xl font-bold">R$ 500</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Receitas x Despesas</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="receita"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="despesa"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-xl font-semibold">Últimas Transações</h2>
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
            <TableRow>
              <TableCell>10/04/2024</TableCell>
              <TableCell>Corte de Cabelo - João Silva</TableCell>
              <TableCell>Receita</TableCell>
              <TableCell className="text-right text-green-600">
                R$ 50,00
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>09/04/2024</TableCell>
              <TableCell>Produtos de Limpeza</TableCell>
              <TableCell>Despesa</TableCell>
              <TableCell className="text-right text-red-600">
                R$ 150,00
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}