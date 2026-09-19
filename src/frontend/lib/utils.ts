import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "—";
  }
}

export function formatRelativeHours(isoString?: string | null): string {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    const diffHours = (d.getTime() - Date.now()) / (1000 * 60 * 60);
    if (Math.abs(diffHours) < 0.5) return "Now";
    if (diffHours > 0) return `in ${Math.round(diffHours)}h`;
    return `${Math.abs(Math.round(diffHours))}h ago`;
  } catch {
    return "—";
  }
}

export function formatDuration(hours?: number | null): string {
  if (!hours || isNaN(hours) || hours <= 0) return "0h";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// Re-export centralized semantic design system utilities
export {
  getCongestionMeta,
  getStatusMeta,
  getPriorityMeta,
  getResourceUtilizationMeta,
  getUserRoleMeta,
  type CongestionMeta,
  type CongestionSeverity,
  type StatusContext,
  type StatusMeta,
  type PriorityMeta,
  type UtilizationMeta,
} from "./semantic-colors";
