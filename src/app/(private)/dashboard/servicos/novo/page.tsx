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
import { database } from "@/services/firebase";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { z } from "zod";
import { toast } from "react-toastify";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomModalServices } from "@/components/CustomModalServices";
import { CustomModalProfessionals } from "@/components/CustomModalProfessionals";
import { ItemService } from "@/components/ItemService";
import { ItemProfessional } from "@/components/ItemProfessional";
import { FileIcon } from "@/components/icons/FileIcon";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Hora é obrigatória"),
  price: z.string().min(1, "Valor é obrigatório"),
  priority: z.string().optional(),
  duration: z.string().optional(),
  observations: z.string().optional(),
  services: z.array(z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    price: z.string(),
    date: z.string().optional(),
  })).optional(),
  professionals: z.array(z.object({
    id: z.string(),
    name: z.string(),
    specialty: z.string(),
  })).optional(),
  budget: z.boolean().default(false),
  documents: z.array(z.object({
    name: z.string(),
    url: z.string(),
  })).optional(),
  beforePhotos: z.array(z.object({
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
  afterPhotos: z.array(z.object({
    url: z.string(),
    description: z.string().optional(),
  })).optional(),
});

type FormSchemaType = z.infer<typeof formSchema>;

export default function NewService() {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showProfessionalsModal, setShowProfessionalsModal] = useState(false);
  const [uploadType, setUploadType] = useState<'document' | 'before' | 'after' | null>(null);

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
      date: new Date().toISOString().split('T')[0],
      time: "",
      price: "",
      priority: "",
      duration: "",
      observations: "",
      services: [],
      professionals: [],
      budget: false,
      documents: [],
      beforePhotos: [],
      afterPhotos: [],
    },
  });

  const budget = watch("budget");
  const services = watch("services") || [];
  const professionals = watch("professionals") || [];
  const documents = watch("documents") || [];
  const beforePhotos = watch("beforePhotos") || [];
  const afterPhotos = watch("afterPhotos") || [];

  useEffect(() => {
    if (serviceId) {
      const docRef = doc(database, "Services", serviceId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            reset({
              name: data.name || "",
              cpf: cpfMask(data.cpf || ""),
              phone: celularMask(data.phone || ""),
              email: data.email || "",
              date: data.date || new Date().toISOString().split('T')[0],
              time: data.time || "",
              price: currencyMask(data.price || ""),
              priority: data.priority || "",
              duration: data.duration || "",
              observations: data.observations || "",
              services: data.services || [],
              professionals: data.professionals || [],
              budget: data.budget || false,
              documents: data.documents || [],
              beforePhotos: data.beforePhotos || [],
              afterPhotos: data.afterPhotos || [],
            });
          }
        }
      });
    }
  }, [serviceId, reset]);

  const onSubmit = async (data: FormSchemaType) => {
    if (!uid) return;
    
    setIsLoading(true);
    try {
      const docRef = serviceId
        ? doc(database, "Services", serviceId)
        : doc(collection(database, "Services"));

      await setDoc(docRef, {
        ...data,
        price: currencyUnMask(data.price),
        cpf: cpfUnMask(data.cpf),
        phone: celularUnMask(data.phone),
        uid,
        createdAt: new Date().toISOString(),
      });

      toast.success(serviceId ? "Serviço atualizado!" : "Serviço adicionado!");
      router.back();
    } catch (error) {
      console.error("Erro ao criar/atualizar serviço: ", error);
      toast.error("Erro ao criar/atualizar serviço!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveService = (id: string) => {
    const updatedServices = services.filter(item => item.id !== id);
    setValue("services", updatedServices);
  };

  const handleRemoveProfessional = (id: string) => {
    const updatedProfessionals = professionals.filter(item => item.id !== id);
    setValue("professionals", updatedProfessionals);
  };

  const handleFileUpload = async (files: FileList | null, type: 'document' | 'before' | 'after') => {
    if (!files || !uid) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const storageRef = ref(storage, `${uid}/services/${serviceId || 'new'}/${type}/${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        return {
          url,
          name: file.name,
          description: type === 'document' ? file.name : '',
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      if (type === 'document') {
        setValue('documents', [...documents, ...uploadedFiles]);
      } else if (type === 'before') {
        setValue('beforePhotos', [...beforePhotos, ...uploadedFiles]);
      } else if (type === 'after') {
        setValue('afterPhotos', [...afterPhotos, ...uploadedFiles]);
      }

      toast.success('Arquivos enviados com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar arquivos!');
    } finally {
      setIsUploading(false);
      setUploadType(null);
    }
  };

  const handleRemoveFile = (type: 'document' | 'before' | 'after', index: number) => {
    if (type === 'document') {
      const newDocuments = documents.filter((_, i) => i !== index);
      setValue('documents', newDocuments);
    } else if (type === 'before') {
      const newPhotos = beforePhotos.filter((_, i) => i !== index);
      setValue('beforePhotos', newPhotos);
    } else if (type === 'after') {
      const newPhotos = afterPhotos.filter((_, i) => i !== index);
      setValue('afterPhotos', newPhotos);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {serviceId ? "Editar" : "Novo"} Serviço
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nome do Cliente*</Label>
            <Input {...register("name")} placeholder="Nome completo" />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label>CPF*</Label>
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

          <div>
            <Label>Data*</Label>
            <Input type="date" {...register("date")} />
            {errors.date && (
              <p className="text-red-500 text-sm">{errors.date.message}</p>
            )}
          </div>

          <div>
            <Label>Hora*</Label>
            <Input type="time" {...register("time")} />
            {errors.time && (
              <p className="text-red-500 text-sm">{errors.time.message}</p>
            )}
          </div>

          <div>
            <Label>Valor Total*</Label>
            <Input 
              {...register("price")} 
              placeholder="Valor"
              onChange={(e) => setValue("price", currencyMask(e.target.value))}
            />
            {errors.price && (
              <p className="text-red-500 text-sm">{errors.price.message}</p>
            )}
          </div>

          <div>
            <Label>Duração</Label>
            <Input {...register("duration")} placeholder="Duração do serviço" />
            {errors.duration && (
              <p className="text-red-500 text-sm">{errors.duration.message}</p>
            )}
          </div>

          <div>
            <Label>Prioridade</Label>
            <Input {...register("priority")} placeholder="Prioridade" />
            {errors.priority && (
              <p className="text-red-500 text-sm">{errors.priority.message}</p>
            )}
          </div>
        </div>

        <div>
          <Label>Observações</Label>
          <Textarea 
            {...register("observations")} 
            placeholder="Observações sobre o serviço"
            className="min-h-[100px]"
          />
          {errors.observations && (
            <p className="text-red-500 text-sm">{errors.observations.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="budget"
            checked={budget}
            onCheckedChange={(checked) => setValue("budget", checked)}
          />
          <Label htmlFor="budget">Orçamento</Label>
        </div>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Serviços Selecionados</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowServicesModal(true)}
            >
              Adicionar Serviço
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            {services.map((service) => (
              <ItemService
                key={service.id}
                id={service.id}
                code={service.code}
                name={service.name}
                price={service.price}
                onRemove={handleRemoveService}
              />
            ))}
          </ScrollArea>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Profissionais Responsáveis</h3>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowProfessionalsModal(true)}
            >
              Adicionar Profissional
            </Button>
          </div>
          <ScrollArea className="h-[200px]">
            {professionals.map((professional) => (
              <ItemProfessional
                key={professional.id}
                id={professional.id}
                name={professional.name}
                specialty={professional.specialty}
                onRemove={handleRemoveProfessional}
              />
            ))}
          </ScrollArea>
        </Card>

        <Card className="p-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Documentos</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadType('document')}
                disabled={isUploading}
              >
                Adicionar Documentos
              </Button>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, 'document')}
                ref={(el) => {
                  if (el && uploadType === 'document') {
                    el.click();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center space-x-2">
                    <FileIcon className="h-5 w-5" />
                    <span>{doc.name}</span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveFile('document', index)}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Fotos Antes</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadType('before')}
                disabled={isUploading}
              >
                Adicionar Fotos Antes
              </Button>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, 'before')}
                ref={(el) => {
                  if (el && uploadType === 'before') {
                    el.click();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {beforePhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Foto antes ${index + 1}`}
                    className="w-full h-48 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveFile('before', index)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-4 mt-4">
          <h3 className="text-lg font-medium mb-4">Fotos Depois</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUploadType('after')}
                disabled={isUploading}
              >
                Adicionar Fotos Depois
              </Button>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files, 'after')}
                ref={(el) => {
                  if (el && uploadType === 'after') {
                    el.click();
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {afterPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo.url}
                    alt={`Foto depois ${index + 1}`}
                    className="w-full h-48 object-cover rounded"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveFile('after', index)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex flex-row justify-between align-center">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
          <Button onClick={() => router.back()} variant="outline">
            Voltar
          </Button>
        </div>
      </form>

      <CustomModalServices
        visible={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        onConfirm={(selectedItems) => {
          const currentServices = services || [];
          const newServices = selectedItems
            .map(id => {
              const service = services.find(s => s.id === id);
              return service;
            })
            .filter((service): service is NonNullable<typeof service> => service !== undefined);
          setValue("services", [...currentServices, ...newServices]);
          setShowServicesModal(false);
        }}
        title="Selecione os serviços"
      />

      <CustomModalProfessionals
        visible={showProfessionalsModal}
        onClose={() => setShowProfessionalsModal(false)}
        onConfirm={(selectedItems) => {
          const currentProfessionals = professionals || [];
          const newProfessionals = selectedItems
            .map(id => {
              const professional = professionals.find(p => p.id === id);
              return professional;
            })
            .filter((professional): professional is NonNullable<typeof professional> => professional !== undefined);
          setValue("professionals", [...currentProfessionals, ...newProfessionals]);
          setShowProfessionalsModal(false);
        }}
        title="Selecione os profissionais"
      />
    </div>
  );
} 