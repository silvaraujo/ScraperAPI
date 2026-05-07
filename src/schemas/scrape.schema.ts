import { z } from 'zod';

export const scrapeRunRequestSchema = z.object({
  target: z.enum(['test-sites', 'ecommerce']),
  limit: z.number().int().min(1).max(50).optional().default(10),
  headless: z.boolean().optional().default(true),
});

export const scrapeEcommerceQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  headless: z.enum(['true', 'false']).optional().transform((v) => v === 'true').default('true'),
});

export type ScrapeRunRequest = z.infer<typeof scrapeRunRequestSchema>;
export type ScrapeEcommerceQuery = z.infer<typeof scrapeEcommerceQuerySchema>;
