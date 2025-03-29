import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_API_PREFIX: z.string().optional(),
  VITE_LIB_NAME: z.string(),
});

export const env = () => {
  return envSchema.parse(import.meta.env);
};
