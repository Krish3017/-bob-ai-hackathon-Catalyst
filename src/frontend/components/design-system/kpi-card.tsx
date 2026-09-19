import React from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: React.ReactNode;
  statusColor?: "emerald" | "blue" | "amber" | "rose" | "slate";
  className?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  statusColor = "blue",
  className,
}: KpiCardProps) {
  const colorBorders = {
    emerald: "border-l-4 border-l-[#2F7D5B]",
    blue: "border-l-4 border-l-[#004741]",
    amber: "border-l-4 border-l-[#C58A2B]",
    rose: "border-l-4 border-l-[#B94A48]",
    slate: "border-l-4 border-l-[#899491]",
  }[statusColor];

  return (
    <div
      className={cn(
        "rounded-lg border border-[#E3E5E0] bg-white p-4 shadow-sm transition-all hover:shadow-md",
        colorBorders,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-[#5C6B68]">
          {title}
        </p>
        {icon && <div className="text-[#899491]">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-[#004741]">
          {value}
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-1.5 py-0.5 rounded-lg",
              trend.isNeutral
                ? "bg-[#F7F6F2] text-[#5C6B68] border border-[#E3E5E0]"
                : trend.isPositive
                ? "bg-[#E5F2EA] text-[#2F7D5B]"
                : "bg-[#FCE9E8] text-[#B94A48]"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-[#899491] font-normal truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
}
