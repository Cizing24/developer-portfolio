import { z } from 'zod';

const httpsUrl = z
  .url()
  .refine((value) => value.startsWith('https://'), 'Use HTTPS');
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, 'Invalid calendar date');
export const projectFields = {
  title: z.string().min(1),
  description: z.string().min(20).max(200),
  category: z.string(),
  tags: z.array(z.string()).min(1),
  highlights: z.array(z.string()).min(1),
  status: z.enum(['已實作・隔離展示', '持續開發']),
  visibility: z.enum(['public', 'private']),
  repository: httpsUrl.optional(),
  demo: httpsUrl.optional(),
  featured: z.boolean().default(false),
  order: z.number().int(),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  reviewedAt: dateOnly,
  coverAlt: z.string().min(10),
};
export const projectSchema = z
  .object(projectFields)
  .superRefine((data, ctx) => {
    if (data.visibility === 'private' && data.repository) {
      ctx.addIssue({
        code: 'custom',
        path: ['repository'],
        message: 'Private source must not be linked publicly',
      });
    }
  });
export const noteSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(20).max(200),
  publishedAt: dateOnly,
  category: z.string().min(1),
  tags: z.array(z.string()).min(1),
  draft: z.boolean().default(false),
});
