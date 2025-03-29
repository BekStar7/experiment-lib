import { createFileRoute } from "@tanstack/react-router";
import { ExparoVariantRenderer, ExparoVariants } from "@repo/exparo";

export const Route = createFileRoute("/variants")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ExparoVariants experimentKey="second_experiment" fallback="OH NOOO">
      <ExparoVariantRenderer variantKey="variant_1">
        {(payload: string) => <div>Variant 1: {payload}</div>}
      </ExparoVariantRenderer>
      <ExparoVariantRenderer variantKey="variant_2">2</ExparoVariantRenderer>
    </ExparoVariants>
  );
}
