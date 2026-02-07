"use client";

import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { database, storage } from "@/services/firebase";  
import { doc, setDoc, collection, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
import { phoneMask, phoneUnMask, cnpjMask, cnpjUnMask, cpfMask } from "@/utils/maks/masks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

const formSchema = z.object({
  name: z.string()
    .min(1, "O nome é obrigatório.")
    .refine((value) => value.trim().split(" ").length >= 2, {
      message: "O nome completo deve conter pelo menos um sobrenome.",
    }),
  phone: z.string()
    .min(1, "O telefone é obrigatório.")
    .refine((value) => /^[0-9]{10,11}$/.test(value), {
      message: "O telefone deve ser válido e conter 10 ou 11 dígitos.",
    }),
  email: z.string()
    .min(1, "O email é obrigatório.")
    .email("Formato de email inválido"),
  cpfCnpj: z.string().min(11, "CPF/CNPJ é obrigatório"),
  registrationNumber: z.string().optional(),
  specialty: z.string().optional(),
  observations: z.string().optional(),
  adress: z.string().optional(),
  image: z.string().optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

// ✅ Especialidades padronizadas
const professionalSpecialties = [
  { label: 'Dentista', value: 'dentista' },
  { label: 'Manicure', value: 'manicure' },
  { label: 'Cirurgião Plástico', value: 'cirurgiao_plastico' },
  { label: 'Enfermeiro(a) Esteta', value: 'enfermeiro_esteta' },
  { label: 'Dermatologista', value: 'dermatologista' },
  { label: 'Fisioterapeuta', value: 'fisioterapeuta' },
  { label: 'Podólogo(a)', value: 'podologo' },
  { label: 'Esteticista', value: 'esteticista' },
  { label: 'Massoterapeuta', value: 'massoterapeuta' },
  { label: 'Cabeleireiro(a)', value: 'cabeleireiro' },
  { label: 'Maquiador(a)', value: 'maquiador' },
  { label: 'Outro', value: 'outro' },
];

export default function NewProfessional() {
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpfCnpj: "",
      phone: "",
      email: "",
      adress: "",
      registrationNumber: "",
      specialty: "",
      observations: "",
      image: undefined,
    },
  });

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      setSelectedItemId(id);
    }
  }, [searchParams]);

  useEffect(() => {
    if (selectedItemId) {
      const docRef = doc(database, "Profissionals", selectedItemId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            setValue("name", data.name);
            setValue("cpfCnpj", data.cpfCnpj?.length > 11 ? cnpjMask(data.cpfCnpj) : cpfMask(data.cpfCnpj || ""));
            setValue("phone", phoneMask(data.phone || ""));
            setValue("email", data.email);
            setValue("observations", data.observations);
            setValue("adress", data.adress);
            setValue("registrationNumber", data.registrationNumber);
            setValue("specialty", data.specialty);
            if (data.imageUrl) {
              setImage(data.imageUrl);
              setValue("image", data.imageUrl);
            } else {
              setImage(null);
              setValue("image", undefined);
            }
          }
        }
      });
    }
  }, [selectedItemId, setValue]);

  const pickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      setImage(URL.createObjectURL(file)); 
    }
  };

  const uploadImage = async (file: File) => {
    const imageRef = ref(storage, `profissionals/${uid}/${Date.now()}`);
    await uploadBytes(imageRef, file);
    return await getDownloadURL(imageRef);
  };

  const formatCpfCnpj = (value: string) => (value.replace(/\D/g, "").length <= 11 ? cpfMask(value) : cnpjMask(value));

  const onSubmit = async (data: FormSchemaType) => {
    setIsLoading(true);
    try {
      let imageUrl = "";
      if (file) {
        imageUrl = await uploadImage(file);
      }

      const sanitizedData = { ...data };
      Object.keys(sanitizedData).forEach((key) => {
        if (sanitizedData[key as keyof FormSchemaType] === undefined) {
          delete sanitizedData[key as keyof FormSchemaType];
        }
      });

      const docRef = selectedItemId
        ? doc(database, "Profissionals", selectedItemId)
        : doc(collection(database, "Profissionals"));

      // ✅ Buscar dados existentes para preservar createdAt
      let existingCreatedAt = new Date().toISOString();
      if (selectedItemId) {
        const existingDoc = await getDoc(docRef);
        if (existingDoc.exists()) {
          existingCreatedAt = existingDoc.data().createdAt || new Date().toISOString();
        }
      }

      await setDoc(docRef, {
        ...sanitizedData,
        cpfCnpj: data.cpfCnpj ? cnpjUnMask(data.cpfCnpj) : "",
        phone: phoneUnMask(data.phone || ""),
        uid,
        ...(imageUrl && { imageUrl }),
        // ✅ Timestamps padronizados
        createdAt: existingCreatedAt,
        updatedAt: new Date().toISOString(),
      });

      toast.success(selectedItemId ? "Profissional Atualizado!" : "Profissional adicionado!");
      reset();
      router.back();
    } catch (error) {
      console.error("Erro ao criar/atualizar profissional: ", error);
      toast.error("Erro ao criar/atualizar profissional!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">Adicionar Profissional</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-6 flex justify-center">
          <div 
            onClick={() => document.getElementById("fileInput")?.click()} 
            className="relative w-32 h-32 rounded-full overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400"
          >
            {image ? (
              <Image src={image || "/default-image.png"} alt="Imagem do Profissional" width={128} height={128} className="object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/default-image.png"; }} />
            ) : (
              <div className="text-gray-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            )}
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={pickImage}
              className="hidden"
            />
          </div>
        </div>

        <div>
          <Label>Nome Completo*</Label>
          <Controller
            control={control}
            name="name"
            render={({ field }) => (
              <Input {...field} placeholder="Nome completo" />
            )}
          />
          {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
        </div>

        <div>
          <Label>CPF/CNPJ*</Label>
          <Controller
            control={control}
            name="cpfCnpj"
            render={({ field }) => (
              <Input
                {...field}
                onChange={(e) => field.onChange(formatCpfCnpj(e.target.value))}
                placeholder="CPF ou CNPJ"
              />
            )}
          />
          {errors.cpfCnpj && <p className="text-red-500 text-sm">{errors.cpfCnpj.message}</p>}
        </div>

        <div>
          <Label>Telefone*</Label>
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <Input
                {...field}
                onChange={(e) => field.onChange(phoneUnMask(e.target.value))}
                value={phoneMask(field.value)}
                placeholder="Telefone"
              />
            )}
          />
          {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
        </div>

        <div>
          <Label>E-mail*</Label>
          <Controller
            control={control}
            name="email"
            render={({ field }) => (
              <Input {...field} type="email" placeholder="E-mail" />
            )}
          />
          {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
        </div>

        <div>
          <Label>Endereço</Label>
          <Controller
            control={control}
            name="adress"
            render={({ field }) => (
              <Input {...field} placeholder="Endereço" />
            )}
          />
        </div>

        <div>
          <Label>Número de Registro</Label>
          <Controller
            control={control}
            name="registrationNumber"
            render={({ field }) => (
              <Input {...field} placeholder="Número de registro" />
            )}
          />
        </div>

        <div>
          <Label>Especialidade</Label>
          <Controller
            control={control}
            name="specialty"
            render={({ field }) => (
              <select
                value={field.value || ''}
                onChange={field.onChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione uma especialidade</option>
                {professionalSpecialties.map((spec) => (
                  <option key={spec.value} value={spec.value}>{spec.label}</option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <Label>Observações</Label>
          <Controller
            control={control}
            name="observations"
            render={({ field }) => (
              <Input {...field} placeholder="Observações" />
            )}
          />
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
