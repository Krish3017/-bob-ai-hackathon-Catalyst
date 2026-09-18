"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Anchor, ShieldCheck, UserCheck, Eye, Lock, Mail,
  AlertCircle
} from "lucide-react";
import { Button } from "@/design-system/button";
import { Badge } from "@/design-system/badge";
import { api, setAuthToken } from "@/lib/api";
import { getRoleDashboard } from "@/lib/roles";

export default function LoginPage() {
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState("admin@naviops.port");
  const [loginPassword, setLoginPassword] = useState("admin123");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("naviops_token");
      const role = localStorage.getItem("naviops_role");
      if (token) {
        router.replace(getRoleDashboard(role));
      }
    }
  }, [router]);

  const handleDemoFill = (email: string) => {
    setLoginEmail(email);
    setLoginPassword("admin123");
    setError(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = loginEmail.trim();
    const cleanPassword = loginPassword.trim();
    if (!cleanEmail || !cleanPassword) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Auto-normalize @naviops.com to @naviops.port for demo accounts
      const normalizedEmail = cleanEmail.toLowerCase().endsWith("@naviops.com")
        ? cleanEmail.slice(0, -4) + ".port"
        : cleanEmail;

      const res = await api.login(normalizedEmail, cleanPassword);
      setAuthToken(res.token);
      localStorage.setItem("naviops_token", res.token);
      localStorage.setItem("naviops_role", res.user.role);
      localStorage.setItem("naviops_user", JSON.stringify(res.user));

      // Automatic role-based dashboard redirection
      const destination = getRoleDashboard(res.user.role);
      window.location.href = destination;
    } catch (err: any) {
      const msg = err.message || "Invalid email or password.";
      setError(
        msg.includes("Invalid email or password")
          ? "Invalid email or password. Use your registered credentials (e.g. admin@naviops.port / admin123)."
          : msg
      );
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#D5D9D3] bg-white px-3 py-2 pl-9 text-sm text-[#102A27] placeholder:text-[#899491] focus:border-[#004741] focus:outline-none focus:ring-1 focus:ring-[#004741] transition-colors";

  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden flex items-center justify-center"
      style={{
        backgroundImage: "url('/port-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "left center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#7BCBD8",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(105deg, rgba(240,237,228,0.18) 0%, rgba(240,237,228,0.30) 40%, rgba(250,250,248,0.55) 65%, rgba(250,250,248,0.72) 100%)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 50%, rgba(0,71,65,0.06) 100%)",
        }}
      />

      {/* ── Main Content ── */}
      <div className="relative z-10 w-full flex flex-col items-center px-4 py-10 sm:py-14">

        {/* ── Brand Header ── */}
        <div className="text-center mb-6">
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-2xl text-white mb-4"
            style={{
              background: "#004741",
              boxShadow: "0 4px 20px rgba(0,71,65,0.35)",
            }}
          >
            <Anchor className="h-7 w-7" />
          </div>

          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: "#102A27", textShadow: "0 1px 3px rgba(255,255,255,0.7)" }}
          >
            NaviOps Port Operations
          </h1>
          <p
            className="text-xs sm:text-sm font-medium mt-1.5"
            style={{ color: "#2E4845", textShadow: "0 1px 2px rgba(255,255,255,0.6)" }}
          >
            Port Congestion Prediction &amp; Resource Schedule Optimizer
          </p>
        </div>

        {/* ── Authentication Card ── */}
        <div
          className="w-full max-w-md"
          style={{
            background: "rgba(255, 255, 255, 0.93)",
            border: "1px solid rgba(227,229,224,0.9)",
            borderRadius: "18px",
            boxShadow:
              "0 8px 32px rgba(0,71,65,0.12), 0 2px 8px rgba(0,71,65,0.08), 0 0 0 1px rgba(197,221,217,0.3)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <div className="px-6 pt-6 pb-6 sm:px-8 sm:pt-7">

            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#102A27]">Sign In</h2>
              <p className="text-xs text-[#5C6B68] mt-1">
                Enter your credentials. Your assigned role will load automatically.
              </p>
            </div>

            {/* ── Feedback Messages ── */}
            {error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#F2C4C3] bg-[#FCE9E8] p-3 text-xs text-[#B94A48]">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ════════════════════════════════ */}
            {/*          SIGN IN FORM           */}
            {/* ════════════════════════════════ */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#102A27] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="user@naviops.port"
                    className={inputClass}
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#899491]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#102A27] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className={inputClass}
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#899491]" />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center mt-2 bg-[#004741] text-white hover:bg-[#003833]"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In to NaviOps"}
              </Button>

              {/* ── Demo Personas (fills credentials only) ── */}
              <div className="pt-4 border-t border-[#F0EDE4]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#899491] mb-2">
                  1-Click Demo Credentials:
                </p>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => handleDemoFill("admin@naviops.port")}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl border border-[#E3E5E0] bg-[#F7F6F2] hover:bg-[#E1EFEC] hover:border-[#C5DDD9] transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E1EFEC]">
                        <ShieldCheck className="h-4 w-4 text-[#004741]" />
                      </div>
                      <div>
                        <span className="font-semibold text-[#102A27]">Port Manager</span>
                        <span className="block text-[10px] text-[#899491]">admin@naviops.port · admin123</span>
                      </div>
                    </div>
                    <Badge variant="status" status="Available" size="sm">Admin Role</Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoFill("ops@naviops.port")}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl border border-[#E3E5E0] bg-[#F7F6F2] hover:bg-[#E1EFEC] hover:border-[#C5DDD9] transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E1F0F2]">
                        <UserCheck className="h-4 w-4 text-[#2F7D8C]" />
                      </div>
                      <div>
                        <span className="font-semibold text-[#102A27]">Operations Staff</span>
                        <span className="block text-[10px] text-[#899491]">ops@naviops.port · admin123</span>
                      </div>
                    </div>
                    <Badge variant="status" status="Normal" size="sm">Operations Role</Badge>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoFill("executive@naviops.port")}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs rounded-xl border border-[#E3E5E0] bg-[#F7F6F2] hover:bg-[#FFF4DE] hover:border-[#F0D49A] transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFF4DE]">
                        <Eye className="h-4 w-4 text-[#C58A2B]" />
                      </div>
                      <div>
                        <span className="font-semibold text-[#102A27]">Executive Viewer</span>
                        <span className="block text-[10px] text-[#899491]">executive@naviops.port · admin123</span>
                      </div>
                    </div>
                    <Badge variant="status" status="Near Capacity" size="sm">Viewer Role</Badge>
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>

        {/* ── Footer Tag ── */}
        <p
          className="mt-6 text-[11px] font-medium"
          style={{ color: "rgba(16,42,39,0.55)", textShadow: "0 1px 2px rgba(255,255,255,0.5)" }}
        >
          NaviOps © {new Date().getFullYear()} · Maritime Port Operations Platform
        </p>
      </div>
    </div>
  );
}
