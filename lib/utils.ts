import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateText(value: string | null | undefined, max = 120) {
  if (!value) {
    return "";
  }

  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > max ? `${compact.slice(0, max)}...` : compact;
}

export function formatDateTime(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
