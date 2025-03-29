import { createFileRoute } from "@tanstack/react-router";
import { ExparoVariantRenderer, ExparoVariants } from "@repo/exparo";
import { env } from "@/lib/env.ts";

export const Route = createFileRoute("/abn-test-component")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <ExparoVariants
        experimentKey={env().VITE_ABN_TEST_KEY}
        fallback={<span>No keys match</span>}
      >
        <ExparoVariantRenderer variantKey="key_1">key_1</ExparoVariantRenderer>
        <ExparoVariantRenderer variantKey="key_2">key_2</ExparoVariantRenderer>
        <ExparoVariantRenderer variantKey="key_3">key_3</ExparoVariantRenderer>
      </ExparoVariants>
    </div>
  );
}
