import { z } from 'zod';

export const createProdutoSchema = z.object({

    disponivel: z.coerce.boolean(),
    is_promocao: z.coerce.boolean(),
    preco:z.coerce.number().positive(),
    
    preco_promocao: z.preprocess(
    (val) => (val === "" || val === "null" ? undefined : val),
    z.coerce.number()
      .positive()
      .nullable()
    ).optional(),

    nome: z.string().min(1),
    descricao: z.string().min(1),
    fk_vendedor: z.uuid(), 
    id_categoria: z.uuid(),

});

export type CreateProdutoInput = z.infer<typeof createProdutoSchema>