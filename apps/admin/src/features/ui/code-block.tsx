import React from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

import Prism from "prismjs";

import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-javascript";
import { Button } from "@/features/ui/button.tsx";
import { useTheme } from "@/features/layout/theme";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
  title?: string;
}

export const CodeBlock = ({
  code,
  language = "pixelated",
  showLineNumbers = false,
  className,
  title,
}: CodeBlockProps) => {
  const { resolvedTheme } = useTheme();
  const [copied, setCopied] = React.useState(false);
  const [highlightedCode, setHighlightedCode] = React.useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined" && Prism) {
      const highlighted = Prism.highlight(
        code,
        Prism.languages[language] || Prism.languages.plaintext,
        language,
      );
      setHighlightedCode(highlighted);
    } else {
      setHighlightedCode(code);
    }
  }, [code, language]);

  React.useEffect(() => {
    if (resolvedTheme === "dark") {
      import("prismjs/themes/prism-tomorrow.min.css");
    } else {
      import("prismjs/themes/prism.min.css");
    }
  }, [resolvedTheme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split("\n");

  return (
    <div className={cn("relative rounded-lg border bg-muted", className)}>
      {title && (
        <div className="flex items-center justify-between border-b bg-muted px-2 py-1">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              aria-label="Copy code"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
      )}
      <div className="relative overflow-x-auto p-2">
        <pre className="text-sm font-mono">
          {showLineNumbers ? (
            <code className={`language-${language} block table`}>
              {lines.map((line, i) => (
                <div key={i} className="table-row">
                  <span className="table-cell pr-4 text-right text-muted-foreground select-none">
                    {i + 1}
                  </span>
                  <span
                    className="table-cell"
                    dangerouslySetInnerHTML={{
                      __html: Prism.highlight(
                        line,
                        Prism.languages[language] || Prism.languages.plaintext,
                        language,
                      ),
                    }}
                  />
                </div>
              ))}
            </code>
          ) : (
            <code
              className={`language-${language}`}
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          )}
        </pre>
        {!title && (
          <Button
            onClick={handleCopy}
            className="absolute right-0.5 top-0.5 inline-flex w-8 h-8"
            variant="outline"
            size="sm"
            aria-label="Copy code"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3 text-muted-foreground" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
