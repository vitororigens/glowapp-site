"use client";

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
import { useLogic } from "./logic";

export default function ClientesPage() {
  const { data, methods } = useLogic();

  if (!data.loadingContacts && !data.contacts.length) {
    return (
      <div className="max-w-[1080px] w-[90%] flex flex-col gap-6 mx-auto md-10 md:my-20">
        <Button
          className="mt-3 w-fit"
          onClick={() => {
            methods.setScheduleView({
              open: true,
              type: "create",
            });
          }}
        >
          Criar o primeiro contato
        </Button>
        <div
          className="bg-red-100 border-l-4 border-[var(--main-color)] text-[var(--main-color)] p-4 rounded-lg"
          role="alert"
        >
          <p className="font-bold">QUE PENA!</p>
          <p>Não há contatos registrados 😢</p>
        </div>
      </div>
    );
  }

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
          {data.contacts && data.contacts.length > 0 ? (
            data.contacts.map((contact: any) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone}</TableCell>
                <TableCell>{contact.lastVisit ? contact.lastVisit : "Não visitado"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Nenhum cliente encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
