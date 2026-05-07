import { z } from 'zod';

export const smokeTestRequestSchema = z.object({
  target: z.enum(['test-sites', 'ecommerce']),
  headless: z.boolean().optional().default(true),
});

export type SmokeTestRequest = z.infer<typeof smokeTestRequestSchema>;
