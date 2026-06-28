import { z } from "zod";

export const ConfirmAutomateSchema = z.object({
  source: z.enum(['99food', 'ifood']),
  locator: z.string({ required_error: 'O locator é obrigatório' })
    .trim()
    .length(8, 'O locator deve ter exatamente 8 caracteres')
    .regex(/^\d+$/, 'O locator deve conter apenas números'),
  orderCode: z.string({ required_error: 'O orderCode é obrigatório' })
    .trim()
    .length(4, 'O orderCode deve ter exatamente 4 caracteres')
    .regex(/^\d+$/, 'O orderCode deve conter apenas números'),
});

export type ConfirmAutomateSchemaType = z.infer<typeof ConfirmAutomateSchema>;