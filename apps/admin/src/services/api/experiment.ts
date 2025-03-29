import { axiosInstance } from "@/services/api/api.ts";
import { z } from "zod";
import {
  createExperimentSchema,
  type Experiment,
  experimentStatsRespSchema,
  updateExperimentSchema,
} from "@/schemas/experiment.ts";
import {
  bulkEditVariantsRespSchema,
  bulkEditVariantsSchema,
} from "@/schemas/variant.ts";

class ExperimentAPI {
  private api = axiosInstance("experiments");

  createExperiment = async (props: z.infer<typeof createExperimentSchema>) => {
    const data = createExperimentSchema.parse(props);
    const response = await this.api.post<Experiment>("/", data);
    return response.data;
  };

  updateExperiment = async (props: {
    id: Experiment["id"];
    data: z.infer<typeof updateExperimentSchema>;
  }) => {
    const data = updateExperimentSchema.parse(props.data);
    const response = await this.api.put<Experiment>(`/${props.id}/`, data);
    return response.data;
  };

  deleteExperiment = async (id: Experiment["id"]) => {
    const response = await this.api.delete(`/${id}/`);
    return response.data;
  };

  experimentStats = async (id: Experiment["id"]) => {
    const response = await this.api.get<
      z.infer<typeof experimentStatsRespSchema>
    >(`/${id}/stats/`);
    return response.data;
  };

  bulkEditVariants = async (props: {
    id: Experiment["id"];
    data: z.infer<typeof bulkEditVariantsSchema>;
  }) => {
    const data = bulkEditVariantsSchema.parse(props.data);
    const response = await this.api.put<
      z.infer<typeof bulkEditVariantsRespSchema>
    >(`/${props.id}/variants/`, data);
    return response.data;
  };
}

export const experimentAPI = new ExperimentAPI();
