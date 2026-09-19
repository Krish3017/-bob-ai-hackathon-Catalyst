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
  Activity,
  AlertTriangle,
  Sparkles,
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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "occupied":
      case "busy":
      case "berthed":
      case "working":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "approaching":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "waiting":
      case "anchored":
      case "congested":
      case "near capacity":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "critical":
      case "high":
      case "delayed":
      case "maintenance":
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
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
    <div className="absolute top-16 right-4 z-30 w-84 max-w-[calc(100vw-2.5rem)] rounded-xl border border-slate-200 bg-white/98 p-3.5 text-slate-800 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-150">
      {/* Header */}
      <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-blue-600 border border-slate-200">
            {selection.type === "berth" && <Anchor className="h-3.5 w-3.5" />}
            {selection.type === "vessel" && <Ship className="h-3.5 w-3.5" />}
            {selection.type === "crane" && <Cpu className="h-3.5 w-3.5" />}
            {selection.type === "yard" && <Boxes className="h-3.5 w-3.5" />}
            {selection.type === "anchorage" && <Compass className="h-3.5 w-3.5" />}
            {selection.type === "disruption" && <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />}
            {selection.type === "recommendation" && <Sparkles className="h-3.5 w-3.5 text-blue-600" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-mono font-semibold tracking-wider text-slate-400 uppercase">
                {selection.type}
              </span>
              <span
                className={`inline-flex items-center rounded px-1.5 py-0.2 text-[9px] font-bold border ${getStatusColor(
                  (selection.data as any).severity || (selection.data as any).status || "Active"
                )}`}
              >
                {(selection.data as any).severity || (selection.data as any).status || "Active"}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
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
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          aria-label="Close inspector panel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="py-2.5 text-xs space-y-2">
        {/* ================= VESSEL DETAILS ================= */}
        {selection.type === "vessel" && (
          <>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Dimensions (LOA × Beam)</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.loa_meters}m × {selection.data.beam_meters}m
                </span>
              </div>
              <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Cargo Capacity</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.cargo_teu.toLocaleString()} TEU
                </span>
              </div>
            </div>

            {/* Operational Progress for Working Vessels */}
            {selection.data.status === "Working" && selection.data.moves_total && (
              <div className="rounded bg-blue-50/60 p-2 border border-blue-200">
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-blue-900 font-medium flex items-center gap-1">
                    <Activity className="h-3 w-3 text-blue-600" />
                    Quayside Cargo Lifts
                  </span>
                  <span className="font-bold text-blue-700 font-mono">
                    {Math.round(((selection.data.moves_completed || 0) / selection.data.moves_total) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden mb-1">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{
                      width: `${((selection.data.moves_completed || 0) / selection.data.moves_total) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Completed: {selection.data.moves_completed}</span>
                  <span>Total: {selection.data.moves_total} moves</span>
                </div>
              </div>
            )}

            {/* Delay Alert */}
            {selection.data.status === "Delayed" && (
              <div className="rounded bg-rose-50 p-2 border border-rose-200 text-[11px] text-rose-800">
                <div className="flex items-center gap-1 font-semibold text-rose-700 mb-0.5">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Anchorage Delay Exposure</span>
                </div>
                <p className="text-[10px] text-rose-600">
                  +{selection.data.delay_hours || 5.5}h wait. Estimated demurrage penalty: $6,875.
                </p>
              </div>
            )}

            {/* General Specs */}
            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Shipping Line</span>
                <span className="font-semibold text-slate-800">{selection.data.shipping_line}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Water Draft</span>
                <span className="font-mono text-slate-800">{selection.data.draft_meters}m</span>
              </div>
              {selection.data.assigned_berth_code && (
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-slate-500">Assigned Berth</span>
                  <button
                    onClick={() => navigateToBerth(selection.data.assigned_berth_code!)}
                    className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
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
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Max LOA</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.max_vessel_length}m
                </span>
              </div>
              <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Max Draft</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.max_draft}m
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned Vessel</span>
                {selection.data.current_vessel_name ? (
                  <button
                    onClick={() => navigateToVessel(selection.data.current_vessel_name!)}
                    className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                  >
                    {selection.data.current_vessel_name}
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                ) : (
                  <span className="font-bold text-emerald-700">None (Available)</span>
                )}
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Berth Length</span>
                <span className="font-mono font-semibold text-slate-800">{selection.data.max_vessel_length}m</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-800">{selection.data.status}</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned Cranes</span>
                <div className="flex items-center gap-1">
                  {selection.data.assigned_cranes.map((c) => (
                    <button
                      key={c}
                      onClick={() => navigateToCrane(c)}
                      className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[9px] font-semibold text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Mooring Bollards</span>
                <span className="text-slate-800">{selection.data.bollards_count} reinforced</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Fender Type</span>
                <span className="text-slate-800">{selection.data.fender_type}</span>
              </div>
            </div>
          </>
        )}

        {/* ================= CRANE DETAILS ================= */}
        {selection.type === "crane" && (
          <>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Rated Throughput</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.capacity_per_hour} moves/hr
                </span>
              </div>
              <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Completed Lifts</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.current_moves_count} moves
                </span>
              </div>
            </div>

            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Utilization</span>
                <span className="font-mono font-bold text-slate-800">
                  {selection.data.status === "Failed" ? "0%" : "72%"}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Assigned Berth</span>
                <button
                  onClick={() => navigateToBerth(selection.data.assigned_berth_code)}
                  className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-mono font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                  Berth {selection.data.assigned_berth_code}
                  <ArrowRight className="h-2.5 w-2.5" />
                </button>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Current Operation</span>
                <span className="font-semibold text-slate-800">
                  {selection.data.status === "Failed" ? "Offline" : selection.data.current_moves_count > 0 ? "Loading" : "Standby"}
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-semibold ${
                    selection.data.status === "Failed" ? "text-rose-600 font-bold" : "text-emerald-700"
                  }`}
                >
                  {selection.data.status}
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Boom Outreach</span>
                <span className="font-mono text-slate-800">{selection.data.boom_reach_meters}m</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">Rail Gauge</span>
                <span className="font-mono text-slate-800">{selection.data.rail_gauge_meters}m</span>
              </div>
            </div>
          </>
        )}

        {/* ================= YARD DETAILS ================= */}
        {selection.type === "yard" && (
          <>
            <div className="rounded bg-slate-50 p-2 border border-slate-200">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-600 font-semibold">Yard Utilization</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.utilization_pct}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    selection.data.utilization_pct > 85 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${selection.data.utilization_pct}%` }}
                />
              </div>
            </div>

            <div className="space-y-1 pt-1 text-[11px]">
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Cargo Classification</span>
                <span className="font-semibold text-slate-800">{selection.data.cargo_type}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Occupied / Total</span>
                <span className="font-mono text-slate-800">
                  {selection.data.occupied_capacity_teu.toLocaleString()} / {selection.data.total_capacity_teu.toLocaleString()} TEU
                </span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-100">
                <span className="text-slate-500">Stacking Tiers</span>
                <span className="font-mono text-slate-800">{selection.data.stacking_tiers} high</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span className="text-slate-500">RTG Cranes Active</span>
                <span className="text-slate-800 font-mono">{selection.data.rtg_cranes_count} units</span>
              </div>
            </div>
          </>
        )}

        {/* ================= ANCHORAGE DETAILS ================= */}
        {selection.type === "anchorage" && (
          <>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Water Depth</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.water_depth_meters}m
                </span>
              </div>
              <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                <span className="text-slate-500 block text-[9px] uppercase font-semibold">Capacity Occupied</span>
                <span className="font-bold text-slate-900 font-mono">
                  {selection.data.current_vessels_count} / {selection.data.max_capacity}
                </span>
              </div>
            </div>
          </>
        )}

        {/* ================= DISRUPTION DETAILS ================= */}
        {selection.type === "disruption" && (
          <>
            <div className="space-y-1.5 text-[11px]">
              <div className="rounded bg-rose-50 border border-rose-200 p-2">
                <div className="flex items-center justify-between text-[9px] text-rose-700 font-mono font-bold mb-0.5">
                  <span>DISRUPTION SENTINEL</span>
                  <span>{selection.data.incident_type.toUpperCase()}</span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">{selection.data.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Financial Risk</span>
                  <span className="font-bold text-rose-700 font-mono">
                    ${selection.data.estimated_risk_usd.toLocaleString()}
                  </span>
                </div>
                <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Delay Impact</span>
                  <span className="font-bold text-amber-700 font-mono">
                    +{selection.data.estimated_delay_hours}h
                  </span>
                </div>
              </div>

              <div className="rounded bg-blue-50/50 p-1.5 border border-blue-200 text-[10px]">
                <span className="font-bold text-blue-900 block mb-0.5">Mitigation Protocol:</span>
                <p className="text-slate-700">{selection.data.recommended_action}</p>
              </div>
            </div>
          </>
        )}

        {/* ================= RECOMMENDATION DETAILS ================= */}
        {selection.type === "recommendation" && (
          <>
            <div className="space-y-1.5 text-[11px]">
              <div className="rounded bg-blue-50 border border-blue-200 p-2">
                <div className="flex items-center justify-between text-[9px] text-blue-700 font-mono font-bold mb-0.5">
                  <span>OR-TOOLS RECOMMENDED HOT-SWAP</span>
                  <span>72H HORIZON</span>
                </div>
                <p className="text-slate-700 text-[11px] leading-relaxed">{selection.data.assignment_rationale}</p>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Demurrage Savings</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    +${selection.data.demurrage_savings_usd.toLocaleString()}
                  </span>
                </div>
                <div className="rounded bg-slate-50 p-1.5 border border-slate-200">
                  <span className="text-slate-500 block text-[9px] uppercase font-semibold">Queue Reduction</span>
                  <span className="font-bold text-blue-700 font-mono">
                    -{selection.data.waiting_reduction_hours}h wait
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100">
        <button
          onClick={onClose}
          className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-semibold text-center transition-colors shadow-sm cursor-pointer"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
