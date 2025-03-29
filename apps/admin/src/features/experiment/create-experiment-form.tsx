import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/ui/form.tsx";
import { cn, formatKey } from "@/lib/utils.ts";
import { Input } from "@/features/ui/input.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import ErrorMessage from "@/features/ui/error-message.tsx";
import { Button } from "@/features/ui/button.tsx";
import { createExperimentSchema } from "@/schemas/experiment.ts";
import type { Project } from "@/schemas/projects.ts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { experimentAPI } from "@/services/api/experiment.ts";
import { projectQueries } from "@/services/queries/project.ts";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/features/ui/radio-group.tsx";
import { useNavigate } from "@tanstack/react-router";

type CreateExperimentFormProps = {
  className?: string;
  projectId: Project["id"];
  onSuccess?: () => void;
};

const CreateExperimentForm: React.FC<CreateExperimentFormProps> = ({
  className,
  projectId,
  onSuccess,
}) => {
  const form = useForm<z.infer<typeof createExperimentSchema>>({
    resolver: zodResolver(createExperimentSchema),
    defaultValues: {
      name: "",
      key: "",
      description: "",
      type: "toggle",
      project: projectId,
    },
    mode: "all",
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutate, status, error } = useMutation({
    mutationFn: experimentAPI.createExperiment,
    mutationKey: ["experiment", "create"],
    onSuccess: async (data) => {
      queryClient.setQueryData(
        projectQueries.getProjects().queryKey,
        (oldData) => {
          if (!oldData || oldData.length === 0) oldData = [];
          const newData = oldData.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                experiments: [...project.experiments, data],
              };
            }
            return project;
          });

          return [...newData];
        },
      );

      toast.success("Experiment created successfully");

      onSuccess?.();

      await navigate({
        to: "/project/$projectId/experiment/$experimentId",
        params: { projectId, experimentId: data.id },
      });
    },
  });

  const onSubmit = (data: z.infer<typeof createExperimentSchema>) =>
    mutate(data);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4 w-full", className)}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="Experiment title"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="key"
          render={({ field: { onChange, ...props } }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="Example: my_experiment"
                  onChange={(e) => onChange(formatKey(e.target.value))}
                  {...props}
                />
              </FormControl>
              <FormDescription>
                This is how you will identify your experiment in your code.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  autoComplete="off"
                  placeholder="Experiment description"
                  className="max-h-64"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Experiment type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex items-center space-x-2 w-full"
                >
                  <FormItem className="flex items-center space-y-0">
                    <FormControl>
                      <RadioGroupItem value="toggle" />
                    </FormControl>
                    <FormLabel className="font-normal">Feature flag</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-y-0">
                    <FormControl>
                      <RadioGroupItem value="multiple_variant" />
                    </FormControl>
                    <FormLabel className="font-normal">A/B/N testing</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2 mt-8">
          <ErrorMessage error={error?.message} />
          <Button
            disabled={!form.formState.isValid}
            status={status}
            type="submit"
          >
            Create experiment
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateExperimentForm;
