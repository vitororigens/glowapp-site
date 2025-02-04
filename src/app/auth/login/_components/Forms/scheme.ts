import { z } from 'zod';

export interface FormData {
  email: string;
  password: string;
}

export const defaultValues: FormData = {
    email: '',
    password: '',
};


export const schema = z.object({
  email: z.string().min(1, "O email é obrigatório."),
  password: z.string().min(1, "A senha é obrigatório."),
});
