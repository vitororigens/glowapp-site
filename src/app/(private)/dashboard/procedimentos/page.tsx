"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { database } from "@/services/firebase";
import { collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore";
import { useAuthContext } from "@/context/AuthContext";
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
import { formatCurrencyFromCents } from "@/utils/maks/masks";
import { formatDateToBrazilian } from "@/utils/formater/date";

interface Procedure {
  id: string;
  code: string;
  name: string;
  price: string;
  description?: string;
  date?: string;
  type: 'revenue';
}

export default function Procedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthContext();
  const router = useRouter();
  const uid = user?.uid;

  const fetchProcedures = async () => {
    if (!uid) return;

    try {
      const proceduresRef = collection(database, "Procedures");
      const q = query(proceduresRef, where("uid", "==", uid));
      const querySnapshot = await getDocs(q);
      
      const proceduresData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Procedure[];

      setProcedures(proceduresData);
    } catch (error) {
      console.error("Erro ao buscar procedimentos:", error);
      toast.error("Erro ao carregar procedimentos!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, [uid]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este procedimento?")) {
      try {
        await deleteDoc(doc(database, "Procedures", id));
        toast.success("Procedimento excluído com sucesso!");
        fetchProcedures();
      } catch (error) {
        console.error("Erro ao excluir procedimento:", error);
        toast.error("Erro ao excluir procedimento!");
      }
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/procedimentos/novo?id=${id}`);
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Procedimentos</h1>
        <Button onClick={() => router.push("/dashboard/procedimentos/novo")}>
          Novo Procedimento
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-4">Carregando...</div>
      ) : procedures.length === 0 ? (
        <div className="text-center py-4">Nenhum procedimento cadastrado.</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {procedures.map((procedure) => (
                <TableRow key={procedure.id}>
                  <TableCell>{procedure.code}</TableCell>
                  <TableCell>{procedure.name}</TableCell>
                  <TableCell>{formatCurrencyFromCents(Number(procedure.price) * 100)}</TableCell>
                  <TableCell>{procedure.description || "-"}</TableCell>
                  <TableCell>{procedure.date ? formatDateToBrazilian(procedure.date) : "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => handleEdit(procedure.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(procedure.id)}
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