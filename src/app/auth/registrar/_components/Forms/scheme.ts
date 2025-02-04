/* eslint-disable @typescript-eslint/no-unused-vars */
import { z } from 'zod';

export interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

export const defaultValues: FormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
};

// Esquema de validação usando Zod
const schema = z.object({

  name: z.string()
    .min(1, "O nome é obrigatório.")
    .refine(value => value.trim().split(" ").length >= 2, {
      message: "O nome completo deve conter pelo menos um sobrenome.",
    }),
  email: z.string()
    .min(1, "O email é obrigatório.")
    .email("Formato inválido"),
  phone: z.string()
    .min(1, "O telefone é obrigatório.")
    .refine(value => /^[0-9]{10,11}$/.test(value), {
      message: "O telefone deve ser válido e conter 10 ou 11 dígitos."
    }),
  password: z.string()
    .min(6, { message: "A senha deve conter pelo menos 6 caracteres." }),
  confirmPassword: z.string().min(1, "Confirme sua senha."),
}).refine(values => values.password === values.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type ValidatedFormData = z.infer<typeof schema>;

export { schema };