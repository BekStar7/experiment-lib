import * as React from "react";
import { cn } from "@/lib/utils.ts";

type ErrorMessageProps = {
  className?: string;
  error: React.ReactNode;
};

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, className }) => {
  return (
    <div className={cn("text-sm text-destructive", className)}>{error}</div>
  );
};

export default ErrorMessage;
