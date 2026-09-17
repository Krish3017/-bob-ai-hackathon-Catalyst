"use client";

import React, { useState } from "react";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Radio,
  Eye,
  EyeOff,
  Ship,
  Anchor,
  Cpu,
  Boxes,
  Navigation,
  ChevronDown,
  ChevronUp,
  Compass,
  AlertTriangle,
  Zap,
} from "lucide-react";

export interface LayerVisibility {
  vessels: boolean;
  berths: boolean;
  cranes: boolean;
  yards: boolean;
  fairway: boolean;
  anchorages: boolean;
  routes: boolean;
  disruptions: boolean;
  proposedPlan: boolean;
}

interface PortTwinOverlayProps {
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onTogglePitch: () => void;
  is25DPitch: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  onPanUp?: () => void;
  onPanDown?: () => void;
  onPanLeft?: () => void;
  onPanRight?: () => void;
  // Optional legacy props for backwards compatibility
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  simSpeed?: 1 | 2 | 5;
  onChangeSpeed?: (speed: any) => void;
  onResetSimulation?: () => void;
  simClock?: string;
  activeTransitCount?: number;
  stats: {
    totalVessels: number;
    berthedVessels: number;
    waitingVessels: number;
    activeBerths: number;
    totalBerths: number;
    operationalCranes: number;
    totalCranes: number;
    avgYardUtilization: number;
  };
}

