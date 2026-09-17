"use client";

import React from "react";
import {
  PortTwinBerth,
  PortTwinCrane,
  PortTwinYard,
  PortTwinVessel,
  PortTwinDisruption,
} from "@/data/port-twin-data";

export type HoveredAsset =
  | { type: "crane"; data: PortTwinCrane; x: number; y: number }
  | { type: "berth"; data: PortTwinBerth; x: number; y: number }
  | { type: "vessel"; data: PortTwinVessel; x: number; y: number }
  | { type: "yard"; data: PortTwinYard; x: number; y: number }
  | { type: "disruption"; data: PortTwinDisruption; x: number; y: number };

interface PortTwinTooltipProps {
  hovered: HoveredAsset | null;
  containerBounds?: DOMRect | null;
}

export function PortTwinTooltip({ hovered, containerBounds }: PortTwinTooltipProps) {
  if (!hovered) return null;

  // Relative coordinates within container
  let relX = hovered.x;
  let relY = hovered.y;
  if (containerBounds) {
    relX = hovered.x - containerBounds.left;
    relY = hovered.y - containerBounds.top;
  }

  // Clamping within container boundaries to prevent overflow
  const clampX = Math.max(75, Math.min((containerBounds?.width || 800) - 75, relX));
  const clampY = Math.max(65, relY);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "operational":
      case "normal":
      case "available":
        return "#10b981"; // emerald
      case "occupied":
      case "busy":
      case "working":
      case "berthed":
        return "#2563eb"; // blue
      case "maintenance":
      case "near capacity":
      case "anchored":
        return "#f59e0b"; // amber
      case "failed":
      case "critical":
      case "delayed":
        return "#ef4444"; // rose
      default:
        return "#64748b"; // slate
    }
  };

  return (
    <div
      className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-full mb-3 rounded-lg border border-slate-200/95 bg-white/98 px-2.5 py-1.5 shadow-lg backdrop-blur-md transition-all duration-75 text-left select-none min-w-[125px] max-w-[200px]"
      style={{
        left: `${clampX}px`,
        top: `${clampY - 6}px`,
      }}
    >
      {hovered.type === "crane" && (
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-slate-900 font-mono leading-tight">
            {hovered.data.crane_code}
          </div>
          <div className="text-[10px] text-slate-500 font-medium leading-tight">
            STS Crane
          </div>
          <div className="flex items-center gap-1.5 pt-0.5 text-[10px] font-medium leading-tight text-slate-700">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getStatusColor(hovered.data.status) }}
            />
            <span>{hovered.data.status === "Busy" ? "Operational" : hovered.data.status}</span>
          </div>
          <div className="text-[10px] text-slate-600 font-medium pt-0.5 leading-tight">
            Utilization:{" "}
            <span className="font-semibold text-slate-800 font-mono">
              {hovered.data.status === "Failed" ? "0%" : hovered.data.status === "Busy" ? "72%" : "0%"}
            </span>
          </div>
        </div>
      )}

      {hovered.type === "berth" && (
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-slate-900 font-mono leading-tight">
            {hovered.data.berth_code}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-medium leading-tight text-slate-700">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getStatusColor(hovered.data.status) }}
            />
            <span>{hovered.data.status}</span>
          </div>
          {hovered.data.current_vessel_name && (
            <div className="text-[10px] font-semibold text-blue-700 leading-tight">
              {hovered.data.current_vessel_name}
            </div>
          )}
          <div className="text-[10px] text-slate-600 font-medium pt-0.5 leading-tight">
            Length:{" "}
            <span className="font-semibold text-slate-800 font-mono">
              {hovered.data.max_vessel_length}m
            </span>
          </div>
        </div>
      )}

      {hovered.type === "vessel" && (
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-slate-900 leading-tight">
            {hovered.data.vessel_name}
          </div>
          <div className="text-[10px] text-slate-600 font-medium leading-tight">
            Berth:{" "}
            <span className="font-semibold text-slate-800 font-mono">
              {hovered.data.assigned_berth_code || hovered.data.assigned_anchorage_code || "Fairway"}
            </span>
          </div>
          <div className="text-[10px] text-slate-600 font-medium leading-tight">
            Load:{" "}
            <span className="font-semibold text-slate-800 font-mono">
              {Math.round(((hovered.data.moves_completed || 300) / (hovered.data.moves_total || 600)) * 100) || 50}%
            </span>
          </div>
        </div>
      )}

      {hovered.type === "yard" && (
        <div className="space-y-0.5">
          <div className="text-[11px] font-bold text-slate-900 font-mono leading-tight">
            {hovered.data.yard_code}
          </div>
          <div className="text-[10px] text-slate-500 font-medium leading-tight">
            Container Yard
          </div>
          <div className="text-[10px] text-slate-600 font-medium pt-0.5 leading-tight">
            Utilization:{" "}
            <span className="font-semibold text-slate-800 font-mono">
              {Math.round(hovered.data.utilization_pct)}%
            </span>
          </div>
        </div>
      )}

      {hovered.type === "disruption" && (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 text-[11px] font-bold text-rose-700 font-mono leading-tight">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>{hovered.data.incident_code}</span>
          </div>
          <div className="text-[10px] text-slate-600 font-medium leading-tight">
            {hovered.data.incident_type.replace(/_/g, " ").toUpperCase()}
          </div>
          <div className="text-[10px] text-slate-700 font-semibold pt-0.5 leading-tight">
            {hovered.data.title}
          </div>
        </div>
      )}
    </div>
  );
}
