import { z } from "zod";
import { tokensRespSchema } from "@/schemas/shared.ts";

export const loginPropsSchema = z.object({
  username: z.string().min(1, { message: "Enter login" }),
  password: z.string().min(1, { message: "Enter password" }),
});

export const loginRespSchema = tokensRespSchema;

export const refreshPropsSchema = z.object({
  refresh: z.string(),
});

export const refreshRespSchema = tokensRespSchema.pick({
  access: true,
});
