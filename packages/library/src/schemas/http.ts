import { z } from "zod";
import { HttpClientConfig, InterceptorHeader, RetryConfig } from "@/types/http";

export const retryConfigSchema: z.ZodType<RetryConfig> = z.object({
  attempts: z.number(),
  initialDelay: z.number(),
  maxDelay: z.number(),
  shouldRetry: z.function().args(z.any()).returns(z.boolean()),
});

export const interceptorHeaderSchema: z.ZodType<InterceptorHeader> = z.object({
  key: z.string(),
  value: z.string(),
});

export const httpClientConfigSchema: z.ZodType<HttpClientConfig> = z.object({
  baseURL: z.string().url(),
  headers: z.array(interceptorHeaderSchema),
  timeout: z.number().optional(),
});
