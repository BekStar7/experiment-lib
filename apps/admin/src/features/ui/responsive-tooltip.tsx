import { createContext, useContext } from "react";
import {
  TooltipProvider as OriginalTooltipProvider,
  Tooltip as OriginalTooltip,
  TooltipTrigger as OriginalTooltipTrigger,
  TooltipContent as OriginalTooltipContent,
} from "./tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import type {
  TooltipContentProps,
  TooltipProps,
  TooltipTriggerProps,
  TooltipProviderProps,
} from "@radix-ui/react-tooltip";
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from "@radix-ui/react-popover";
import useMediaQuery from "@/hooks/use-media-query.ts";
import { cn } from "@/lib/utils.ts";

const TouchContext = createContext<boolean | undefined>(undefined);
const useTouch = () => useContext(TouchContext);

export const ResponsiveTooltipProvider = ({
  children,
  ...props
}: TooltipProviderProps) => {
  const isTouch = useMediaQuery("(pointer: coarse)");

  return (
    <TouchContext.Provider value={isTouch}>
      <OriginalTooltipProvider {...props}>{children}</OriginalTooltipProvider>
    </TouchContext.Provider>
  );
};

export const ResponsiveTooltip = (props: TooltipProps & PopoverProps) => {
  const isTouch = useTouch();
  return isTouch ? <Popover {...props} /> : <OriginalTooltip {...props} />;
};

export const ResponsiveTooltipTrigger = ({
  onClick,
  className,
  ...props
}: TooltipTriggerProps & PopoverTriggerProps) => {
  const isTouch = useTouch();

  return isTouch ? (
    <PopoverTrigger
      className={className}
      onClick={(e) => e.stopPropagation()}
      {...props}
    />
  ) : (
    <OriginalTooltipTrigger
      className={cn("cursor-default", className)}
      onClick={(e) => e.stopPropagation()}
      {...props}
    />
  );
};

export const ResponsiveTooltipContent = ({
  className,
  ...props
}: TooltipContentProps & PopoverContentProps) => {
  const isTouch = useTouch();

  return isTouch ? (
    <PopoverContent className={cn("text-sm p-2", className)} {...props} />
  ) : (
    <OriginalTooltipContent className={className} {...props} />
  );
};