export function PortTwinOverlay({
  layers,
  onToggleLayer,
  onZoomIn,
  onZoomOut,
  onResetView,
  onTogglePitch,
  is25DPitch,
  isFullscreen,
  onToggleFullscreen,
  onPanUp,
  onPanDown,
  onPanLeft,
  onPanRight,
  stats,
}: PortTwinOverlayProps) {
  const [layersOpen, setLayersOpen] = useState(false);

  return (
    <>
      {/* 1. TOP TELEMETRY RIBBON (Clean White Light GIS Card) */}
      <div className="absolute top-3 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left: Port Identifier */}
        <div className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-slate-200/90 bg-white/95 px-3 py-1.5 text-slate-800 shadow-md backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold tracking-tight text-slate-900">
            Tuas Terminal Digital Twin
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-[11px] font-mono text-blue-700 font-medium">
            <Radio className="h-3 w-3 text-blue-600" />
            <span>GIS 2.5D</span>
          </div>
        </div>

        {/* Right: Operational Telemetry Metrics */}
        <div className="pointer-events-auto hidden md:flex items-center gap-1 rounded-lg border border-slate-200/90 bg-white/95 px-2.5 py-1 shadow-md backdrop-blur-sm text-[11px] text-slate-700">
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <Ship className="h-3.5 w-3.5 text-blue-600" />
            <span>Fleet:</span>
            <span className="font-bold text-slate-900 font-mono">{stats.totalVessels}</span>
            <span className="text-[10px] text-slate-500">
              ({stats.berthedVessels} berthed · {stats.waitingVessels} queue)
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <Anchor className="h-3.5 w-3.5 text-emerald-600" />
            <span>Berths:</span>
            <span className="font-bold text-slate-900 font-mono">
              {stats.activeBerths}/{stats.totalBerths}
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <Cpu className="h-3.5 w-3.5 text-indigo-600" />
            <span>Cranes:</span>
            <span className="font-bold text-slate-900 font-mono">
              {stats.operationalCranes}/{stats.totalCranes}
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-200" />
          <div className="flex items-center gap-1.5 px-2 py-0.5">
            <Boxes className="h-3.5 w-3.5 text-amber-600" />
            <span>Yards:</span>
            <span className="font-bold text-slate-900 font-mono">
              {stats.avgYardUtilization}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. CAMERA & PAN NAVIGATION CONTROLS (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-auto">
        {/* Directional Pan Cross & Recenter */}
        <div className="rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-md backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-0.5">
            {/* Top row */}
            <div />
            <button
              onClick={onPanUp}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-slate-100 hover:text-blue-700 active:scale-95 transition-all"
              title="Pan North / Up (Arrow Up)"
              aria-label="Pan Up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <div />

            {/* Middle row */}
            <button
              onClick={onPanLeft}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-slate-100 hover:text-blue-700 active:scale-95 transition-all"
              title="Pan West / Left (Arrow Left)"
              aria-label="Pan Left"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onResetView}
              className="flex h-7 w-7 items-center justify-center rounded bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 active:scale-95 transition-all"
              title="Recenter / Reset Full-Port Overview"
              aria-label="Recenter View"
            >
              <Crosshair className="h-4 w-4" />
            </button>
            <button
              onClick={onPanRight}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-slate-100 hover:text-blue-700 active:scale-95 transition-all"
              title="Pan East / Right (Arrow Right)"
              aria-label="Pan Right"
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            {/* Bottom row */}
            <div />
            <button
              onClick={onPanDown}
              className="flex h-7 w-7 items-center justify-center rounded text-slate-700 hover:bg-slate-100 hover:text-blue-700 active:scale-95 transition-all"
              title="Pan South / Down (Arrow Down)"
              aria-label="Pan Down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
            <div />
          </div>
        </div>

        {/* Zoom, Fullscreen, and View Options Toolbar */}
        <div className="flex items-center rounded-lg border border-slate-200/90 bg-white/95 shadow-md backdrop-blur-sm overflow-hidden text-slate-700">
          <button
            onClick={onZoomIn}
            className="flex h-7 w-8 items-center justify-center hover:bg-slate-100 hover:text-blue-700 active:scale-95 transition-all border-r border-slate-100"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onZoomOut}
            className="flex h-7 w-8 items-center justify-center hover:bg-slate-100 hover:text-blue-700 active:scale-95 transition-all border-r border-slate-100"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className={`flex h-7 w-8 items-center justify-center hover:bg-slate-100 hover:text-blue-700 active:scale-95 transition-all border-r border-slate-100 ${
              isFullscreen ? "bg-blue-50 text-blue-700 font-bold" : ""
            }`}
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand Map Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onTogglePitch}
            className={`flex h-7 w-8 items-center justify-center transition-all ${
              is25DPitch ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-100 hover:text-blue-700"
            }`}
            title={is25DPitch ? "2.5D Aerial Tilt Active" : "Top-down 2D View"}
            aria-label="Toggle 2.5D Aerial Tilt"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4. COMPACT TERMINAL LAYERS CONTROL (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-1 max-w-[240px]">
        <div className="rounded-lg border border-slate-200/90 bg-white/95 shadow-md backdrop-blur-sm overflow-hidden text-xs text-slate-800">
          <button
            onClick={() => setLayersOpen(!layersOpen)}
            className="flex w-full items-center justify-between px-3 py-2 cursor-pointer bg-slate-50/80 hover:bg-slate-100 transition-colors border-b border-slate-200"
          >
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-semibold text-slate-900 text-[11px] tracking-wide">
                Terminal Layers
              </span>
            </div>
            {layersOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
            )}
          </button>

          {layersOpen && (
            <div className="p-2 space-y-2 max-h-[380px] overflow-y-auto">
              {/* OPERATIONS SECTION */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Operations
                </span>
                <div className="space-y-0.5 mt-1">
                  <button
                    onClick={() => onToggleLayer("vessels")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.vessels ? "bg-blue-50 text-blue-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Ship className="h-3 w-3 text-blue-600" />
                      <span>Vessels Fleet</span>
                    </div>
                    {layers.vessels ? <Eye className="h-3 w-3 text-blue-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>

                  <button
                    onClick={() => onToggleLayer("berths")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.berths ? "bg-emerald-50 text-emerald-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Anchor className="h-3 w-3 text-emerald-600" />
                      <span>Quay Berths</span>
                    </div>
                    {layers.berths ? <Eye className="h-3 w-3 text-emerald-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>

                  <button
                    onClick={() => onToggleLayer("cranes")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.cranes ? "bg-indigo-50 text-indigo-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="h-3 w-3 text-indigo-600" />
                      <span>STS Cranes</span>
                    </div>
                    {layers.cranes ? <Eye className="h-3 w-3 text-indigo-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>

                  <button
                    onClick={() => onToggleLayer("yards")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.yards ? "bg-amber-50 text-amber-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Boxes className="h-3 w-3 text-amber-600" />
                      <span>Container Yards</span>
                    </div>
                    {layers.yards ? <Eye className="h-3 w-3 text-amber-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>

                  <button
                    onClick={() => onToggleLayer("routes")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.routes ? "bg-sky-50 text-sky-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Navigation className="h-3 w-3 text-sky-600" />
                      <span>Navigation Routes</span>
                    </div>
                    {layers.routes ? <Eye className="h-3 w-3 text-sky-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>

                  <button
                    onClick={() => onToggleLayer("fairway")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.fairway ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Navigation className="h-3 w-3 text-slate-600" />
                      <span>Fairway & Buoys</span>
                    </div>
                    {layers.fairway ? <Eye className="h-3 w-3 text-slate-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>

                  <button
                    onClick={() => onToggleLayer("anchorages")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.anchorages ? "bg-teal-50 text-teal-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Compass className="h-3 w-3 text-teal-600" />
                      <span>Anchorage Zones</span>
                    </div>
                    {layers.anchorages ? <Eye className="h-3 w-3 text-teal-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* INTELLIGENCE SECTION */}
              <div className="border-t border-slate-100 pt-1.5">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Intelligence
                </span>
                <div className="space-y-0.5 mt-1">
                  <button
                    onClick={() => onToggleLayer("disruptions")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.disruptions ? "bg-rose-50 text-rose-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-rose-500" />
                      <span>Disruption Halos</span>
                    </div>
                    {layers.disruptions ? <Eye className="h-3 w-3 text-rose-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>

                  <button
                    onClick={() => onToggleLayer("proposedPlan")}
                    className={`flex w-full items-center justify-between rounded px-2 py-1 transition-colors text-[11px] ${
                      layers.proposedPlan ? "bg-blue-50 text-blue-900 font-medium" : "text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="h-3 w-3 text-blue-600" />
                      <span>Proposed Plan</span>
                    </div>
                    {layers.proposedPlan ? <Eye className="h-3 w-3 text-blue-600" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
