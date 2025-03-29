import { bulkEditVariantsSchema, type Variant } from "@/schemas/variant.ts";
import { useFieldArray, useForm } from "react-hook-form";
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
import { Button } from "@/features/ui/button.tsx";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/features/ui/card.tsx";
import { Slider } from "@/features/ui/slider.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import type { Experiment } from "@/schemas/experiment.ts";
import ErrorMessage from "@/features/ui/error-message.tsx";
import { useUpdateVariant } from "@/features/variant/use-update-variant.ts";
import type { Project } from "@/schemas/projects.ts";
import React from "react";

type ToggleVariantFormProps = {
  projectId: Project["id"];
  experimentId: Experiment["id"];
  variants: Variant[];
};

const ToggleVariantForm: React.FC<ToggleVariantFormProps> = ({
  projectId,
  experimentId,
  variants,
}) => {
  const form = useForm<z.infer<typeof bulkEditVariantsSchema>>({
    resolver: zodResolver(bulkEditVariantsSchema),
    defaultValues: {
      variants: variants.map((variant) => ({
        ...variant,
        rollout: variant.rollout * 100,
      })),
    },
    mode: "all",
  });

  const { fields } = useFieldArray({
    name: "variants",
    control: form.control,
  });

  const { mutate, status, error } = useUpdateVariant({
    projectId,
  });

  function handleSubmit(data: z.infer<typeof bulkEditVariantsSchema>) {
    mutate({
      id: experimentId,
      data: {
        variants: data.variants.map((variant) => ({
          ...variant,
          rollout: variant.rollout / 100,
        })),
      },
    });
  }

  const fieldIndex = fields.findIndex((field) => field.key === "enabled");
  const field = fields[fieldIndex];

  if (!field) {
    return <div>Something went wrong</div>;
  }

  const controlIndex = fields.findIndex((field) => field.key === "control");
  const control = fields[controlIndex];

  if (!control) {
    return <div>Something went wrong</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Edit feature flag</h2>
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Feature flag</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <FormField
                control={form.control}
                name={`variants.${fieldIndex}.rollout`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rollout {Math.floor(field.value)}%</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(values) => {
                          form.setValue(
                            `variants.${controlIndex}.rollout`,
                            100 - values[0],
                          );
                          field.onChange(values[0]);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`variants.${fieldIndex}.payload`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payload (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value}
                        className="font-mono text-sm"
                        rows={5}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter payload as valid JSON
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-2">
          <ErrorMessage
            error={
              error?.message || form.formState.errors.variants?.root?.message
            }
          />
          <Button status={status} type="submit">
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ToggleVariantForm;
