"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MaritimeWatermark, WatermarkVariant } from "./maritime-watermark";
import { User, UserRole } from "@/types";
import { api, clearAuthToken, getAuthToken } from "@/lib/api";
import { Anchor, ShieldAlert, ArrowLeft, LogOut, WifiOff } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  congestionScore?: number;
  congestionLevel?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  allowedRoles?: UserRole[];
  watermarkVariant?: WatermarkVariant;
  /** When true, the main content area fills the available viewport height without page-level scroll */
  copilotMode?: boolean;
}

export function AppShell({
  children,
  title,
  description,
  congestionScore,
  congestionLevel,
  onRefresh,
  isRefreshing,
  allowedRoles,
  watermarkVariant,
  copilotMode,
}: AppShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = getAuthToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const cachedUser = localStorage.getItem("naviops_user");
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        setIsLoadingAuth(false);
      } catch {
        // Continue to fresh verify
      }
    }

    api.getMe()
      .then((userData) => {
        setUser(userData);
        localStorage.setItem("naviops_user", JSON.stringify(userData));
        localStorage.setItem("naviops_role", userData.role);
        setIsLoadingAuth(false);
        setNetworkWarning(null);
      })
      .catch((err: any) => {
        if (err?.status === 401 || err?.message?.includes("401") || err?.message?.includes("expired")) {
          clearAuthToken();
          router.replace("/login");
        } else {
          setNetworkWarning("Working in cached offline mode. NaviOps backend is temporarily unreachable.");
          setIsLoadingAuth(false);
        }
      });
  }, [router]);

  useEffect(() => {
    const handleUserUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<User>;
      if (customEvt.detail) {
        setUser(customEvt.detail);
      }
    };
    window.addEventListener("naviops_user_updated", handleUserUpdated);
    return () => window.removeEventListener("naviops_user_updated", handleUserUpdated);
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    } else {
      router.replace("/login");
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#004741] text-white shadow-card-md animate-pulse mb-4">
          <Anchor className="h-7 w-7" />
        </div>
        <div className="text-sm font-semibold text-[#102A27]">
          Authenticating NaviOps Session...
        </div>
        <div className="text-xs text-[#5C6B68] mt-1">
          Verifying security credentials and access permissions
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        copilotMode
          ? "h-screen overflow-hidden bg-[#FAFAF8] relative flex"
          : "min-h-screen bg-[#FAFAF8] relative"
      }
    >
      <Sidebar user={user} onLogout={handleLogout} />
      <div
        className={
          copilotMode
            ? "flex flex-col flex-1 min-w-0 pl-60 h-screen relative"
            : "flex flex-col pl-60 relative min-h-screen"
        }
      >
        <Header
          title={title}
          description={description}
          congestionScore={congestionScore}
          congestionLevel={congestionLevel}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          user={user}
          onLogout={handleLogout}
        />
        {copilotMode ? (
          /* Copilot layout — fills remaining height below header, no page scroll */
          <main className="relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
            {networkWarning && (
              <div className="flex items-center gap-2.5 border-b border-[#F0D49A] bg-[#FFF4DE] px-6 py-2 text-xs text-[#C58A2B] flex-none">
                <WifiOff className="h-4 w-4 text-[#C58A2B] flex-none" />
                <span>{networkWarning}</span>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              {children}
            </div>
          </main>
        ) : (
          /* Normal page layout */
          <main className="relative z-10 flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-5">
            {networkWarning && (
              <div className="flex items-center gap-2.5 rounded-xl border border-[#F0D49A] bg-[#FFF4DE] px-4 py-2.5 text-xs text-[#C58A2B]">
                <WifiOff className="h-4 w-4 text-[#C58A2B] flex-none" />
                <span>{networkWarning}</span>
              </div>
            )}
            {allowedRoles && user && !allowedRoles.includes(user.role) ? (
              <div className="rounded-2xl border border-[#E3E5E0] bg-white p-8 md:p-12 shadow-card text-center max-w-2xl mx-auto my-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4DE] text-[#C58A2B] border border-[#F0D49A] mb-4">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-bold text-[#102A27] tracking-tight">
                  Access Restricted
                </h2>
                <p className="mt-2 text-sm text-[#5C6B68] leading-relaxed">
                  This page requires{" "}
                  <span className="font-semibold text-[#102A27]">
                    {allowedRoles
                      .map((r) =>
                        r === "admin"
                          ? "Port Manager / Admin"
                          : r === "operations"
                          ? "Operations Staff"
                          : "Viewer"
                      )
                      .join(" or ")}
                  </span>{" "}
                  privileges.
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F7F6F2] border border-[#E3E5E0] px-3.5 py-1.5 text-xs text-[#5C6B68]">
                  <span>Authenticated Role:</span>
                  <span className="font-bold uppercase tracking-wider text-[#004741]">
                    {user.role}
                  </span>
                  <span className="text-[#899491]">({user.email})</span>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#004741] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003B36] transition cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Return to Overview
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E3E5E0] bg-white px-4 py-2.5 text-xs font-semibold text-[#5C6B68] hover:bg-[#F7F6F2] transition cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-[#899491]" />
                    Sign In with Different Account
                  </button>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        )}
      </div>
    </div>
  );
}
