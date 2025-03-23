"use client";

import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/Input";
import {
    Container,
    Content,
    Divider,
    InputObservation,
    Icon,
    ContainerIcon,
    IconPlus,
    ContainerImage,
    TextError,
    InputWrapper,
    ImageContainer
} from "./styles";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { database, storage } from "../../../../../services/firebase";  
import { doc, setDoc, collection, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { toast } from "react-toastify";
import { applyPhoneMask, celularMask, celularUnMask, cnpjMask, cnpjUnMask, cpfMask, phoneUnMask,  } from "../../../../../utils/maks/masks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthContext } from "@/context/AuthContext";
import Image from "next/image";
import { Label } from "@/components/ui/label";

const formSchema = z
    .object({
        name: z
            .string()
            .min(1, "O nome é obrigatório.")
            .refine(
                (value) => {
                    return value.trim().split(" ").length >= 2;
                },
                {
                    message: "O nome completo deve conter pelo menos um sobrenome.",
                }
            ),
        phone: z
            .string()
            .min(1, "O telefone é obrigatório.")
            .refine((value) => /^[0-9]{10,11}$/.test(value), {
                message: "O telefone deve ser válido e conter 10 ou 11 dígitos.",
            }),
        email: z
            .string()
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

export default function NewProfessional() {
    const [isLoading, setIsLoading] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const { user } = useAuthContext();
    const uid = user?.uid;
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);


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
        if (selectedItemId) {
            const docRef = doc(database, "Profissionals", selectedItemId);
            getDoc(docRef).then((docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data) {
                        setValue("name", data.name);
                        setValue(
                            "cpfCnpj",
                            data.cpfCnpj?.length > 11
                                ? cnpjMask(data.cpfCnpj)
                                : cpfMask(data.cpfCnpj || "")
                        );
                        setValue("phone", celularMask(data.phone || ""));
                        setValue("email", data.email);
                        setValue("observations", data.observations);
                        setValue("adress", data.adress);
                        setValue("registrationNumber", data.registrationNumber);
                        setValue("specialty", data.specialty);
                        setImage(data.imageUrl);
                    }
                }
            });
        }
    }, [selectedItemId]);

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

    const handleSaveForm = async (data: FormSchemaType) => {
        try {
          let imageUrl = "";
          if (file) {
            imageUrl = await uploadImage(file);
          }
    
          // Lógica para salvar no Firestore
          const sanitizedData = { ...data };
          Object.keys(sanitizedData).forEach((key) => {
            if (sanitizedData[key as keyof FormSchemaType] === undefined) {
              delete sanitizedData[key as keyof FormSchemaType];
            }
          });
    
          const docRef = selectedItemId
            ? doc(database, "Profissionals", selectedItemId)
            : doc(collection(database, "Profissionals"));
    
          await setDoc(docRef, {
            ...sanitizedData,
            cpfCnpj: data.cpfCnpj ? cnpjUnMask(data.cpfCnpj) : "",
            phone: celularUnMask(data.phone || ""),
            uid,
            ...(imageUrl && { imageUrl }),
          });
    
          toast.success(selectedItemId ? "Profissional Atualizado!" : "Profissional adicionado!");
          setImage(null);
          setFile(null);
        } catch (error) {
          console.error("Erro ao criar/atualizar profissional: ", error);
          toast.error("Erro ao criar/atualizar profissional!");
        }
      };

    return (
        <Container>

        <div className="flex items-center justify-between" style={{ marginBottom: "30px" }}>
            <h1 className="text-3xl font-bold">Adicionar Profissionais</h1>
        </div>


            <ImageContainer onClick={() => document.getElementById("fileInput")?.click()}>
                {image ? (
                    <ContainerImage src={image} alt="Imagem do Profissional" />
                ) : (
                <label htmlFor="fileInput" style={{ cursor: "pointer" }}>
                    <ContainerIcon>
                        <Icon name="user-circle" />
                        <IconPlus name="plus-circle" />
                    </ContainerIcon>
                </label>
                )}
                <label htmlFor="fileInput" style={{ display: "none" }}>Upload Image</label>
                <input id="fileInput" type="file" accept="image/*" onChange={pickImage} title="Upload Image" placeholder="Choose an image" className="hidden-input" />
            </ImageContainer>
            <Content>
              <InputWrapper>
                <Label>Nome*</Label>
                <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, value } }) => (
                        <Input
                            type="PRIMARY"
                            name="user"
                            value={value}
                            onChange={onChange}
                            placeholder="Nome completo"
                        />
                    )}
                />
                {errors.name && <TextError>{errors.name.message}</TextError>}
              </InputWrapper>

              <InputWrapper>
              <Label>CPF/CNPJ*</Label>
                <Controller
                    control={control}
                    name="cpfCnpj"
                    render={({ field: { onChange, value } }) => (
                        <Input
                          
                            type="TERTIARY"
                            name="id-badge"
                          
                            onChange={(text) => onChange(formatCpfCnpj(text))} 
                            value={formatCpfCnpj(value || "")}
                            editable={!isLoading}
                        />
                    )}
                />
                {errors.cpfCnpj && <TextError>{errors.cpfCnpj.message}</TextError>}
              </InputWrapper>

              <InputWrapper>
              <Label>Telefone*</Label>
                <Controller
                    control={control}
                    name="phone"
                    render={({ field: { onChange, value } }) => (
                        <Input
                            type="TERTIARY"
                            name="phone"
                            value={applyPhoneMask(value)}
                            onChange={(text) => onChange(phoneUnMask(text))}
                    
                          
                        />
                    )}
                />
                {errors.phone && <TextError>{errors.phone.message}</TextError>}
              </InputWrapper>

        <InputWrapper>
            <Label>Email*</Label>
                <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                        <Input
                            type="TERTIARY"
                            name="envelope"
                            onChange={onChange}
                            value={value || ""}
                            editable={!isLoading}
                        />
                    )}
                />
                {errors.email && <TextError>{errors.email.message}</TextError>}
         </InputWrapper>
       

              <InputWrapper>
              <Label>Número de registro</Label>
                <Controller
                    control={control}
                    name="registrationNumber"
                    render={({ field: { onChange, value } }) => (
                        <Input
                            type="TERTIARY"
                            name="id-card" 
                            onChange={onChange}
                            value={value ?? ""}
                        />
                    )}
                />
              </InputWrapper>

              <InputWrapper>
                <Label>Especialidade</Label>
                <Controller
                    control={control}
                    name="specialty"
                    render={({ field: { onChange, value } }) => (
                        <Input
                            type="SECONDARY"
                            name="user-md"
                            onChange={onChange}
                            value={value || ""}
                        />
                    )}
                />
              </InputWrapper>
            </Content>
            <Divider />
            <Content>
             <InputWrapper>
                <Controller
                    control={control}
                    name="observations"
                    render={({ field: { onChange, onBlur, value } }) => (
                        <InputObservation
                            placeholder="Observações"
                            onBlur={onBlur}
                            onChange={onChange}
                            value={value}
                        />
                    )}
                />
             </InputWrapper>
            </Content>
            <Button
                onClick={handleSubmit(handleSaveForm)}
                disabled={isLoading}>
                    {isLoading ? "Salvando..." : "Salvar"}
            </Button>
        </Container>
    );
}
