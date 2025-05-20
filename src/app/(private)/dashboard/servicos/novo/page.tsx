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
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";
import { z } from "zod";
import { toast } from "react-toastify";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CustomModalServices } from "@/components/CustomModalServices";
import { CustomModalProfessionals } from "@/components/CustomModalProfessionals";
import { CustomModalClients } from "@/components/CustomModalClients";
import { ItemService } from "@/components/ItemService";
import { ItemProfessional } from "@/components/ItemProfessional";
import { FileIcon } from "@/components/icons/FileIcon";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";
import { Plus } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  paymentMethod: z.enum(["dinheiro", "pix", "cartao"]).optional(),
  installments: z.number().optional(),
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
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
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
      paymentMethod: undefined,
      installments: undefined,
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
  const paymentMethod = watch("paymentMethod");

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
              paymentMethod: data.paymentMethod || undefined,
              installments: data.installments || undefined,
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
      // Primeiro verifica se o cliente já existe
      const contactsRef = collection(database, "Contacts");
      const q = query(
        contactsRef, 
        where("uid", "==", uid),
        where("cpf", "==", cpfUnMask(data.cpf))
      );
      const querySnapshot = await getDocs(q);

      // Se o cliente não existir, cria um novo
      if (querySnapshot.empty) {
        const newContactRef = doc(collection(database, "Contacts"));
        await setDoc(newContactRef, {
          name: data.name,
          cpf: cpfUnMask(data.cpf),
          phone: celularUnMask(data.phone),
          email: data.email || "",
          uid,
          createdAt: new Date().toISOString(),
        });
        toast.success("Novo cliente cadastrado!");
      }

      // Cria ou atualiza o serviço
      const docRef = serviceId
        ? doc(database, "Services", serviceId)
        : doc(collection(database, "Services"));

      // Remove caracteres não numéricos e converte para número
      const price = Number(data.price.replace(/\D/g, ''));
      
      // Dados do serviço
      const serviceData = {
        name: data.name,
        cpf: cpfUnMask(data.cpf),
        phone: celularUnMask(data.phone),
        email: data.email || "",
        date: data.date,
        time: data.time,
        price: price,
        priority: data.priority || "",
        duration: data.duration || "",
        observations: data.observations || "",
        services: data.services || [],
        professionals: data.professionals || [],
        budget: data.budget || false,
        paymentMethod: data.paymentMethod || null,
        installments: data.installments || null,
        documents: data.documents || [],
        beforePhotos: data.beforePhotos || [],
        afterPhotos: data.afterPhotos || [],
        uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(docRef, serviceData);

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

  // Função para selecionar o número de parcelas
  const handleInstallmentsSelect = (installments: number) => {
    setValue("installments", installments);
    setShowInstallmentsModal(false);
  };

  // Função para lidar com a mudança do método de pagamento
  const handlePaymentMethodChange = (value: string) => {
    setValue("paymentMethod", value as "dinheiro" | "pix" | "cartao");
    
    // Se cartão for selecionado, abre o modal de parcelas
    if (value === "cartao") {
      setShowInstallmentsModal(true);
    } else {
      // Se não for cartão, remove o valor de parcelas
      setValue("installments", undefined);
    }
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {serviceId ? "Editar" : "Novo"} Serviço
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome Completo</Label>
            <div className="flex gap-2">
              <Input
                {...register("name")}
                placeholder="Nome completo"
                className={errors.name ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowClientsModal(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {errors.name && (
              <span className="text-sm text-red-500">{errors.name.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>CPF</Label>
            <Input
              {...register("cpf")}
              placeholder="CPF"
              className={errors.cpf ? "border-red-500" : ""}
              onChange={(e) => {
                const value = e.target.value;
                setValue("cpf", cpfMask(value));
              }}
            />
            {errors.cpf && (
              <span className="text-sm text-red-500">{errors.cpf.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input
              {...register("phone")}
              placeholder="Telefone"
              className={errors.phone ? "border-red-500" : ""}
              onChange={(e) => {
                const value = e.target.value;
                setValue("phone", celularMask(value));
              }}
            />
            {errors.phone && (
              <span className="text-sm text-red-500">{errors.phone.message}</span>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              {...register("email")}
              placeholder="Email"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <span className="text-sm text-red-500">{errors.email.message}</span>
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

        {/* Método de Pagamento */}
        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <RadioGroup
            value={paymentMethod}
            onValueChange={handlePaymentMethodChange}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dinheiro" id="dinheiro" />
              <Label htmlFor="dinheiro">Dinheiro</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="pix" id="pix" />
              <Label htmlFor="pix">PIX</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cartao" id="cartao" />
              <Label htmlFor="cartao">Cartão</Label>
            </div>
          </RadioGroup>
          {paymentMethod === "cartao" && watch("installments") && (
            <div className="mt-2 text-sm text-gray-600">
              Parcelado em {watch("installments")}x
            </div>
          )}
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
          // Filtra os serviços que já existem para não duplicar
          const existingIds = currentServices.map(s => s.id);
          const newServices = selectedItems.filter(id => !existingIds.includes(id));
          
          // Busca os serviços selecionados da coleção Procedures
          const fetchSelectedServices = async () => {
            try {
              const servicesRef = collection(database, "Procedures");
              const selectedDocs = await Promise.all(
                newServices.map(id => getDoc(doc(servicesRef, id)))
              );
              
              const selectedServices = selectedDocs
                .filter(doc => doc.exists())
                .map(doc => ({
                  id: doc.id,
                  name: doc.data().name,
                  code: doc.data().code,
                  price: doc.data().price,
                  date: doc.data().date
                }));

              // Atualiza a lista de serviços
              const updatedServices = [...currentServices, ...selectedServices];
              setValue("services", updatedServices);

              // Calcula o valor total
              const total = updatedServices.reduce((sum, service) => {
                const price = typeof service.price === 'string' 
                  ? Number(service.price.replace(/\D/g, ''))
                  : Number(service.price);
                return sum + price;
              }, 0);

              // Atualiza o valor total
              setValue("price", currencyMask(total));
            } catch (error) {
              console.error("Erro ao buscar serviços selecionados:", error);
              toast.error("Erro ao adicionar serviços!");
            }
          };

          fetchSelectedServices();
          setShowServicesModal(false);
        }}
        title="Selecione os serviços"
      />

      <CustomModalProfessionals
        visible={showProfessionalsModal}
        onClose={() => setShowProfessionalsModal(false)}
        onConfirm={(selectedItems) => {
          const currentProfessionals = professionals || [];
          // Filtra os profissionais que já existem para não duplicar
          const existingIds = currentProfessionals.map(p => p.id);
          const newProfessionals = selectedItems.filter(id => !existingIds.includes(id));
          
          // Busca os profissionais selecionados da coleção Profissionals
          const fetchSelectedProfessionals = async () => {
            try {
              const professionalsRef = collection(database, "Profissionals");
              const selectedDocs = await Promise.all(
                newProfessionals.map(id => getDoc(doc(professionalsRef, id)))
              );
              
              const selectedProfessionals = selectedDocs
                .filter(doc => doc.exists())
                .map(doc => ({
                  id: doc.id,
                  name: doc.data().name,
                  specialty: doc.data().specialty
                }));

              setValue("professionals", [...currentProfessionals, ...selectedProfessionals]);
            } catch (error) {
              console.error("Erro ao buscar profissionais selecionados:", error);
              toast.error("Erro ao adicionar profissionais!");
            }
          };

          fetchSelectedProfessionals();
          setShowProfessionalsModal(false);
        }}
        title="Selecione os profissionais"
      />

      <CustomModalClients
        visible={showClientsModal}
        onClose={() => setShowClientsModal(false)}
        onSelect={(client) => {
          setValue("name", client.name);
          setValue("cpf", cpfMask(client.cpf));
          setValue("phone", celularMask(client.phone));
          if (client.email) {
            setValue("email", client.email);
          }
          setShowClientsModal(false);
        }}
        title="Selecionar Cliente"
      />

      {/* Modal de parcelas */}
      {showInstallmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Selecione o número de parcelas</h2>
              <Button variant="ghost" onClick={() => setShowInstallmentsModal(false)}>
                Fechar
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                <Button 
                  key={num} 
                  variant="outline" 
                  onClick={() => handleInstallmentsSelect(num)}
                  className="p-4"
                >
                  {num}x
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 