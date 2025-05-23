"use client";

import { useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import useFirestoreCollection from '@/hooks/useFirestoreCollection';

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

export default function Historico() {
  const searchParams = useSearchParams();
  const tipo = searchParams.get('tipo');
  const { data: transactions, loading } = useFirestoreCollection<Transaction>(tipo === 'receita' ? 'Revenue' : 'Expense');

  if (loading) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Histórico de {tipo === 'receita' ? 'Receitas' : 'Despesas'}</h1>
      <div className="overflow-x-auto max-h-screen overflow-y-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions && transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.name}</TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.value}</TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell>{transaction.description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
