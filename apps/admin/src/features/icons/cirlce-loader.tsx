import * as React from "react";
import type { IconProps } from "@/features/icons/icon.ts";
import { cn } from "@/lib/utils.ts";

export const CircleLoader: React.FC<IconProps> = ({ className }) => {
  return (
    <svg
      className={cn(className)}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="path"
        cx="10"
        cy="10"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
};
