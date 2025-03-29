import { z } from "zod";
import { experimentSchema } from "@/schemas/experiment.ts";

export const projectSchema = z.object({
  id: z.string(),
  title: z.string().min(3).max(100),
  description: z.string().min(3).max(1000),
  api_key: z.string(),
  experiments: z.array(experimentSchema),
  created_at: z.string().date(),
  updated_at: z.string().date(),
});

export type Project = z.infer<typeof projectSchema>;

export const createOrUpdateProjectSchema = projectSchema.pick({
  title: true,
  description: true,
});

export const regenerateApiKeyRespSchema = projectSchema.pick({
  api_key: true,
});
