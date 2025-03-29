import { z } from "zod";

export const variantSchema = z.object({
  id: z.string(),
  key: z.string(),
  payload: z.any(),
  rollout: z.number(),
  created_at: z.string().date(),
  updated_at: z.string().date(),
});

export type Variant = z.infer<typeof variantSchema>;

export const createVariantSchema = variantSchema
  .pick({
    key: true,
    rollout: true,
    payload: true,
  })
  .extend({
    experiment: z.string(),
  });

export const updateVariantSchema = createVariantSchema.pick({
  key: true,
  rollout: true,
  payload: true,
});

export const updateVariantWithIdSchema = updateVariantSchema.extend({
  id: variantSchema.shape.id,
});

export const bulkEditVariantsSchema = z
  .object({
    variants: z.array(updateVariantWithIdSchema),
  })
  .superRefine((data, ctx) => {
    let totalRollout = 0;
    data.variants.forEach((variant) => {
      totalRollout += variant.rollout;
    });

    if (totalRollout > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Total rollout cannot be greater than 100%",
        path: ["variants"],
      });
    }
  });

export const bulkEditVariantsRespSchema = z.object({
  experiment: z.object({
    id: z.string(),
    key: z.string(),
    name: z.string(),
  }),
  updated_variants: z.array(variantSchema),
});
