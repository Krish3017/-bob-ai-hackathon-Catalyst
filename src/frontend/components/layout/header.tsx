"use client";

import React, { useState, useEffect, useRef } from "react";
import { RefreshCw, RotateCcw, LogOut, Shield, ChevronDown, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { User } from "@/types";
import { cn } from "@/lib/utils";
import { getCongestionMeta } from "@/lib/semantic-colors";

import { useToast } from "@/components/design-system/toast";
import { useConfirm } from "@/components/design-system/confirm-dialog";

interface HeaderProps {
  title: string;
  description?: string;
  congestionScore?: number;
  congestionLevel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  user?: User | null;
  onLogout?: () => void;
}

export function Header({
  title,
  description,
  congestionScore = 42.5,
  congestionLevel = "Moderate",
  onRefresh,
  isRefreshing = false,
  user,
  onLogout,
}: HeaderProps) {
  const [updatedTime, setUpdatedTime] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    setUpdatedTime(
      new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, []);

  // Close profile on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleResetDemo = async () => {
    setIsProfileOpen(false);
    const confirmed = await confirm({
      title: "Reset demo dataset?",
      description:
        "This will restore all operational data, vessels, berths, cranes, and disruptions back to initial demo state. Any added records will be removed.",
      confirmText: "Reset dataset",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    try {
      await api.resetDemoData();
      toast.success(
        "Dataset reset",
        "Operational telemetry and fleet records restored to initial demo state."
      );
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error(
        "Unable to reset dataset",
        err.message || "An unexpected error occurred."
      );
    }
  };

  const handleRefreshClick = () => {
    if (onRefresh) {
      onRefresh();
      toast.info("Refreshed", "Latest operational telemetry loaded.");
    }
  };

  // Congestion pill styling using centralized semantic color system
  const congestionMeta = getCongestionMeta(congestionScore);

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[#E3E5E0] bg-white/97 px-6 backdrop-blur-sm">
      {/* Left: Title & Subtitle */}
      <div className="flex flex-col justify-center">
        <h1 className="text-sm font-semibold tracking-tight text-[#102A27]">{title}</h1>
        {description && (
          <p className="text-[11px] text-[#5C6B68] font-normal leading-tight">{description}</p>
        )}
      </div>

      {/* Right: Status Pill, Time, Refresh, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Congestion Pill */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight",
            congestionMeta.badgeClass
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", congestionMeta.dotColor)} />
          <span>
            {congestionMeta.label} · {congestionScore.toFixed(0)}/100
          </span>
        </div>

        {/* Last Updated */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#899491] font-mono">
          <Activity className="h-3 w-3" />
          <span>{updatedTime || "live"}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            title="Refresh operational telemetry"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E3E5E0] bg-white text-[#5C6B68] hover:bg-[#E1EFEC] hover:text-[#004741] hover:border-[#C5DDD9] transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5",
                isRefreshing && "animate-spin text-[#004741]"
              )}
            />
          </button>
        )}

        {/* Profile Dropdown */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 rounded-full border border-transparent py-0.5 pl-1 pr-2 text-xs hover:bg-[#F7F6F2] hover:border-[#E3E5E0] transition-all"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#004741] text-[10px] font-bold text-white">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="font-medium text-[#102A27] hidden sm:inline max-w-[120px] truncate">
                {user.full_name}
              </span>
              <ChevronDown className="h-3 w-3 text-[#899491]" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-58 rounded-xl border border-[#E3E5E0] bg-white p-2 shadow-card-md z-50 text-xs">
                <div className="px-2 py-1.5 border-b border-[#F0EDE4] mb-1.5">
                  <div className="font-semibold text-[#102A27] truncate">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] text-[#899491] truncate mt-0.5">
                    {user.email}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-[#004741]">
                    <Shield className="h-3 w-3" />
                    <span className="capitalize">{user.role} Access</span>
                  </div>
                </div>

                {user.role === "admin" && (
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[#5C6B68] hover:bg-[#F7F6F2] hover:text-[#102A27] transition-colors text-left"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-[#899491]" />
                    <span>Reset Demo Data</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (onLogout) onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[#B94A48] hover:bg-[#FCE9E8] transition-colors text-left mt-1 border-t border-[#F0EDE4] pt-2"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
