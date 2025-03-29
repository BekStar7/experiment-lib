import { z } from "zod";

const envSchema = z.object({
  VITE_HOST: z.string().url(),
  VITE_API_KEY: z.string(),
  VITE_FEATURE_FLAG_KEY: z.string(),
  VITE_ABN_TEST_KEY: z.string(),
});

export const env = () => {
  return envSchema.parse(import.meta.env);
};
