import { HttpClient } from "@/core/http-client";
import { Experiment, ExperimentsResp, User, VariantResp } from "@/types";
import { HttpClientConfig } from "@/types/http";

export class ApiClient {
  private httpClient: HttpClient;

  constructor(httpClientConfig: HttpClientConfig) {
    this.httpClient = new HttpClient(httpClientConfig);
  }

  public async identifyUser(user: Omit<User, "id">) {
    return this.httpClient.request<User>({
      method: "POST",
      url: "api/users/identify",
      data: user,
    });
  }

  public async getVariant(props: {
    experimentKey: Experiment["key"];
    user: Omit<User, "id">;
  }) {
    return this.httpClient.request<VariantResp>({
      method: "GET",
      url: `api/experiments/${props.experimentKey}/variant`,
      params: props.user,
    });
  }

  public async getExperiments(user: Omit<User, "id">) {
    return this.httpClient.request<ExperimentsResp[]>({
      method: "GET",
      url: "api/experiments",
      params: user,
    });
  }
}
