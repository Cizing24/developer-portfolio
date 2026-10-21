import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { projectFields, noteSchema } from './lib/schemas';
import { z } from 'zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({ ...projectFields, cover: image() }).superRefine((data, ctx) => {
      if (data.visibility === 'private' && data.repository)
        ctx.addIssue({
          code: 'custom',
          path: ['repository'],
          message: 'Private source must not be linked publicly',
        });
    }),
});
const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: noteSchema,
});
export const collections = { projects, notes };
