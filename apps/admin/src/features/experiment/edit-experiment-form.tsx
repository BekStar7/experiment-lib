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
import { cn } from "@/lib/utils.ts";
import { Input } from "@/features/ui/input.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import ErrorMessage from "@/features/ui/error-message.tsx";
import { Button } from "@/features/ui/button.tsx";
import {
  type Experiment,
  updateExperimentSchema,
} from "@/schemas/experiment.ts";
import type { Project } from "@/schemas/projects.ts";
import { toast } from "sonner";
import { useExperimentUpdate } from "@/features/experiment/use-experiment-update.ts";

type UpdateExperimentFormProps = {
  experiment: Experiment;
  projectId: Project["id"];
  className?: string;
  onSuccess?: () => void;
};

const UpdateExperimentForm: React.FC<UpdateExperimentFormProps> = ({
  experiment,
  className,
  projectId,
  onSuccess,
}) => {
  const form = useForm<z.infer<typeof updateExperimentSchema>>({
    resolver: zodResolver(updateExperimentSchema),
    defaultValues: {
      name: experiment.name || "",
      key: experiment.key || "",
      description: experiment.description || "",
    },
    mode: "all",
  });

  const { mutate, status, error } = useExperimentUpdate({
    experimentId: experiment.id,
    projectId: projectId,
    onSuccess: () => {
      toast.success("Experiment updated successfully");
      onSuccess?.();
    },
  });

  const onSubmit = (data: z.infer<typeof updateExperimentSchema>) => {
    mutate({
      id: experiment.id,
      data,
    });
  };

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
                  onChange={(e) => {
                    onChange(
                      e.target.value.toLowerCase().replaceAll(" ", "_").trim(),
                    );
                  }}
                  {...props}
                />
              </FormControl>
              <FormDescription>
                After change you will need to replace the experiment key
                everywhere you used it.
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
        <div className="space-y-2 mt-8">
          <ErrorMessage error={error?.message} />
          <Button
            disabled={!form.formState.isValid}
            status={status}
            type="submit"
          >
            Update experiment
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default UpdateExperimentForm;
