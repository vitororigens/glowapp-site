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
import { doc, getDoc, setDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore";
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
import { Plus, Trash2 } from "lucide-react";
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
  payments: z.array(z.object({
    method: z.enum(["dinheiro", "pix", "cartao", "boleto"]),
    value: z.string().min(1, "Valor é obrigatório"),
    date: z.string().min(1, "Data é obrigatória"),
    installments: z.number().optional(),
    status: z.enum(["pendente", "pago"]).default("pendente"),
  })).default([]),
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
  const [currentPaymentIndex, setCurrentPaymentIndex] = useState(-1);
  const { user } = useAuthContext();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('id');
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showProfessionalsModal, setShowProfessionalsModal] = useState(false);
  const [uploadType, setUploadType] = useState<'document' | 'before' | 'after' | null>(null);
  const [newPayment, setNewPayment] = useState({
    method: "dinheiro" as "dinheiro" | "pix" | "cartao" | "boleto",
    value: "",
    date: new Date().toISOString().split('T')[0],
    installments: 1 as number | undefined,
    status: "pendente" as "pendente" | "pago"
  });

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
      payments: [],
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
  const payments = watch("payments") || [];
  const totalPrice = watch("price") ? Number(watch("price").replace(/\D/g, '')) : 0;

  const totalPaid = payments.reduce((acc, payment) => {
    return acc + Number(payment.value.replace(/\D/g, ''));
  }, 0);

  const remainingAmount = totalPrice - totalPaid;

  useEffect(() => {
    if (serviceId) {
      const docRef = doc(database, "Services", serviceId);
      getDoc(docRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log("Dados carregados do serviço:", data);
          if (data) {
            console.log("Pagamentos carregados:", data.payments);
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
              payments: data.payments ? data.payments.map((p: any) => ({
                method: p.method,
                value: currencyMask(String(p.value || 0)),
                date: p.date,
                installments: p.installments || undefined,
                status: p.status || "pendente"
              })) : [],
              documents: data.documents || [],
              beforePhotos: data.beforePhotos || [],
              afterPhotos: data.afterPhotos || [],
            });
            console.log("Formulário resetado com os dados carregados.");
          }
        }
      });
    }
  }, [serviceId, reset]);

  const onSubmit = async (data: FormSchemaType) => {
    console.log("onSubmit function called", data);
    if (!uid) {
      console.error("UID não encontrado");
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log("Iniciando processamento...");
      
      // Verificar se o cliente já existe e criar se não existir
      const clientName = data.name.trim();
      const clientCpf = cpfUnMask(data.cpf);
      const clientPhone = celularUnMask(data.phone);
      
      if (clientName && (clientCpf || clientPhone)) {
        // Busca para verificar se o cliente já existe
        const contactsRef = collection(database, "Contacts");
        
        // Primeiro tenta buscar por CPF
        let clientExists = false;
        
        if (clientCpf) {
          const cpfQuery = query(contactsRef, where("cpf", "==", clientCpf));
          const cpfSnapshot = await getDocs(cpfQuery);
          
          if (!cpfSnapshot.empty) {
            clientExists = true;
            console.log("Cliente encontrado pelo CPF");
          }
        }
        
        // Se não encontrou por CPF, tenta por telefone
        if (!clientExists && clientPhone) {
          const phoneQuery = query(contactsRef, where("phone", "==", clientPhone));
          const phoneSnapshot = await getDocs(phoneQuery);
          
          if (!phoneSnapshot.empty) {
            clientExists = true;
            console.log("Cliente encontrado pelo telefone");
          }
        }
        
        // Se não encontrou por telefone, tenta por nome exato
        if (!clientExists && clientName) {
          const nameQuery = query(contactsRef, where("name", "==", clientName));
          const nameSnapshot = await getDocs(nameQuery);
          
          if (!nameSnapshot.empty) {
            clientExists = true;
            console.log("Cliente encontrado pelo nome");
            
            // Se encontrou pelo nome mas os dados estão diferentes, atualiza o registro
            const existingClientDoc = nameSnapshot.docs[0];
            const existingClientData = existingClientDoc.data();
            let needsUpdate = false;
            
            // Verificar se precisa atualizar o CPF ou telefone
            if (clientCpf && !existingClientData.cpf) {
              needsUpdate = true;
            }
            
            if (clientPhone && !existingClientData.phone) {
              needsUpdate = true;
            }
            
            if (data.email && !existingClientData.email) {
              needsUpdate = true;
            }
            
            // Se precisa atualizar, completa os dados do cliente
            if (needsUpdate) {
              try {
                await updateDoc(existingClientDoc.ref, {
                  cpf: clientCpf || existingClientData.cpf || "",
                  phone: clientPhone || existingClientData.phone || "",
                  email: data.email || existingClientData.email || "",
                  updatedAt: new Date().toISOString()
                });
                console.log("Dados do cliente atualizados");
                toast.info("Dados do cliente atualizados", {
                  position: "top-center",
                  autoClose: 2000,
                });
              } catch (error) {
                console.error("Erro ao atualizar dados do cliente:", error);
              }
            }
          }
        }
        
        // Se não encontrou de nenhuma forma, cria um novo
        if (!clientExists) {
          console.log("Cliente não encontrado. Criando novo cliente...");
          const newContactRef = doc(collection(database, "Contacts"));
          
          const newContactData = {
            name: clientName,
            cpf: clientCpf,
            phone: clientPhone,
            email: data.email || "",
            uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          try {
            await setDoc(newContactRef, newContactData);
            console.log("Novo cliente criado com ID:", newContactRef.id);
            toast.info("Novo cliente adicionado ao sistema", {
              position: "top-center",
              autoClose: 3000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          } catch (error: any) {
            console.error("Erro ao criar cliente:", error);
            toast.error("Não foi possível adicionar o cliente automaticamente, mas o serviço será salvo", {
              position: "top-center",
              autoClose: 5000,
            });
          }
        } else {
          console.log("Cliente já existe, não é necessário criar.");
        }
      }
      
      // Processar pagamentos de forma segura
      const processedPayments = data.payments ? data.payments.map(payment => {
        // Primeiro converter o valor para número
        const numericValue = typeof payment.value === 'string' 
          ? Number(payment.value.replace(/\D/g, ''))
          : Number(payment.value);
        
        // Retornar o objeto de pagamento processado
        return {
          method: payment.method,
          value: numericValue,
          date: payment.date,
          installments: payment.installments || null,
          status: payment.status // Preservar o status exatamente como está
        };
      }) : [];

      console.log("Pagamentos processados:", processedPayments);
      
      // Calcular o valor total pago (apenas pagamentos com status "pago")
      const paidAmount = processedPayments
        .filter(payment => payment.status === 'pago')
        .reduce((sum, payment) => sum + payment.value, 0);
      
      // Converte o preço
      const price = Number(data.price.replace(/\D/g, ''));
      
      if (serviceId) {
        console.log("Editando serviço existente:", serviceId);
        console.log("Payments antes do processamento:", data.payments);
        
        // Referência ao documento
        const serviceRef = doc(database, "Services", serviceId);
        
        // Extrair dados completos para atualização
        const updateData = {
          name: data.name,
          cpf: cpfUnMask(data.cpf),
          phone: celularUnMask(data.phone),
          email: data.email || "",
          date: data.date,
          time: data.time,
          price: price,
          paidAmount: paidAmount, // Valor pago
          pendingAmount: price - paidAmount, // Valor pendente
          priority: data.priority || "",
          duration: data.duration || "",
          observations: data.observations || "",
          services: data.services || [],
          professionals: data.professionals || [],
          budget: data.budget || false,
          payments: processedPayments, // Importante: todos os pagamentos processados
          documents: data.documents || [],
          beforePhotos: data.beforePhotos || [],
          afterPhotos: data.afterPhotos || [],
          updatedAt: new Date().toISOString()
        };
        
        console.log("Dados completos para atualização:", updateData);
        console.log("Pagamentos processados para atualização:", processedPayments);
        
        try {
          // Tenta atualizar
          await updateDoc(serviceRef, updateData);
          console.log("Atualização concluída com sucesso");
          
          // Mostrar todas as notificações na tela claramente, com atraso entre elas
          toast.success("Serviço atualizado com sucesso!", {
            position: "top-center",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          
          // Recarregar os dados do serviço para confirmar que as alterações foram aplicadas
          const updatedDoc = await getDoc(serviceRef);
          if (updatedDoc.exists()) {
            console.log("Dados atualizados confirmados:", updatedDoc.data());
            console.log("Pagamentos após atualização:", updatedDoc.data().payments);
          }
          
          // Redirecionar após um tempo
          setTimeout(() => {
            console.log("Redirecionando...");
            router.back();
          }, 2000);
        } catch (error: any) {
          console.error("Erro específico na atualização:", error);
          toast.error("Erro ao atualizar: " + (error.message || "Desconhecido"), {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
          setIsLoading(false);
        }
      } else {
        console.log("Criando novo serviço");
        
        // Dados completos para novos documentos
        const newServiceData = {
          name: data.name,
          cpf: cpfUnMask(data.cpf),
          phone: celularUnMask(data.phone),
          email: data.email || "",
          date: data.date,
          time: data.time,
          price: price,
          paidAmount: paidAmount, // Adicionando o valor pago
          pendingAmount: price - paidAmount, // Adicionando o valor pendente
          priority: data.priority || "",
          duration: data.duration || "",
          observations: data.observations || "",
          services: data.services || [],
          professionals: data.professionals || [],
          budget: data.budget || false,
          payments: processedPayments,
          documents: data.documents || [],
          beforePhotos: data.beforePhotos || [],
          afterPhotos: data.afterPhotos || [],
          uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Cria novo doc
        const newServiceRef = doc(collection(database, "Services"));
        await setDoc(newServiceRef, newServiceData);
        
        toast.success("Serviço adicionado!");
        setTimeout(() => router.back(), 1000);
      }
    } catch (error: any) {
      console.error("Erro ao processar:", error);
      toast.error("Erro: " + (error.message || "Desconhecido"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveService = (id: string) => {
    const updatedServices = services.filter(item => item.id !== id);
    setValue("services", updatedServices);
    
    // Recalcular o valor total após remover o serviço
    const total = updatedServices.reduce((sum, service) => {
      const servicePrice = typeof service.price === 'string' 
        ? Number(service.price.replace(/\D/g, ''))
        : Number(service.price);
      return sum + servicePrice;
    }, 0);
    
    // Atualizar o valor total do serviço
    setValue("price", currencyMask(total.toString()));
    
    // Verificar se os pagamentos existentes excedem o novo valor total
    const currentTotalPaid = payments.reduce((acc, payment) => {
      return acc + Number(payment.value.replace(/\D/g, ''));
    }, 0);
    
    // Se o valor dos pagamentos exceder o novo valor total, ajustar os pagamentos
    if (currentTotalPaid > total && payments.length > 0) {
      toast.warning('O valor total foi reduzido. Verifique as formas de pagamento.');
    }
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

  const handlePaymentMethodChange = (value: "dinheiro" | "pix" | "cartao" | "boleto") => {
    setNewPayment({
      ...newPayment,
      method: value,
      installments: value === "cartao" ? 1 : undefined
    });
    
    if (value === "cartao") {
      setShowInstallmentsModal(true);
    }
  };

  const handleInstallmentsSelect = (installments: number) => {
    setNewPayment({
      ...newPayment,
      installments: installments
    });
    setShowInstallmentsModal(false);
  };

  const handleEditPayment = (index: number) => {
    const payment = payments[index];
    console.log("Editando pagamento:", payment);
    
    // Certifica-se de preservar o status exato
    setNewPayment({
      method: payment.method,
      value: payment.value,
      date: payment.date,
      installments: payment.installments || 1,
      status: payment.status
    });
    
    console.log("NewPayment definido para edição:", {
      method: payment.method,
      value: payment.value,
      date: payment.date,
      installments: payment.installments || 1,
      status: payment.status
    });
    
    setCurrentPaymentIndex(index);
  };

  const handleAddPayment = () => {
    if (!newPayment.value) {
      toast.error("Informe o valor do pagamento");
      return;
    }

    const value = Number(newPayment.value.replace(/\D/g, ''));
    
    if (value <= 0) {
      toast.error("O valor do pagamento deve ser maior que zero");
      return;
    }

    // Calcular o total pago, excluindo o valor do pagamento que está sendo editado
    let adjustedTotalPaid = totalPaid;
    
    if (currentPaymentIndex !== -1) {
      // Se estiver editando, remove o valor anterior deste pagamento do total
      const oldPaymentValue = Number(payments[currentPaymentIndex].value.replace(/\D/g, ''));
      adjustedTotalPaid = adjustedTotalPaid - oldPaymentValue;
    }
    
    // Agora verifica se o novo valor total excederia o preço do serviço
    if (adjustedTotalPaid + value > totalPrice) {
      toast.error(`O valor total dos pagamentos (${currencyMask((adjustedTotalPaid + value).toString())}) não pode exceder o valor do serviço (${currencyMask(totalPrice.toString())})`);
      return;
    }

    const formattedValue = currencyMask(newPayment.value);
    
    console.log("Adicionando pagamento:", {
      ...newPayment,
      value: formattedValue
    });
    
    if (currentPaymentIndex === -1) {
      // Adicionar novo pagamento
      setValue("payments", [
        ...payments, 
        {
          ...newPayment,
          value: formattedValue
        }
      ]);
      console.log("Novo pagamento adicionado com status:", newPayment.status);
    } else {
      // Atualizar pagamento existente
      const updatedPayments = [...payments];
      updatedPayments[currentPaymentIndex] = {
        ...newPayment,
        value: formattedValue
      };
      setValue("payments", updatedPayments);
      console.log("Pagamento atualizado no índice", currentPaymentIndex, "com status:", newPayment.status);
      setCurrentPaymentIndex(-1);
    }

    // Resetar o novo pagamento
    setNewPayment({
      method: "dinheiro",
      value: "",
      date: new Date().toISOString().split('T')[0],
      installments: 1 as number | undefined,
      status: "pendente"
    });
  };

  const handleRemovePayment = (index: number) => {
    const updatedPayments = [...payments];
    updatedPayments.splice(index, 1);
    setValue("payments", updatedPayments);
  };

  // Monitorar mudanças no preço total para validar pagamentos
  useEffect(() => {
    if (totalPrice > 0 && totalPaid > totalPrice) {
      toast.warning('O valor dos pagamentos excede o valor total do serviço. Por favor, ajuste os valores.');
      
      // Se o usuário já tinha pagamentos registrados, mostrar um alerta mais detalhado
      if (payments.length > 1) {
        toast.info(`Valor total do serviço: ${currencyMask(totalPrice.toString())}, Total já registrado em pagamentos: ${currencyMask(totalPaid.toString())}`);
      }
    }
  }, [totalPrice, totalPaid, payments.length]);

  // Função para verificar e limpar pagamentos inválidos
  const validatePayments = () => {
    if (totalPaid > totalPrice && payments.length > 0) {
      // Opção 1: Limpar todos os pagamentos
      if (window.confirm('Os pagamentos registrados excedem o valor total do serviço. Deseja limpar todos os pagamentos?')) {
        setValue('payments', []);
        toast.success('Pagamentos limpos. Você pode registrar novos pagamentos agora.');
      }
    }
  };

  // Adicionar botão para validar/limpar pagamentos
  const renderPaymentWarning = () => {
    if (totalPaid > totalPrice && payments.length > 0) {
      return (
        <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-2">
          <p className="text-sm text-yellow-700">
            Pagamentos excedem o valor total do serviço.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={validatePayments}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            Limpar Pagamentos
          </Button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-full mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-xl font-bold mb-4">
        {serviceId ? "Editar" : "Novo"} Serviço
      </h2>

      <form 
        onSubmit={handleSubmit((data) => {
          console.log("Form submitted with data:", data);
          console.log("Pagamentos no submit:", data.payments);
          
          // Verificação de segurança para garantir preservação de status
          if (data.payments && data.payments.length > 0) {
            data.payments.forEach((payment, index) => {
              console.log(`Pagamento ${index} - Status: ${payment.status}, Valor: ${payment.value}`);
            });
          }
          
          onSubmit(data);
        })} 
        className="space-y-4"
      >
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
            <Input 
              type="time"
              {...register("duration")} 
              placeholder="Duração do serviço"
            />
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

        <Card className="p-4">
          <h3 className="text-lg font-medium mb-2">Formas de Pagamento</h3>
          
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>Valor total do serviço:</span>
              <span className="font-semibold">{currencyMask(totalPrice.toString())}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span>Total pago:</span>
              <span className="font-semibold text-green-600">
                {currencyMask(payments.filter(p => p.status === "pago").reduce((acc, p) => acc + Number(p.value.replace(/\D/g, '')), 0).toString())}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span>Total pendente:</span>
              <span className="font-semibold text-orange-500">
                {currencyMask(payments.filter(p => p.status === "pendente").reduce((acc, p) => acc + Number(p.value.replace(/\D/g, '')), 0).toString())}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Restante a pagar:</span>
              <span className={`font-semibold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {currencyMask(remainingAmount.toString())}
              </span>
            </div>
          </div>

          {renderPaymentWarning()}

          <div className="space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Método de Pagamento</Label>
                <RadioGroup
                  value={newPayment.method}
                  onValueChange={(value) => handlePaymentMethodChange(value as "dinheiro" | "pix" | "cartao" | "boleto")}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dinheiro" id="method-dinheiro" />
                    <Label htmlFor="method-dinheiro">Dinheiro</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pix" id="method-pix" />
                    <Label htmlFor="method-pix">PIX</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cartao" id="method-cartao" />
                    <Label htmlFor="method-cartao">Cartão</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="boleto" id="method-boleto" />
                    <Label htmlFor="method-boleto">Boleto</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={newPayment.date}
                  onChange={(e) => setNewPayment({...newPayment, date: e.target.value})}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Valor</Label>
                <Input
                  placeholder="Valor do pagamento"
                  value={newPayment.value}
                  onChange={(e) => setNewPayment({...newPayment, value: currencyMask(e.target.value)})}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Status</Label>
                <RadioGroup
                  value={newPayment.status}
                  onValueChange={(value) => {
                    console.log("Status alterado para:", value);
                    setNewPayment({...newPayment, status: value as "pendente" | "pago"});
                  }}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pendente" id="status-pendente" />
                    <Label htmlFor="status-pendente" className="text-orange-500 font-medium">Pendente</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pago" id="status-pago" />
                    <Label htmlFor="status-pago" className="text-green-600 font-medium">Pago</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {newPayment.method === "cartao" && newPayment.installments && (
              <div className="mt-2 text-sm text-gray-600">
                Parcelado em {newPayment.installments}x
              </div>
            )}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAddPayment}
                disabled={!newPayment.value || Number(newPayment.value.replace(/\D/g, '')) <= 0}
              >
                {currentPaymentIndex === -1 ? "Adicionar Pagamento" : "Atualizar Pagamento"}
              </Button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Pagamentos Registrados</h4>
            {payments.length === 0 ? (
              <p className="text-gray-500 italic">Nenhum pagamento registrado</p>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-md ${payment.status === "pago" ? "bg-green-50 border-green-100 border" : "bg-orange-50 border-orange-100 border"}`}>
                    <div>
                      <div className="font-medium">
                        {payment.method === "dinheiro" 
                          ? "Dinheiro" 
                          : payment.method === "pix" 
                          ? "PIX"
                          : payment.method === "boleto"
                          ? "Boleto"
                          : `Cartão ${payment.installments ? `${payment.installments}x` : ""}`}
                      </div>
                      <div className="text-sm">
                        {payment.date} - {payment.value} - 
                        <span className={payment.status === "pago" ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
                          {payment.status === "pago" ? " Pago" : " Pendente"}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditPayment(index)}
                      >
                        Editar
                      </Button>
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleRemovePayment(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

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
          <Button 
            type="submit" 
            disabled={isLoading}
            className={isLoading ? "bg-gray-400" : ""}
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </div>
            ) : (
              "Salvar"
            )}
          </Button>
          <Button 
            type="button" 
            onClick={(e) => {
              e.preventDefault();
              router.back();
            }} 
            variant="outline"
            disabled={isLoading}
          >
            Voltar
          </Button>
        </div>
      </form>

      <CustomModalServices
        visible={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        onConfirm={(selectedItems) => {
          const currentServices = services || [];
          const existingIds = currentServices.map(s => s.id);
          const newServices = selectedItems.filter(id => !existingIds.includes(id));
          
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

              const updatedServices = [...currentServices, ...selectedServices];
              setValue("services", updatedServices);

              const total = updatedServices.reduce((sum, service) => {
                const price = typeof service.price === 'string' 
                  ? Number(service.price.replace(/\D/g, ''))
                  : Number(service.price);
                return sum + price;
              }, 0);

              setValue("price", currencyMask(total.toString()));
              
              if (total < totalPaid && payments.length > 0) {
                toast.warning('O valor total foi atualizado, mas os pagamentos registrados excedem o novo valor.');
              }
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
          const existingIds = currentProfessionals.map(p => p.id);
          const newProfessionals = selectedItems.filter(id => !existingIds.includes(id));
          
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