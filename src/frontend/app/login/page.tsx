"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Anchor, Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/design-system/button";
import { api, setAuthToken, clearAuthToken } from "@/lib/api";
import { getRoleDashboard } from "@/lib/roles";

export default function LoginPage() {
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("naviops_token");
      const role = localStorage.getItem("naviops_role");
      if (token) {
        router.replace(getRoleDashboard(role));
      } else {
        // Ensure clean state upon navigating to login or post-logout
        setLoginEmail("");
        setLoginPassword("");
        setError(null);
      }
    }
  }, [router]);

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
      // Auto-normalize @naviops.com to @naviops.port for backwards compatibility
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
          ? "Invalid email or password. Please check your credentials or contact your administrator."
          : msg
      );
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#D5D9D3] bg-[#F7F8F6] px-4 py-3 pl-11 text-sm text-[#102A27] placeholder:text-[#899491] focus:bg-white focus:border-[#004741] focus:outline-none focus:ring-2 focus:ring-[#004741]/20 transition-all";

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col justify-between bg-[#071715]">
      {/* ── Ambient Maritime Depth Background & Subtle Grid (No Posters) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(0, 114, 104, 0.35) 0%, rgba(10, 31, 29, 0.9) 55%, #05100F 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.9) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Subtle Ambient Orb Highlights ── */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#004741]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#2F7D8C]/15 blur-3xl pointer-events-none" />

      {/* ── Main Container (Generous & Spacious) ── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16">
        
        {/* ── Brand Emblem & Title ── */}
        <div className="text-center mb-8 max-w-lg">
          <div className="inline-flex items-center justify-center mb-5">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-2xl transition-transform hover:scale-105 duration-300"
              style={{
                background: "linear-gradient(135deg, #005F58 0%, #003B36 100%)",
                boxShadow: "0 8px 32px rgba(0, 71, 65, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <Anchor className="h-8 w-8 text-[#54D2C3]" />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            NaviOps <span className="font-light text-[#7BCBD8]">Port Operations</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#A0B5B2] font-medium mt-2 max-w-md mx-auto leading-relaxed">
            Autonomous Berth Schedule Optimizer &amp; Real-Time Port Digital Twin
          </p>
        </div>

        {/* ── Spacious Executive Authentication Card ── */}
        <div
          className="w-full max-w-[460px] rounded-3xl bg-white shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.12)] overflow-hidden"
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          <div className="p-8 sm:p-10">
            {/* Form Title */}
            <div className="mb-7">
              <h2 className="text-xl font-bold text-[#102A27] tracking-tight">
                Personnel Sign In
              </h2>
              <p className="text-xs text-[#5C6B68] mt-1.5 leading-relaxed">
                Enter your authorized credentials. Role permissions and dashboard views will configure automatically.
              </p>
            </div>

            {/* Error Feedback */}
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#F2C4C3] bg-[#FCE9E8] p-3.5 text-xs text-[#B94A48] animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-5" autoComplete="off">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#354845] mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="off"
                    placeholder="name@naviops.port"
                    className={inputClass}
                  />
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-[#899491]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#354845] mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className={`${inputClass} pr-11`}
                  />
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-[#899491]" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-[#899491] hover:text-[#102A27] transition-colors focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full justify-center py-3.5 text-sm font-semibold rounded-xl bg-[#004741] text-white hover:bg-[#003833] shadow-lg shadow-[#004741]/25 hover:shadow-xl hover:shadow-[#004741]/35 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating Session..." : "Sign In to Terminal"}
                </Button>
              </div>
            </form>

            {/* Security Assurance Notice */}
            <div className="mt-7 pt-5 border-t border-[#EEF0EB] flex items-center justify-center gap-2 text-[11px] text-[#7A8885]">
              <ShieldCheck className="h-4 w-4 text-[#004741]" />
              <span>TLS 1.3 Encrypted &bull; Access Monitored &amp; Logged</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Minimalist Clean Footer ── */}
      <footer className="relative z-10 py-5 text-center text-xs text-[#7A918E]">
        <p>
          NaviOps Port Authority Operating System &bull; Version 2.4.0
        </p>
      </footer>
    </div>
  );
}
