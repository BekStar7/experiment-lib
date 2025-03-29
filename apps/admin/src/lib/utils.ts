import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseErrorObj = (
  obj: Record<string, string | string[]>,
): string => {
  try {
    const firstKey = Object.keys(obj)[0];
    const value = obj[firstKey];

    if (Array.isArray(value)) {
      if (typeof value[0] === "string") {
        return value[0];
      }
      return parseErrorObj(value[0]);
    }

    if (typeof value === "string") {
      return value;
    }
    return parseErrorObj(value);
  } catch (error) {
    return "Something went wrong";
  }
};

export const formatKey = (key: string) => {
  return key.toLowerCase().replaceAll(" ", "_").trim();
};
