import { z } from 'zod';

export interface FormData {
  email: string;
}

export const defaultValues: FormData = {
    email: '',
};


export const schema = z.object({
  email: z.string().min(1, "O email é obrigatório."),
});
