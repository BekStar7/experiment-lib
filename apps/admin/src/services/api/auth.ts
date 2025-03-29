import { axiosInstance } from "@/services/api/api.ts";
import { z } from "zod";
import { loginPropsSchema, loginRespSchema } from "@/schemas/auth.ts";

class AuthAPI {
  private api = axiosInstance("", false);

  login = async (props: z.infer<typeof loginPropsSchema>) => {
    const data = loginPropsSchema.parse(props);

    const response = await this.api.post<z.infer<typeof loginRespSchema>>(
      "login/",
      data,
    );
    return response.data;
  };
}

export const authAPI = new AuthAPI();
