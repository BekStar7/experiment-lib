import type { Project } from "@/schemas/projects.ts";
import React from "react";
import { CodeBlock } from "@/features/ui/code-block.tsx";
import { env } from "@/lib/env.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsAPI } from "@/services/api/projects.ts";
import { Button } from "@/features/ui/button.tsx";
import ErrorMessage from "@/features/ui/error-message.tsx";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/features/ui/tabs.tsx";
import { projectQueries } from "@/services/queries/project.ts";
import { AlertTriangle } from "lucide-react";

type ApiKeyBlockProps = {
  projectId: Project["id"];
  apiKey: Project["api_key"];
};

const ApiKeyBlock: React.FC<ApiKeyBlockProps> = ({ projectId, apiKey }) => {
  const queryClient = useQueryClient();
  const { mutate, status, error } = useMutation({
    mutationFn: projectsAPI.regenerateApiKey,
    mutationKey: ["project", "regenerate-api-key"],
    onSuccess: async (data) => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) oldData = [];
          const newData = oldData.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                api_key: data.api_key,
              };
            }
            return project;
          });

          return [...newData];
        },
      );
    },
  });

  return (
    <div>
      <h2 className="text-xl font-bold mb-3">
        How to use this project in your app?
      </h2>
      <p className="mb-2">
        Wrap your app with this code snippet and you are ready to go:
      </p>
      <Tabs defaultValue="full" className="mb-3">
        <TabsList>
          <TabsTrigger value="full">Full example</TabsTrigger>
          <TabsTrigger value="apiKey">API key</TabsTrigger>
        </TabsList>
        <TabsContent value="full">
          <CodeBlock
            code={`<ExperimentClientProvider
  apiKey="${apiKey}"
  host="${env().VITE_API_URL}"
>

</ExperimentClientProvider>`}
            language="tsx"
          />
        </TabsContent>
        <TabsContent value="apiKey">
          <CodeBlock code={apiKey} />
        </TabsContent>
      </Tabs>
      <ErrorMessage error={error?.message} className="mb-1" />
      <div className="flex items-center text-sm text-yellow-500 gap-1">
        <Button
          status={status}
          onClick={() => mutate(projectId)}
          variant="secondary"
        >
          Regenerate API key
        </Button>
        <AlertTriangle className="h-4 w-4 ml-2" />
        You will have to replace with the new API key everywhere you used it
      </div>
    </div>
  );
};

export default ApiKeyBlock;
