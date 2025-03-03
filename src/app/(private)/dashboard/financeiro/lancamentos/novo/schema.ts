import { z } from "zod";

export const formSchema = z.object({
    category: z.string().min(1, "Categoria é obrigatória"),
    name: z.string().min(1, "Nome é obrigatório"),
    date: z.string().min(1, "Data é obrigatória"),
    time: z.string().min(1, "Hora é obrigatória"),
    value: z.string().min(1, "Valor é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    hasNotification: z.boolean().optional(),
    status: z.boolean().optional(),
    expenseType: z.boolean().optional(),
    type: z.enum(["revenue", "expense"])
});

export type FormSchemaType = z.infer<typeof formSchema>;