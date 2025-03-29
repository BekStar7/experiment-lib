import { z } from "zod";
import { variantSchema } from "@/schemas/variant.ts";

export const experimentSchema = z.object({
  id: z.string(),
  key: z.string().min(3),
  name: z.string().min(3).max(100),
  description: z.string().min(3).max(1000),
  type: z.enum(["toggle", "multiple_variant"]),
  status: z.enum(["draft", "running", "completed"]),
  variants: z.array(variantSchema),
});

export type Experiment = z.infer<typeof experimentSchema>;

export const shortExperimentSchema = experimentSchema.pick({
  id: true,
  key: true,
  name: true,
});

export const createExperimentSchema = experimentSchema
  .pick({
    key: true,
    name: true,
    description: true,
    type: true,
  })
  .extend({
    project: z.string(),
  });

export const updateExperimentSchema = createExperimentSchema
  .pick({
    key: true,
    name: true,
    description: true,
  })
  .merge(experimentSchema.pick({ status: true }))
  .partial();

export const experimentStatsRespSchema = z.object({
  experiment: shortExperimentSchema,
  stats: z.record(z.string(), z.number()),
});
