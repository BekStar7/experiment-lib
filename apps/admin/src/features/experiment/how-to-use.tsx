import type { Experiment } from "@/schemas/experiment.ts";
import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/features/ui/tabs.tsx";
import { CodeBlock } from "@/features/ui/code-block.tsx";
import {
  getComponentUseCode,
  getHookUseCode,
} from "@/features/experiment/experiment-utils.ts";
import { env } from "@/lib/env.ts";
import { Separator } from "@/features/ui/separator.tsx";

type HowToUseProps = {
  experiment: Experiment;
};

const HowToUse: React.FC<HowToUseProps> = ({ experiment }) => {
  const COMPONENTS = {
    toggle: {
      component: (
        <div className="space-y-2">
          <CodeBlock
            code={`import { ExparoFeatureFlag } from "${env().VITE_LIB_NAME}";`}
            language="tsx"
            showLineNumbers
          />
          <CodeBlock
            code={getComponentUseCode(experiment)}
            language="tsx"
            showLineNumbers
          />
          {experiment.variants.length > 0 && (
            <>
              <Separator />
              <p>Also you can use it with payload:</p>
              <CodeBlock
                code={getComponentUseCode(experiment, true)}
                language="tsx"
                showLineNumbers
              />
            </>
          )}
        </div>
      ),
      hook: (
        <div className="space-y-2">
          <CodeBlock
            code={`import { useFeatureFlag } from "${env().VITE_LIB_NAME}";`}
            language="tsx"
            showLineNumbers
          />
          <CodeBlock
            code={getHookUseCode(experiment)}
            language="tsx"
            showLineNumbers
          />
        </div>
      ),
    },
    multiple_variant: {
      component: (
        <div className="space-y-2">
          <CodeBlock
            code={`import { ExparoVariantRenderer, ExparoVariants } from "${env().VITE_LIB_NAME}";`}
            language="tsx"
            showLineNumbers
          />
          <CodeBlock
            code={getComponentUseCode(experiment)}
            language="tsx"
            showLineNumbers
          />
          {experiment.variants.length > 0 && (
            <>
              <Separator />
              <p>Also you can use renderer with payload:</p>
              <CodeBlock
                code={getComponentUseCode(experiment, true)}
                language="tsx"
                showLineNumbers
              />
            </>
          )}
        </div>
      ),
      hook: (
        <div className="space-y-2">
          <CodeBlock
            code={`import { useGetVariant } from "${env().VITE_LIB_NAME}";`}
            language="tsx"
            showLineNumbers
          />
          <CodeBlock
            code={getHookUseCode(experiment)}
            language="tsx"
            showLineNumbers
          />
        </div>
      ),
    },
  } as const;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">How to use this experiment</h2>
      <Tabs defaultValue="component">
        <TabsList>
          <TabsTrigger value="component">Component</TabsTrigger>
          <TabsTrigger value="hook">Hook</TabsTrigger>
        </TabsList>
        <TabsContent value="component">
          {COMPONENTS[experiment.type].component}
        </TabsContent>
        <TabsContent value="hook">
          {COMPONENTS[experiment.type].hook}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HowToUse;
