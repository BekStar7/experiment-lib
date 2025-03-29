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
import { toast } from "sonner";
import { Button } from "@/features/ui/button.tsx";
import { Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/features/ui/card.tsx";
import { Input } from "@/features/ui/input.tsx";
import { Slider } from "@/features/ui/slider.tsx";
import { Textarea } from "@/features/ui/textarea.tsx";
import { useMutation } from "@tanstack/react-query";
import { experimentAPI } from "@/services/api/experiment.ts";
import type { Experiment } from "@/schemas/experiment.ts";
import ErrorMessage from "@/features/ui/error-message.tsx";
import { formatKey } from "@/lib/utils.ts";
import AddVariantButton from "@/features/variant/add-variant-button.tsx";
import type { Project } from "@/schemas/projects.ts";
import DeleteVariantButton from "@/features/variant/delete-variant-button.tsx";

type VariantCardProps = {
  projectId: Project["id"];
  experimentId: Experiment["id"];
  variants: Variant[];
};

const VariantForm: React.FC<VariantCardProps> = ({
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

  const { mutate, status, error } = useMutation({
    mutationFn: experimentAPI.bulkEditVariants,
    mutationKey: ["experiment", "bulk-edit-variants"],
    onSuccess: () => {
      toast.success("Variants updated");
    },
    onError: (error) => {
      toast.error("Error updating variants: " + error.message);
    },
  });

  function handleSubmit(data: z.infer<typeof bulkEditVariantsSchema>) {
    mutate({
      id: experimentId,
      data: {
        variants: data.variants.map((variant) => ({
          ...variant,
          rollout: variant.rollout / 100,
          payload: JSON.stringify(variant.payload),
        })),
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Bulk Edit Variants</h2>
            <AddVariantButton
              variantKey={`key_${variants.length + 1}`}
              projectId={projectId}
              experimentId={experimentId}
            />
          </div>

          {fields.length <= 0 ? (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-xl font-bold">No variants found</p>
            </div>
          ) : (
            fields.map((field, index) => (
              <Card key={field.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Variant {index + 1}
                    </CardTitle>
                    {fields.length > 1 && (
                      <DeleteVariantButton
                        projectId={projectId}
                        variantId={
                          variants.find((variant) => variant.key === field.key)
                            ?.id || ""
                        }
                        experimentId={experimentId}
                      >
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove variant</span>
                        </Button>
                      </DeleteVariantButton>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <FormField
                    control={form.control}
                    name={`variants.${index}.key`}
                    render={({ field: { onChange, ...props } }) => (
                      <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl>
                          <Input
                            {...props}
                            onChange={(e) =>
                              onChange(formatKey(e.target.value))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variants.${index}.rollout`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rollout ({field.value}%)</FormLabel>
                        <FormControl>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[field.value]}
                            onValueChange={(values) =>
                              field.onChange(values[0])
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`variants.${index}.payload`}
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
            ))
          )}
        </div>
        {fields.length > 0 && (
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
        )}
      </form>
    </Form>
  );
};

export default VariantForm;
