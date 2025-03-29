import { axiosInstance } from "@/services/api/api.ts";
import { z } from "zod";
import {
  type Project,
  createOrUpdateProjectSchema,
  regenerateApiKeyRespSchema,
} from "@/schemas/projects.ts";

class ProjectsAPI {
  private api = axiosInstance("projects");

  getProjects = async () => {
    const response = await this.api.get<Project[]>("/");
    return response.data;
  };

  createProject = async (
    props: z.infer<typeof createOrUpdateProjectSchema>,
  ) => {
    const data = createOrUpdateProjectSchema.parse(props);
    const response = await this.api.post<Project>("/", data);

    return response.data;
  };

  updateProject = async (props: {
    id: Project["id"];
    data: z.infer<typeof createOrUpdateProjectSchema>;
  }) => {
    const data = createOrUpdateProjectSchema.parse(props.data);
    const response = await this.api.put<Project>(`/${props.id}/`, data);

    return response.data;
  };

  deleteProject = async (id: Project["id"]) => {
    const response = await this.api.delete(`/${id}/`);

    return response.data;
  };

  regenerateApiKey = async (id: Project["id"]) => {
    const response = await this.api.post<
      z.infer<typeof regenerateApiKeyRespSchema>
    >(`/${id}/regenerate_api_key/`);

    return response.data;
  };
}

export const projectsAPI = new ProjectsAPI();
