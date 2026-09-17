"use client";

import React from "react";
import {
  X,
  Anchor,
  Ship,
  Cpu,
  Boxes,
  Compass,
  ArrowRight,
  ShieldAlert,
  Clock,
  Activity,
  Zap,
  Gauge,
  Layers,
  AlertTriangle,
  Sparkles,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import {
  PortTwinBerth,
  PortTwinCrane,
  PortTwinYard,
  PortTwinVessel,
  PortTwinAnchorage,
  PortTwinDisruption,
  PortTwinOptimizationRecommendation,
  PORT_BERTHS,
  PORT_CRANES,
  PORT_VESSELS,
} from "@/data/port-twin-data";

export type InspectedObject =
  | { type: "berth"; data: PortTwinBerth }
  | { type: "crane"; data: PortTwinCrane }
  | { type: "yard"; data: PortTwinYard }
  | { type: "vessel"; data: PortTwinVessel }
  | { type: "anchorage"; data: PortTwinAnchorage }
  | { type: "disruption"; data: PortTwinDisruption }
  | { type: "recommendation"; data: PortTwinOptimizationRecommendation };

interface PortTwinPopupProps {
  selection: InspectedObject | null;
  onClose: () => void;
  onSelectObject?: (obj: InspectedObject) => void;
}

export function PortTwinPopup({ selection, onClose, onSelectObject }: PortTwinPopupProps) {
  if (!selection) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "available":
      case "normal":
        return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
      case "occupied":
      case "busy":
      case "berthed":
      case "working":
        return "bg-cyan-500/15 text-cyan-400 border-cyan-500/30";
      case "approaching":
        return "bg-blue-500/15 text-blue-400 border-blue-500/30";
      case "waiting":
      case "anchored":
      case "congested":
      case "near capacity":
        return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      case "critical":
      case "high":
      case "delayed":
      case "maintenance":
      case "failed":
        return "bg-rose-500/15 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/30";
    }
  };

  const navigateToBerth = (berthCode: string) => {
    const b = PORT_BERTHS.find((item) => item.berth_code === berthCode);
    if (b && onSelectObject) onSelectObject({ type: "berth", data: b });
  };

  const navigateToVessel = (vesselName: string) => {
    const v = PORT_VESSELS.find((item) => item.vessel_name.toLowerCase() === vesselName.toLowerCase());
    if (v && onSelectObject) onSelectObject({ type: "vessel", data: v });
  };

  const navigateToCrane = (craneCode: string) => {
    const c = PORT_CRANES.find((item) => item.crane_code === craneCode);
    if (c && onSelectObject) onSelectObject({ type: "crane", data: c });
  };

  return (
    <div className="absolute top-28 right-6 z-30 w-88 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-700/80 bg-slate-900/95 p-4 text-slate-200 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800/90 text-cyan-400 border border-slate-700 shadow-inner">
            {selection.type === "berth" && <Anchor className="h-4 w-4" />}
            {selection.type === "vessel" && <Ship className="h-4 w-4" />}
            {selection.type === "crane" && <Cpu className="h-4 w-4" />}
            {selection.type === "yard" && <Boxes className="h-4 w-4" />}
            {selection.type === "anchorage" && <Compass className="h-4 w-4" />}
            {selection.type === "disruption" && <AlertTriangle className="h-4 w-4 text-rose-400" />}
            {selection.type === "recommendation" && <Sparkles className="h-4 w-4 text-cyan-400" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                {selection.type}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getStatusColor(
                  (selection.data as any).severity || (selection.data as any).status || "Active"
                )}`}
              >
                {(selection.data as any).severity || (selection.data as any).status || "Active"}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              {selection.type === "berth" && `${selection.data.berth_code} — ${selection.data.berth_name}`}
              {selection.type === "vessel" && `${selection.data.vessel_code} · ${selection.data.vessel_name}`}
              {selection.type === "crane" && `${selection.data.crane_code} — ${selection.data.crane_name}`}
              {selection.type === "yard" && `${selection.data.yard_code} (${selection.data.yard_name})`}
              {selection.type === "anchorage" && `${selection.data.zone_code} — ${selection.data.zone_name}`}
              {selection.type === "disruption" && `${selection.data.incident_code} · ${selection.data.title}`}
              {selection.type === "recommendation" && `REC-${selection.data.vessel_code} · ${selection.data.vessel_name}`}
            </h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Close panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="py-3 text-xs space-y-2.5">
        {/* ================= VESSEL DETAILS ================= */}
        {selection.type === "vessel" && (
          <>
            {/* Dimensions & TEU */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Dimensions (LOA × Beam)</span>
                <span className="font-semibold text-white font-mono">
                  {selection.data.loa_meters}m × {selection.data.beam_meters}m
                </span>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Cargo Capacity</span>
                <span className="font-semibold text-white font-mono">
                  {selection.data.cargo_teu.toLocaleString()} TEU
                </span>
              </div>
            </div>

            {/* Operational Progress (for Working Vessels) */}
            {selection.data.status === "Working" && selection.data.moves_total && (
              <div className="rounded-lg bg-slate-800/70 p-2.5 border border-cyan-500/20">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Activity className="h-3 w-3 text-cyan-400" />
                    Quayside Cargo Lifts
                  </span>
                  <span className="font-bold text-cyan-300 font-mono">
                    {Math.round(((selection.data.moves_completed || 0) / selection.data.moves_total) * 100)}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-700/80 overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all"
                    style={{
                      width: `${((selection.data.moves_completed || 0) / selection.data.moves_total) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Completed: {selection.data.moves_completed} moves</span>
                  <span>Total: {selection.data.moves_total} moves</span>
                </div>
              </div>
            )}

            {/* Delay Alert */}
            {selection.data.status === "Delayed" && (
              <div className="rounded-lg bg-rose-500/10 p-2.5 border border-rose-500/30 text-[11px] text-rose-300">
                <div className="flex items-center gap-1.5 font-semibold text-rose-400 mb-1">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  <span>Anchorage Congestion Delay</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  Delay exposure: +{selection.data.delay_hours || 5.5}h beyond scheduled pilot boarding time. Est. demurrage: $6,875.
                </p>
              </div>
            )}

            {/* Approaching Transit Telemetry */}
            {selection.data.status === "Approaching" && (
              <div className="rounded-lg bg-blue-500/10 p-2 border border-blue-500/20 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Speed:</span>
                  <span className="font-bold text-cyan-300 font-mono">{selection.data.speed_knots || 11.8} knots</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400">Heading:</span>
                  <span className="font-mono text-slate-200">{selection.data.heading_degrees}° (Fairway Axis)</span>
                </div>
              </div>
            )}

            {/* General Specs */}
            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Liner / Carrier</span>
                <span className="font-medium text-slate-200">{selection.data.shipping_line}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Water Draft</span>
                <span className="font-mono text-slate-200">{selection.data.draft_meters}m</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Priority Tier</span>
                <span className="font-semibold text-amber-400">
                  Tier {selection.data.priority} {selection.data.priority === 1 ? "(Critical Express)" : ""}
                </span>
              </div>

              {/* Related Berth Link */}
              {selection.data.assigned_berth_code && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Assigned Berth</span>
                  <button
                    onClick={() => navigateToBerth(selection.data.assigned_berth_code!)}
                    className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
                  >
                    Berth {selection.data.assigned_berth_code}
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ================= BERTH DETAILS ================= */}
        {selection.type === "berth" && (
          <>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Max LOA</span>
                <span className="font-semibold text-white font-mono">
                  {selection.data.max_vessel_length}m
                </span>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Max Draft</span>
                <span className="font-semibold text-white font-mono">
                  {selection.data.max_draft}m
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              {/* Connected Vessel */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Current Vessel</span>
                {selection.data.current_vessel_name ? (
                  <button
                    onClick={() => navigateToVessel(selection.data.current_vessel_name!)}
                    className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 font-bold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
                  >
                    {selection.data.current_vessel_name}
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                ) : (
                  <span className="font-medium text-emerald-400">Clear & Available</span>
                )}
              </div>

              {/* Connected Cranes */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Assigned Cranes</span>
                <div className="flex items-center gap-1">
                  {selection.data.assigned_cranes.map((c) => (
                    <button
                      key={c}
                      onClick={() => navigateToCrane(c)}
                      className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Mooring Bollards</span>
                <span className="text-slate-300">{selection.data.bollards_count} units (reinforced)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Fendering System</span>
                <span className="text-slate-300 truncate max-w-[140px]" title={selection.data.fender_type}>
                  {selection.data.fender_type}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ================= CRANE DETAILS ================= */}
        {selection.type === "crane" && (
          <>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Rated Throughput</span>
                <span className="font-semibold text-white font-mono">
                  {selection.data.capacity_per_hour} moves/hr
                </span>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Shift Completed</span>
                <span className="font-semibold text-white font-mono">
                  {selection.data.current_moves_count} moves
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              {/* Connected Berth */}
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Assigned Berth</span>
                <button
                  onClick={() => navigateToBerth(selection.data.assigned_berth_code)}
                  className="inline-flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors"
                >
                  Berth {selection.data.assigned_berth_code}
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              </div>

              {/* Working Spreader Activity */}
              {selection.data.status === "Busy" && (
                <div className="rounded-lg bg-cyan-500/10 p-2 border border-cyan-500/20 text-[10px] text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3 animate-pulse text-cyan-400" />
                    Spreader Trolley in Motion
                  </span>
                  <span className="font-mono font-bold">~85s cycle</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Boom Outreach</span>
                <span className="font-mono text-slate-200">{selection.data.boom_reach_meters}m</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Rail Gauge</span>
                <span className="font-mono text-slate-200">{selection.data.rail_gauge_meters}m</span>
              </div>
            </div>
          </>
        )}

        {/* ================= YARD DETAILS ================= */}
        {selection.type === "yard" && (
          <>
            <div className="rounded-lg bg-slate-800/60 p-2.5 border border-slate-800">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-400">Stack Utilization</span>
                <span className="font-bold text-white font-mono">
                  {selection.data.utilization_pct}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-700/80 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    selection.data.utilization_pct > 85
                      ? "bg-amber-500"
                      : "bg-cyan-500"
                  }`}
                  style={{ width: `${selection.data.utilization_pct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Cargo Type</span>
                <span className="font-medium text-slate-200">{selection.data.cargo_type}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Occupied / Capacity</span>
                <span className="font-mono text-slate-200">
                  {selection.data.occupied_capacity_teu.toLocaleString()} / {selection.data.total_capacity_teu.toLocaleString()} TEU
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Stacking Tiers</span>
                <span className="font-mono text-slate-200">{selection.data.stacking_tiers} high</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">RTG Gantry Cranes</span>
                <span className="text-slate-200">{selection.data.rtg_cranes_count} units</span>
              </div>
            </div>
          </>
        )}

        {/* ================= ANCHORAGE DETAILS ================= */}
        {selection.type === "anchorage" && (
          <>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Water Depth</span>
                <span className="font-semibold text-white font-mono">
                  {selection.data.water_depth_meters}m
                </span>
              </div>
              <div className="rounded-lg bg-slate-800/60 p-2 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Vessels Anchored</span>
                <span className="font-semibold text-white font-mono">
                  {selection.data.current_vessels_count} / {selection.data.max_capacity}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ================= DISRUPTION DETAILS (PHASE 3) ================= */}
        {selection.type === "disruption" && (
          <>
            <div className="space-y-2 text-[11px]">
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5">
                <div className="flex items-center justify-between text-[10px] text-rose-300 font-mono mb-1">
                  <span>DISRUPTION SENTINEL ALERT</span>
                  <span>{selection.data.incident_type.toUpperCase()}</span>
                </div>
                <p className="text-slate-200 text-xs leading-relaxed">{selection.data.description}</p>
              </div>

              {/* Financial Risk & Delay Impact */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Risk Exposure</span>
                  <span className="font-bold text-rose-400 font-mono text-sm">
                    ${selection.data.estimated_risk_usd.toLocaleString()} USD
                  </span>
                </div>
                <div className="rounded-lg bg-slate-800/80 p-2 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Delay Impact</span>
                  <span className="font-bold text-amber-400 font-mono text-sm">
                    +{selection.data.estimated_delay_hours}h
                  </span>
                </div>
              </div>

              {/* Affected Assets Cross-Navigation */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                  Affected Terminal Assets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selection.data.affected_vessel_names.map((vName) => (
                    <button
                      key={vName}
                      onClick={() => navigateToVessel(vName)}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-cyan-300 border border-slate-700 hover:bg-slate-700 hover:border-cyan-500/50 transition-colors"
                    >
                      <Ship className="h-3 w-3" />
                      <span>{vName}</span>
                    </button>
                  ))}
                  {selection.data.affected_berth_codes.map((bCode) => (
                    <button
                      key={bCode}
                      onClick={() => navigateToBerth(bCode)}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-emerald-300 border border-slate-700 hover:bg-slate-700 hover:border-emerald-500/50 transition-colors"
                    >
                      <Anchor className="h-3 w-3" />
                      <span>{bCode}</span>
                    </button>
                  ))}
                  {selection.data.affected_crane_codes.map((cCode) => (
                    <button
                      key={cCode}
                      onClick={() => navigateToCrane(cCode)}
                      className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[10px] text-blue-300 border border-slate-700 hover:bg-slate-700 hover:border-blue-500/50 transition-colors"
                    >
                      <Cpu className="h-3 w-3" />
                      <span>{cCode}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recommended Action */}
              <div className="rounded-lg bg-cyan-950/40 border border-cyan-500/30 p-2 text-cyan-200 text-[11px]">
                <span className="font-semibold block text-[10px] text-cyan-400 mb-0.5">ASTRA Sentinel Recommendation</span>
                <span>{selection.data.recommended_action}</span>
              </div>
            </div>
          </>
        )}

        {/* ================= RECOMMENDATION DETAILS (PHASE 3) ================= */}
        {selection.type === "recommendation" && (
          <>
            <div className="space-y-2 text-[11px]">
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/30 p-2.5">
                <div className="flex items-center justify-between text-[10px] text-cyan-300 font-mono mb-1">
                  <span>OR-TOOLS CP-SAT PROPOSED PLAN</span>
                  <span className="text-emerald-400 font-bold">SOLVER OPTIMAL</span>
                </div>
                <div className="flex items-center justify-between pt-1 font-semibold text-white">
                  <span>{selection.data.vessel_name}</span>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 line-through">
                      {selection.data.current_berth_code || "Anchorage"}
                    </span>
                    <ArrowRight className="h-3 w-3 text-cyan-400" />
                    <span className="text-cyan-300 font-mono font-bold">
                      {selection.data.proposed_berth_code}
                    </span>
                  </div>
                </div>
              </div>

              {/* Savings Meter */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg bg-emerald-950/30 p-2 border border-emerald-500/30">
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <DollarSign className="h-3 w-3" />
                    <span>Demurrage Saved</span>
                  </div>
                  <span className="font-bold text-emerald-300 font-mono text-sm">
                    +${selection.data.demurrage_savings_usd.toLocaleString()}
                  </span>
                </div>
                <div className="rounded-lg bg-blue-950/30 p-2 border border-blue-500/30">
                  <div className="flex items-center gap-1 text-[10px] text-blue-400 font-mono">
                    <TrendingDown className="h-3 w-3" />
                    <span>Wait Reduction</span>
                  </div>
                  <span className="font-bold text-blue-300 font-mono text-sm">
                    -{selection.data.waiting_reduction_hours}h
                  </span>
                </div>
              </div>

              {/* Optimization Rationale */}
              <div className="rounded-lg bg-slate-800/70 p-2 border border-slate-800 text-slate-300">
                <span className="font-semibold block text-[10px] text-slate-400 mb-0.5">Algorithm Rationale</span>
                <span>{selection.data.rationale}</span>
              </div>

              {/* Assigned Cranes & Quick Jump */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[10px]">Cranes:</span>
                  {selection.data.assigned_crane_codes.map((cc) => (
                    <button
                      key={cc}
                      onClick={() => navigateToCrane(cc)}
                      className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-300 border border-slate-700 hover:border-blue-400"
                    >
                      {cc}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => navigateToBerth(selection.data.proposed_berth_code)}
                  className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2 py-1 text-[10px] font-semibold text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
                >
                  <span>Inspect {selection.data.proposed_berth_code}</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-mono">
        <span>ASTRA OPERATIONAL INTELLIGENCE</span>
        <span className="text-cyan-400/80">PHASE 3 ACTIVE</span>
      </div>
    </div>
  );
}
