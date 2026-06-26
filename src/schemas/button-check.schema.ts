import { z } from 'zod';

export const buttonCheckRequestSchema = z.object({
  pageUrl: z.string().url('URL inválida'),
  buttonText: z.string().min(1, 'Texto do botão é obrigatório'),
});

export type ButtonCheckRequest = z.infer<typeof buttonCheckRequestSchema>;
