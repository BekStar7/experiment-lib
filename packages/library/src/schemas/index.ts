import { z } from "zod";
import { Variant } from "@/types";

export const variantSchema: z.ZodType<Variant> = z.object({
  id: z.string(),
  key: z.string(),
  payload: z.any().optional(),
});

export const storedVariantsSchema = z.record(z.string(), variantSchema);
