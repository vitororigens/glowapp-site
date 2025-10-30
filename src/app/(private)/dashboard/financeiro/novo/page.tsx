"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, FormSchemaType } from "./schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { currencyMask, currencyUnMask, formatCurrencyFromCents, convertToCentsString } from "@/utils/maks/masks";
import { convertBrazilianToISO, formatDateToBrazilian } from "@/utils/formater/date";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// ✅ Categorias padronizadas (mesmas do app)
const REVENUE_CATEGORIES = [
  { label: 'Consultas', value: 'consultas' },
  { label: 'Procedimentos', value: 'procedimentos' },
  { label: 'Tratamentos', value: 'tratamentos' },
  { label: 'Produtos', value: 'produtos' },
  { label: 'Pacotes', value: 'pacotes' },
  { label: 'Comissões', value: 'comissoes' },
  { label: 'Adiantamentos', value: 'adiantamentos' },
  { label: 'Investimentos', value: 'investimentos' },
  { label: 'Outros', value: 'outros' },
];

const EXPENSE_CATEGORIES = [
  { label: 'Produtos', value: 'produtos' },
  { label: 'Equipamentos', value: 'equipamentos' },
  { label: 'Aluguel', value: 'aluguel' },
  { label: 'Contas', value: 'contas' },
  { label: 'Internet', value: 'internet' },
  { label: 'Telefone', value: 'telefone' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Publicidade', value: 'publicidade' },
  { label: 'Seguros', value: 'seguros' },
  { label: 'Impostos', value: 'impostos' },
  { label: 'Salários', value: 'salarios' },
  { label: 'Comissões', value: 'comissoes' },
  { label: 'Manutenção', value: 'manutencao' },
  { label: 'Limpeza', value: 'limpeza' },
  { label: 'Descartáveis', value: 'descartaveis' },
  { label: 'Cosméticos', value: 'cosmeticos' },
  { label: 'Material de Trabalho', value: 'material_trabalho' },
  { label: 'Cursos', value: 'cursos' },
  { label: 'Certificações', value: 'certificacoes' },
  { label: 'Viagens', value: 'viagens' },
  { label: 'Eventos', value: 'eventos' },
  { label: 'Alimentação', value: 'alimentacao' },
  { label: 'Transporte', value: 'transporte' },
  { label: 'Saúde', value: 'saude' },
  { label: 'Outros', value: 'outros' },
];

export default function NewLaunch() {
  const [selectedType, setSelectedType] = useState<"revenue" | "expense" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, setValue, formState: { errors }, reset, watch } = useForm<FormSchemaType>({
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
  
  const value = watch("value"); // pega o valor do form
  console.log("value", value);
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
            const convertedDate = data.date ? convertBrazilianToISO(data.date) : "";
            
            // ✅ Suportar valor em reais (antigo) ou centavos (novo)
            let valueInCents = 0;
            if (data.value) {
              const rawValue = Number(data.value);
              // Se < 1000, está em reais (antigo), converter para centavos
              valueInCents = rawValue < 1000 ? rawValue * 100 : rawValue;
            }
            
            console.log("Valor do banco:", data.value);
            console.log("Valor normalizado (centavos):", valueInCents);
            
            const formattedValue = formatCurrencyFromCents(valueInCents);
            console.log("Valor formatado:", formattedValue);
            
            reset({
              name: data.name || "",
              category: data.category || "",
              date: convertedDate,
              time: data.time || "",
              description: data.description || "",
              type: itemType
            });
            
            // Define o valor separadamente
            setTimeout(() => {
              setValue("value", formattedValue);
            }, 100);
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

    // ✅ Buscar dados existentes para preservar createdAt
    let existingCreatedAt = new Date().toISOString();
    if (itemId) {
      const existingDoc = await getDoc(docRef);
      if (existingDoc.exists()) {
        existingCreatedAt = existingDoc.data().createdAt || new Date().toISOString();
      }
    }

    const valueInCents = convertToCentsString(data.value);
    const numericValue = Number(valueInCents);
    if (isNaN(numericValue)) {
      alert("Valor inválido.");
      return;
    }

    const typePt = resolvedType === "revenue" ? "Receita" : "Despesa";

    const baseData = {
      ...data,
      date: formatDateToBrazilian(data.date),
      uid,
      type: typePt,
      value: numericValue,  // ✅ Em centavos
      // ✅ Timestamps padronizados
      createdAt: existingCreatedAt,
      updatedAt: new Date().toISOString(),
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
            <select
              {...register("category")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione uma categoria</option>
              {(selectedType === 'revenue' ? REVENUE_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
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
  value={value}
  onChange={(e) => {
    const raw = currencyUnMask(e.target.value); // só números
    const masked = currencyMask(raw.toString()); // aplica máscara
    console.log("masked", masked);
    console.log("raw", raw);
    console.log("e.target.value", e.target.value);
    setValue("value", masked, { shouldValidate: true });
  }}
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