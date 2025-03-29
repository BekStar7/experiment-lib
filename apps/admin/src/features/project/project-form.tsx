import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type MutationStatus } from "@tanstack/react-query";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/features/ui/form.tsx";
import { Input } from "@/features/ui/input.tsx";
import ErrorMessage from "@/features/ui/error-message.tsx";
import { Button } from "@/features/ui/button.tsx";
import {
  createOrUpdateProjectSchema,
  type Project,
} from "@/schemas/projects.ts";
import { Textarea } from "@/features/ui/textarea.tsx";
import { cn } from "@/lib/utils.ts";

type ProjectFormProps = {
  project?: Project;
  onSubmit: (data: z.infer<typeof createOrUpdateProjectSchema>) => void;
  error: Error | null;
  status: MutationStatus;
  className?: string;
};

const ProjectForm: React.FC<ProjectFormProps> = ({
  project,
  onSubmit,
  error,
  status,
  className,
}) => {
  const form = useForm<z.infer<typeof createOrUpdateProjectSchema>>({
    resolver: zodResolver(createOrUpdateProjectSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
    },
    mode: "all",
  });

  const action = project ? "Update" : "Create";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("space-y-4 w-full", className)}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="Project title"
                  {...field}
                />
              </FormControl>
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
                  placeholder="Project description"
                  className="max-h-64"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-2">
          <ErrorMessage error={error?.message} />
          <Button
            disabled={!form.formState.isValid}
            status={status}
            type="submit"
          >
            {action} project
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProjectForm;
