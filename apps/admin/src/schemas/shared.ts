import { z } from "zod";

export const tokensRespSchema = z.object({
  access: z.string(),
  refresh: z.string(),
});
