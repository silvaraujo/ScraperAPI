import { z } from "zod";

export const ConfirmAutomateSchema = z.object({
  source: z.enum(['99food', 'ifood']),
  locator: z.string().min(8).max(8),
  orderCode: z.string().min(4).max(4),
});

export type ConfirmAutomateSchemaType = z.infer<typeof ConfirmAutomateSchema>;