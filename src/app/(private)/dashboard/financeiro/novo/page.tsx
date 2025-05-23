"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, FormSchemaType } from "./schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { currencyMask, currencyUnMask } from "@/utils/maks/masks";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function NewLaunch() {
  const [selectedType, setSelectedType] = useState<"revenue" | "expense" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      date: "",
      time: "",
      value: "",
      description: "",
    }
  });
  
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const itemId = searchParams.get('id');
  const itemType = searchParams.get('type') as "revenue" | "expense" | null;

  useEffect(() => {
    if (itemType) {
      setSelectedType(itemType);
    }
  }, [itemType]);

  const getTypeInPortuguese = (type: string) => {
    if (type === "revenue") return "Receita";
    if (type === "expense") return "Despesa";
    return "";
  };

  useEffect(() => {
    if (itemId && itemType) {
      const collectionName = itemType === "revenue" ? "Revenue" : "Expense";
      const docRef = doc(database, collectionName, itemId);
      
      getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            reset({
              name: data.name || "",
              category: data.category || "",
              date: data.date || "",
              time: data.time || "",
              value: data.value ? currencyMask(data.value.toString()) : "",
              description: data.description || "",
              type: itemType
            });
          } else {
            alert("Lançamento não encontrado!");
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar lançamento: ", error);
          alert("Erro ao carregar dados do lançamento!");
        });
    }
  }, [itemId, itemType, reset]);

  const onSubmit = async (data: FormSchemaType) => {
  const resolvedType = itemType || selectedType;

  if (!resolvedType) {
    alert("Tipo de lançamento inválido.");
    return;
  }

  const collectionName = resolvedType === "revenue" ? "Revenue" : "Expense";
  const docId = itemId || crypto.randomUUID();
  const docRef = doc(database, collectionName, docId);

  const numericValue = Number(currencyUnMask(data.value));
  if (isNaN(numericValue)) {
    alert("Valor inválido.");
    return;
  }

  const typePt = resolvedType === "revenue" ? "Receita" : "Despesa";

  const baseData = {
    ...data,
    uid,
    type: typePt,
    value: numericValue,
    updatedAt: new Date().toISOString(),
    ...(itemId ? {} : { createdAt: new Date().toISOString() }),
  };

  try {
    setIsLoading(true);
    await setDoc(docRef, baseData);
    alert(itemId ? "Lançamento atualizado!" : "Lançamento adicionado!");
    router.back();
  } catch (error) {
    console.error("Erro ao criar/atualizar lançamento: ", error);
    alert("Erro ao salvar lançamento.");
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {itemId ? "Editar" : "Novo"} {getTypeInPortuguese(selectedType)}
      </h2>

      {!selectedType && !itemId ? (
        <div>
          <Label>Escolha o tipo</Label>
          <div className="flex gap-4 mt-2">
            <Button onClick={() => setSelectedType("revenue")} variant="outline">
              Receita
            </Button>
            <Button onClick={() => setSelectedType("expense")} variant="outline">
              Despesa
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register("type")} value={itemType || selectedType} />

          <div>
            <Label>Categoria</Label>
            <Input {...register("category")} />
            {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
          </div>

          <div>
            <Label>Nome</Label>
            <Input {...register("name")} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Data</Label>
            <Input type="date" {...register("date")} />
            {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
          </div>

          <div>
            <Label>Hora</Label>
            <Input type="time" {...register("time")} />
            {errors.time && <p className="text-red-500 text-sm">{errors.time.message}</p>}
          </div>

          <div>
            <Label>Valor</Label>
            <Input 
              type="text" 
              {...register("value")} 
              onChange={(e) => setValue("value", currencyMask(e.target.value))} 
            />
            {errors.value && <p className="text-red-500 text-sm">{errors.value.message}</p>}
          </div>

          <div>
            <Label>Descrição</Label>
            <Input {...register("description")} />
            {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
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
      )}
    </div>
  );
}