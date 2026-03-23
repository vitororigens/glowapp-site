"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface Procedure {
  id: string;
  code: string;
  name: string;
  price: string;
  description?: string;
  date?: string;
  category?: string;  // ✅ Adicionado
  type: 'revenue';
}

export default function Procedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');  // ✅ Adicionar busca
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

  // ✅ Filtrar procedimentos pela busca (nome, código, descrição, categoria)
  const filteredProcedures = procedures.filter((procedure) => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      procedure.name.toLowerCase().includes(searchLower) ||
      procedure.code.toLowerCase().includes(searchLower) ||
      procedure.description?.toLowerCase().includes(searchLower) ||
      procedure.category?.toLowerCase().includes(searchLower) // ✅ Adicionado filtro por categoria
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Procedimentos</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              onClick={() => router.push("/dashboard/procedimentos/novo")}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" />
              <span className="sm:hidden">Novo</span>
              <span className="hidden sm:inline">Novo Procedimento</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <Card>
          <CardHeader className="pb-4">
            <Input
              type="text"
              placeholder="Pesquisar por nome, código, categoria ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="text-center py-4">Carregando...</div>
            ) : filteredProcedures.length === 0 ? (
              <div className="text-center py-4">
                {searchTerm.trim()
                  ? "Nenhum procedimento encontrado para esta busca."
                  : "Nenhum procedimento cadastrado."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[600px] md:min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcedures.map((procedure) => (
                        <TableRow key={procedure.id}>
                          <TableCell>{procedure.code}</TableCell>
                          <TableCell>{procedure.name}</TableCell>
                          <TableCell>{procedure.category || "-"}</TableCell>
                          <TableCell>{formatCurrencyFromCents(Number(procedure.price))}</TableCell>
                          <TableCell>{procedure.description || "-"}</TableCell>
                          <TableCell>
                            {procedure.date ? formatDateToBrazilian(procedure.date) : "-"}
                          </TableCell>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
