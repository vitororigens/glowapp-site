"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, FormSchemaType } from "./schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { currencyMask, currencyUnMask } from "@/utils/maks/masks";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function NewLaunch() {
  const [selectedType, setSelectedType] = useState<"revenue" | "expense" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
  });
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();

  useEffect(() => {
    if (selectedItemId && selectedType) {
      const collectionName = selectedType === "revenue" ? "Revenue" : "Expense";
      const docRef = doc(database, collectionName, selectedItemId);

      getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data) {
              reset({
                name: data.name || "",
                category: data.category || "",
                date: data.date || "",
                time: data.time || "",
                value: currencyMask(data.value) || "",
                description: data.description || "",
              });
            }
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar lançamento: ", error);
        });
    }
  }, [selectedItemId, selectedType, reset]);

  const onSubmit = async (data: FormSchemaType) => {
    if (!data.name || !data.value || !data.category || !data.date || !data.time) {
      alert("Por favor, preencha todos os campos obrigatórios antes de salvar.");
      return;
    }

    setIsLoading(true);

    const collectionName = selectedType === "revenue" ? "Revenue" : "Expense";
    const docRef = doc(database, collectionName, selectedItemId || crypto.randomUUID());

    const baseData = {
      ...data,
      uid,
      value: currencyUnMask(data.value),
      type: selectedType,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(docRef, baseData);
      alert(selectedItemId ? "Lançamento atualizado!" : "Lançamento adicionado!");
      reset();
      router.back();
    } catch (error) {
      console.error("Erro ao criar/atualizar lançamento: ", error);
      alert("Erro ao criar/atualizar lançamento!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Adicionar {selectedType === "expense" ? "Despesa" : "Receita" }</h2>
      {!selectedType ? (
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
          <input type="hidden" {...register("type")} value={selectedType} />

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
            <Input type="text" {...register("value")} onChange={(e) => setValue("value", currencyMask(e.target.value))} />
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
            <Button onClick={() => setSelectedType("")} variant="outline">
              Voltar
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}