import { z } from "zod";
import { projectSchema } from "@/schemas/projects.ts";

export const projectUserSchema = z.object({
  id: z.string(),
  project: projectSchema.shape.id,
  device_id: z.string(),
  email: z.string().email(),
  external_id: z.string(),
  first_seen: z.string().datetime(),
  last_seen: z.string().datetime(),
  properties: z.any(),
});
