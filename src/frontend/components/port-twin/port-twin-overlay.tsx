"use client";

import React, { useState } from "react";
import {
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
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
  Play,
  Pause,
  RotateCcw,
  Clock,
  Activity,
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
  // Simulation Controls
  isPlaying: boolean;
  onTogglePlay: () => void;
  simSpeed: 1 | 2 | 5;
  onChangeSpeed: (speed: 1 | 2 | 5) => void;
  onResetSimulation: () => void;
  simClock: string;
  activeTransitCount: number;
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
  isPlaying,
  onTogglePlay,
  simSpeed,
  onChangeSpeed,
  onResetSimulation,
  simClock,
  activeTransitCount,
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

      {/* 2. SIMULATION CONTROLS DECK (Top-Center) */}
      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm text-xs text-slate-800">
          {/* Play / Pause Toggle */}
          <button
            onClick={onTogglePlay}
            className={`flex h-6 w-6 items-center justify-center rounded font-semibold transition-all ${
              isPlaying
                ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                : "bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200"
            }`}
            title={isPlaying ? "Pause Simulation" : "Play Simulation"}
            aria-label={isPlaying ? "Pause Simulation" : "Start Simulation"}
          >
            {isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 ml-0.5 fill-current" />}
          </button>

          {/* Reset Route */}
          <button
            onClick={onResetSimulation}
            className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors"
            title="Reset Vessels to Route Start"
            aria-label="Reset Route"
          >
            <RotateCcw className="h-2.5 w-2.5" />
          </button>

          <div className="h-3.5 w-px bg-slate-200" />

          {/* Speed Multipliers */}
          <div className="flex items-center gap-0.5 rounded bg-slate-100 p-0.5 border border-slate-200">
            {([1, 2, 5] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold transition-colors ${
                  simSpeed === s
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="h-3.5 w-px bg-slate-200" />

          {/* Simulated Clock */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-600">
            <Clock className="h-3 w-3 text-blue-600" />
            <span className="font-bold text-slate-900">{simClock}</span>
            <span className="text-slate-300">·</span>
            <span className="text-blue-700 font-semibold">{activeTransitCount} in transit</span>
          </div>
        </div>
      </div>

      {/* 3. CAMERA CONTROLS (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
        <div className="flex flex-col rounded-lg border border-slate-200/90 bg-white/95 shadow-md backdrop-blur-sm overflow-hidden text-slate-700">
          <button
            onClick={onZoomIn}
            className="flex h-8 w-8 items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-colors border-b border-slate-100"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onZoomOut}
            className="flex h-8 w-8 items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-colors border-b border-slate-100"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onTogglePitch}
            className={`flex h-8 w-8 items-center justify-center transition-colors border-b border-slate-100 ${
              is25DPitch ? "bg-blue-50 text-blue-700 font-bold" : "hover:bg-slate-100"
            }`}
            title={is25DPitch ? "2.5D Aerial Tilt Active" : "Top-down 2D View"}
            aria-label="Toggle 2.5D Aerial Tilt"
          >
            <Layers className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onResetView}
            className="flex h-8 w-8 items-center justify-center hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Reset to Port Overview"
            aria-label="Reset View"
          >
            <Maximize2 className="h-3.5 w-3.5" />
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
