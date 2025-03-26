"use client";

import { Button } from "@/components/ui/button";
import { database } from "@/services/firebase";
import { deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currencyMask } from "@/utils/maks/masks";
import useFirestoreCollection from "@/hooks/useFirestoreCollection";

interface Service {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  price: string;
  priority: string;
  duration: string;
  observations: string;
  services: Array<{
    id: string;
    code: string;
    name: string;
    price: string;
    date: string;
  }>;
  professionals: Array<{
    id: string;
    name: string;
    specialty: string;
  }>;
  budget: boolean;
}

export default function Services() {
  const { data: services, loading } = useFirestoreCollection<Service>("Services");
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este serviço?")) {
      try {
        await deleteDoc(doc(database, "Services", id));
        toast.success("Serviço excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir serviço:", error);
        toast.error("Erro ao excluir serviço!");
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/servicos/novo?id=${id}`);
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Serviços</h1>
        <Button onClick={() => router.push("/dashboard/servicos/novo")}>
          Novo Serviço
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Carregando...</div>
      ) : !services || services.length === 0 ? (
        <div className="text-center py-4">Nenhum serviço cadastrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service: Service) => (
                <TableRow key={service.id}>
                  <TableCell>{service.name}</TableCell>
                  <TableCell>{service.date}</TableCell>
                  <TableCell>{service.time}</TableCell>
                  <TableCell>{currencyMask(service.price)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        service.budget
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {service.budget ? "Orçamento" : "Serviço"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleEdit(service.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(service.id)}
                    >
                      Excluir
                    </Button>
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