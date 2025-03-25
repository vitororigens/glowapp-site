"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { z } from "zod";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { dataMask, dataUnMask, horaMask, horaUnMask } from "@/utils/maks/masks";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatório"),
  name: z.string().min(1, "Nome do evento é obrigatório"),
  date: z.string().min(1, "Data é obrigatório"),
  hour: z.string().min(1, "Horário é obrigatório"),
  observation: z.string().optional(),
  hasNotification: z.boolean().default(false),
});

type FormSchemaType = z.infer<typeof formSchema>;

export default function NewEvent() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get('id');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      name: "",
      date: "",
      hour: "",
      observation: "",
      hasNotification: false,
    },
  });

  useEffect(() => {
    if (eventId) {
      const docRef = doc(database, "Notebook", eventId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            reset({
              category: data.category || "",
              name: data.name || "",
              date: data.date || "",
              hour: data.hour || "",
              observation: data.observation || "",
              hasNotification: data.hasNotification || false,
            });
          }
        }
      });
    }
  }, [eventId, reset]);

  const onSubmit = async (data: FormSchemaType) => {
    if (!uid) return;
    
    setIsLoading(true);
    try {
      const docRef = eventId
        ? doc(database, "Notebook", eventId)
        : doc(collection(database, "Notebook"));

      await setDoc(docRef, {
        ...data,
        date: dataUnMask(data.date),
        hour: horaUnMask(data.hour),
        uid,
        createdAt: new Date().toISOString(),
      });

      toast.success(eventId ? "Evento atualizado!" : "Evento adicionado!");
      router.back();
    } catch (error) {
      console.error("Erro ao criar/atualizar evento: ", error);
      toast.error("Erro ao criar/atualizar evento!");
    } finally {
      setIsLoading(false);
    }
  };

  const hasNotification = watch("hasNotification");

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {eventId ? "Editar" : "Novo"} Evento
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Categoria*</Label>
            <Input {...register("category")} placeholder="Categoria do evento" />
            {errors.category && (
              <p className="text-red-500 text-sm">{errors.category.message}</p>
            )}
          </div>

          <div>
            <Label>Nome do Evento*</Label>
            <Input {...register("name")} placeholder="Nome do evento" />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label>Data*</Label>
            <Input 
              {...register("date")} 
              placeholder="Data"
              onChange={(e) => setValue("date", dataMask(e.target.value))}
            />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>

          <div>
            <Label>Horário*</Label>
            <Input 
              {...register("hour")} 
              placeholder="Horário"
              onChange={(e) => setValue("hour", horaMask(e.target.value))}
            />
            {errors.hour && (
              <p className="text-red-500 text-sm">{errors.hour.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="hasNotification"
            checked={hasNotification}
            onCheckedChange={(checked) => setValue("hasNotification", checked)}
          />
          <Label htmlFor="hasNotification">Adicionar notificação</Label>
        </div>

        <div>
          <Label>Observações</Label>
          <Textarea 
            {...register("observation")} 
            placeholder="Observações sobre o evento"
            className="min-h-[100px]"
          />
          {errors.observation && (
            <p className="text-red-500 text-sm">{errors.observation.message}</p>
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