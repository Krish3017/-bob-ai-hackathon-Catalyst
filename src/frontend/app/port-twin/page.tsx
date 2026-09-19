"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Radio,
  Compass,
  Ship,
  Anchor,
  Layers,
  Zap,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";

// Dynamically import Three.js / React Three Fiber component with SSR disabled
const PortTwin3DMap = dynamic(
  () =>
    import("@/components/port-twin-3d/port-twin-3d-map").then((mod) => mod.PortTwin3DMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[640px] w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-[#dbeafe] text-slate-700 shadow-sm">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-800">
          Loading Port Digital Twin GIS...
        </span>
        <span className="text-[11px] text-slate-500 mt-1">
          Rendering nautical bathymetry, fairway boundaries, and quayside infrastructure
        </span>
      </div>
    ),
  }
);

export default function PortTwinPage() {
  return (
    <AppShell
      title="Port Digital Twin"
      description="Interactive 2.5D visual twin modeling berths, STS cranes, container yards, and fleet movements."
    >
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#004741] text-white">
                <Radio className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#004741]">
                Nautical Command Center
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                GIS Operational Twin
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#102A27]">
              Live Port Digital Twin
            </h1>
            <p className="text-xs text-[#5C6B68]">
              Interactive 2.5D maritime operations twin modeling berths, STS cranes, container yards, and fleet movements.
            </p>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex items-center gap-2">
            <Link
              href="/operations"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E5E0] bg-white px-3 py-1.5 text-xs font-medium text-[#102A27] shadow-sm hover:bg-slate-50 transition-colors"
            >
              <Ship className="h-3.5 w-3.5 text-[#004741]" />
              <span>Operations Dispatch</span>
            </Link>
            <Link
              href="/optimization"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#004741] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003B36] transition-colors"
            >
              <Zap className="h-3.5 w-3.5 text-emerald-300" />
              <span>72h Optimization</span>
            </Link>
          </div>
        </div>

        {/* Port Digital Twin GIS Map & Intelligence Layout */}
        <PortTwin3DMap />
      </div>
    </AppShell>
  );
}
