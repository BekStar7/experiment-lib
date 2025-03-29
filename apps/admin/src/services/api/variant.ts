import { axiosInstance } from "@/services/api/api.ts";
import { z } from "zod";
import { createVariantSchema, type Variant } from "@/schemas/variant.ts";

class VariantAPI {
  private api = axiosInstance("variants");

  createVariant = async (props: z.infer<typeof createVariantSchema>) => {
    const data = createVariantSchema.parse(props);
    const response = await this.api.post<Variant>("/", data);
    return response.data;
  };

  deleteVariant = async (id: Variant["id"]) => {
    const response = await this.api.delete(`/${id}/`);
    return response.data;
  };
}

export const variantAPI = new VariantAPI();
