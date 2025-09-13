"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { currencyMask, currencyUnMask } from "@/utils/maks/masks";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { z } from "zod";
import { toast } from "react-toastify";

const formSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
  name: z.string().min(1, "Nome do procedimento é obrigatório"),
  price: z.string().min(1, "Valor é obrigatório"),
  description: z.string().optional(),
  date: z.string().optional(),
  type: z.enum(['revenue'], { message: "Tipo é obrigatório" }),
});

type FormSchemaType = z.infer<typeof formSchema>;

// Função para gerar código automático baseado no nome
const generateCode = (name: string) => {
  if (!name.trim()) return '';
  
  // Remove acentos e caracteres especiais
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  
  // Pega as primeiras letras de cada palavra (máximo 3 palavras)
  const words = normalizedName.split(' ').filter(word => word.length > 0).slice(0, 3);
  const initials = words.map(word => word.charAt(0)).join('');
  
  // Adiciona timestamp para garantir unicidade (últimos 3 dígitos)
  const timestamp = Date.now().toString().slice(-3);
  
  return `${initials}${timestamp}`;
};

export default function NewProcedure() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const procedureId = searchParams.get('id');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      price: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      type: "revenue",
    },
  });

  useEffect(() => {
    if (procedureId) {
      const docRef = doc(database, "Procedures", procedureId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            reset({
              code: data.code || "",
              name: data.name || "",
              price: currencyMask(data.price) || "",
              description: data.description || "",
              date: data.date || new Date().toISOString().split('T')[0],
              type: "revenue",
            });
          }
        }
      });
    }
  }, [procedureId, reset]);

  const onSubmit = async (data: FormSchemaType) => {
    if (!uid) return;
    
    setIsLoading(true);
    try {
      const docRef = procedureId
        ? doc(database, "Procedures", procedureId)
        : doc(collection(database, "Procedures"));

      await setDoc(docRef, {
        ...data,
        price: currencyUnMask(data.price),
        uid,
        createdAt: new Date().toISOString(),
      });

      toast.success(procedureId ? "Procedimento atualizado!" : "Procedimento adicionado!");
      router.back();
    } catch (error) {
      console.error("Erro ao criar/atualizar procedimento: ", error);
      toast.error("Erro ao criar/atualizar procedimento!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {procedureId ? "Editar" : "Novo"} Procedimento
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register("type")} value="revenue" />

        <div>
          <Label>Código*</Label>
          <Input 
            {...register("code")} 
            placeholder="Código do procedimento (gerado automaticamente)"
            readOnly={!procedureId}
            className={!procedureId ? "bg-gray-50" : ""}
          />
          {!procedureId && (
            <p className="text-xs text-blue-600 mt-1">
              💡 Código gerado automaticamente baseado no nome
            </p>
          )}
          {errors.code && (
            <p className="text-red-500 text-sm">{errors.code.message}</p>
          )}
        </div>

        <div>
          <Label>Nome*</Label>
          <Input 
            {...register("name")} 
            placeholder="Nome do procedimento"
            onChange={(e) => {
              const name = e.target.value;
              // Gerar código automaticamente quando o nome for digitado
              if (name.trim() && !procedureId) {
                const generatedCode = generateCode(name);
                setValue("code", generatedCode);
              }
            }}
          />
          {errors.name && (
            <p className="text-red-500 text-sm">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label>Valor*</Label>
          <Input
            {...register("price")}
            placeholder="Valor do procedimento"
            onChange={(e) => setValue("price", currencyMask(e.target.value))}
          />
          {errors.price && (
            <p className="text-red-500 text-sm">{errors.price.message}</p>
          )}
        </div>

        <div>
          <Label>Data</Label>
          <Input
            type="date"
            {...register("date")}
          />
          {errors.date && (
            <p className="text-red-500 text-sm">{errors.date.message}</p>
          )}
        </div>

        <div>
          <Label>Descrição</Label>
          <Input
            {...register("description")}
            placeholder="Descrição do procedimento"
          />
          {errors.description && (
            <p className="text-red-500 text-sm">{errors.description.message}</p>
          )}
        </div>

        <div className="flex flex-row justify-between align-center">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
          <Button onClick={() => router.back()} variant="outline">
            Voltar
          </Button>
        </div>
      </form>
    </div>
  );
} 