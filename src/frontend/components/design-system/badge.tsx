import React from "react";
import {
  cn,
  getStatusMeta,
  getPriorityMeta,
  getCongestionMeta,
  getUserRoleMeta,
  type StatusContext,
} from "@/lib/utils";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "status" | "priority" | "outline" | "metric" | "congestion" | "role";
  status?: string;
  context?: StatusContext;
  priority?: number;
  congestionScore?: number | string;
  role?: string;
  className?: string;
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "default",
  status,
  context = "general",
  priority,
  congestionScore,
  role,
  className,
  size = "sm",
}: BadgeProps) {
  let badgeStyle = "bg-[#F0EDE4] text-[#5C6B68] border-[#E3E5E0]";
  let content = children;

  if (variant === "status" && status) {
    const meta = getStatusMeta(status, context);
    badgeStyle = meta.badgeClass;
    if (!content) content = meta.label;
  } else if (variant === "priority" && priority !== undefined) {
    const meta = getPriorityMeta(priority);
    badgeStyle = meta.badgeClass;
    if (!content) content = meta.label;
  } else if (variant === "congestion" && congestionScore !== undefined) {
    const meta = getCongestionMeta(congestionScore);
    badgeStyle = meta.badgeClass;
    if (!content) content = `${meta.label} · ${typeof congestionScore === "number" ? congestionScore.toFixed(0) : congestionScore}/100`;
  } else if (variant === "role" && role) {
    const meta = getUserRoleMeta(role);
    badgeStyle = meta.badgeClass;
    if (!content) content = meta.label;
  } else if (variant === "outline") {
    badgeStyle = "bg-white text-[#5C6B68] border-[#D5D9D3]";
  }

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border font-medium transition-colors tracking-tight select-none",
        sizeClasses,
        badgeStyle,
        className
      )}
    >
      {content}
    </span>
  );
}
