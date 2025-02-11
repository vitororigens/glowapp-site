import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default function ClientesPage() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button asChild>
          <Link href="/dashboard/clientes/novo">
            <PlusIcon className="mr-2 h-4 w-4" />
            Novo Cliente
          </Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Última Visita</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">João Silva</TableCell>
            <TableCell>joao@email.com</TableCell>
            <TableCell>(11) 99999-9999</TableCell>
            <TableCell>10/04/2024</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}