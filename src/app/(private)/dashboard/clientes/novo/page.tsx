"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter, useSearchParams } from "next/navigation";
import { currencyMask, currencyUnMask, cpfMask, cpfUnMask, celularMask, celularUnMask } from "@/utils/maks/masks";
import { useAuthContext } from "@/context/AuthContext";
import { database, storage } from "@/services/firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { z } from "zod";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { UserCircle, PlusCircle, AlertTriangle } from "lucide-react";
import { usePlanLimitations } from "@/hooks/usePlanLimitations";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(11, "Número de CPF inválido").optional(),
  phone: z.string().min(10, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  observations: z.string().optional(),
  image: z.string().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export default function NewContact() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactId = searchParams.get('id');
  const { planLimits, canAddClient } = usePlanLimitations();

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
      name: "",
      cpf: "",
      phone: "",
      email: "",
      observations: "",
      image: undefined,
    },
  });

  useEffect(() => {
    if (contactId) {
      const docRef = doc(database, "Contacts", contactId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            reset({
              name: data.name || "",
              cpf: cpfMask(data.cpf || ""),
              phone: celularMask(data.phone || ""),
              email: data.email || "",
              observations: data.observations || "",
              image: data.image || undefined,
            });
            setImage(data.imageUrl || null);
          }
        }
      });
    }
  }, [contactId, reset]);

  const handleImageUpload = async (file: File) => {
    if (!uid) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `contacts/${uid}/${new Date().getTime()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setImage(url);
      setValue('image', url);
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao enviar imagem!');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: FormSchemaType) => {
    if (!uid) return;
    
    // Verificar se é uma nova criação (não edição) e se pode adicionar cliente
    if (!contactId && !canAddClient(0)) {
      toast.error(`Você atingiu o limite de ${planLimits.clients} clientes do seu plano ${planLimits.planName}. Faça upgrade para adicionar mais clientes.`);
      return;
    }
    
    setIsLoading(true);
    try {
      const docRef = contactId
        ? doc(database, "Contacts", contactId)
        : doc(collection(database, "Contacts"));

      // Buscar dados existentes para preservar createdAt
      let existingCreatedAt = new Date().toISOString();
      if (contactId) {
        const existingDoc = await getDoc(docRef);
        if (existingDoc.exists()) {
          existingCreatedAt = existingDoc.data().createdAt || new Date().toISOString();
        }
      }

      await setDoc(docRef, {
        ...data,
        cpf: cpfUnMask(data.cpf || ""),
        phone: celularUnMask(data.phone || ""),
        uid,
        image: "",
        ...(image && { imageUrl: image }),
        // ✅ Timestamps padronizados
        createdAt: existingCreatedAt,
        updatedAt: new Date().toISOString(),
      });

      toast.success(contactId ? "Cliente atualizado!" : "Cliente adicionado!");
      router.back();
    } catch (error) {
      console.error("Erro ao criar/atualizar cliente: ", error);
      toast.error("Erro ao criar/atualizar cliente!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      {/* Alerta de Limitação */}
      {!contactId && !canAddClient(0) && (
        <Alert className="mb-4 border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Você atingiu o limite de {planLimits.clients} clientes do seu plano {planLimits.planName}. 
            <Button 
              variant="link" 
              className="p-0 h-auto font-semibold text-yellow-800"
                              onClick={() => router.push('/dashboard/planos')}
            >
              Faça upgrade para adicionar mais clientes.
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <h2 className="text-xl font-bold mb-4">
        {contactId ? "Editar" : "Novo"} Cliente
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-col items-center space-y-4">
            {image ? (
              <div className="relative group">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={image} />
                  <AvatarFallback>
                    {watch("name")?.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <label className="cursor-pointer">
                    <label title="Upload Image">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        title="Upload an image"
                        placeholder="Choose an image file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        disabled={isUploading}
                      />
                      <span className="sr-only">Upload Image</span>
                    </label>
                    <PlusCircle className="h-8 w-8 text-white" />
                  </label>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  disabled={isUploading}
                />
                <div className="relative">
                  <UserCircle className="h-32 w-32 text-gray-400" />
                  <PlusCircle className="absolute bottom-0 right-0 h-8 w-8 text-primary" />
                </div>
              </label>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome*</Label>
            <Input {...register("name")} placeholder="Nome completo" />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label>CPF</Label>
            <Input 
              {...register("cpf")} 
              placeholder="CPF"
              onChange={(e) => setValue("cpf", cpfMask(e.target.value))}
            />
            {errors.cpf && (
              <p className="text-red-500 text-sm">{errors.cpf.message}</p>
            )}
          </div>

          <div>
            <Label>Telefone*</Label>
            <Input 
              {...register("phone")} 
              placeholder="Telefone"
              onChange={(e) => setValue("phone", celularMask(e.target.value))}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <Label>Email</Label>
            <Input {...register("email")} placeholder="Email" />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label>Observações</Label>
          <Textarea 
            {...register("observations")} 
            placeholder="Observações sobre o cliente"
            className="min-h-[80px] sm:min-h-[100px]"
          />
          {errors.observations && (
            <p className="text-red-500 text-sm">{errors.observations.message}</p>
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