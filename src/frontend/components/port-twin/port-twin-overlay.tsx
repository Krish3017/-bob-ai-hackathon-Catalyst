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
  FastForward,
  Clock,
  Activity,
  AlertTriangle,
  Sparkles,
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
  // Phase 2 Simulation Controls
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
  const [layersOpen, setLayersOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(false);

  return (
    <>
      {/* 1. TOP TELEMETRY RIBBON */}
      <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left: Port Status Pill */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/85 px-4 py-2 text-slate-100 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide uppercase text-white">
              NaviOps Port Twin
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300">
            <Radio className="h-3 w-3" />
            <span>OPERATIONAL TWIN 2.5D</span>
          </div>
        </div>

        {/* Right: Operational Telemetry Badges */}
        <div className="pointer-events-auto hidden md:flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/85 px-3 py-1.5 shadow-xl backdrop-blur-md text-[11px]">
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300">
            <Ship className="h-3.5 w-3.5 text-cyan-400" />
            <span>Fleet:</span>
            <span className="font-bold text-white font-mono">{stats.totalVessels}</span>
            <span className="text-[10px] text-slate-400">
              ({stats.berthedVessels} berthed · {stats.waitingVessels} queue)
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300">
            <Anchor className="h-3.5 w-3.5 text-emerald-400" />
            <span>Berths:</span>
            <span className="font-bold text-white font-mono">
              {stats.activeBerths}/{stats.totalBerths}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300">
            <Cpu className="h-3.5 w-3.5 text-blue-400" />
            <span>STS Cranes:</span>
            <span className="font-bold text-white font-mono">
              {stats.operationalCranes}/{stats.totalCranes}
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-1.5 px-2 py-1 text-slate-300">
            <Boxes className="h-3.5 w-3.5 text-amber-400" />
            <span>Yard Load:</span>
            <span className="font-bold text-white font-mono">
              {stats.avgYardUtilization}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. PHASE 2 SIMULATION CONTROL DECK (TOP-CENTER) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-slate-900/90 px-4 py-2 shadow-2xl backdrop-blur-md text-xs text-slate-200">
          {/* Play / Pause Toggle */}
          <button
            onClick={onTogglePlay}
            className={`flex h-7 w-7 items-center justify-center rounded-lg font-semibold transition-all ${
              isPlaying
                ? "bg-cyan-500 text-slate-950 shadow-[0_0_12px_#06b6d4] hover:bg-cyan-400"
                : "bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700"
            }`}
            title={isPlaying ? "Pause Simulation" : "Start Vessel Movement Simulation"}
            aria-label={isPlaying ? "Pause Simulation" : "Start Simulation"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 ml-0.5 fill-current" />}
          </button>

          {/* Reset Route */}
          <button
            onClick={onResetSimulation}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:bg-slate-800 hover:text-white transition-colors"
            title="Reset Vessels to Route Origin"
            aria-label="Reset Route"
          >
            <RotateCcw className="h-3 w-3" />
          </button>

          <div className="h-4 w-px bg-slate-700" />

          {/* Speed Multiplier */}
          <div className="flex items-center gap-1 rounded-lg bg-slate-950/60 p-0.5 border border-slate-800">
            {([1, 2, 5] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold transition-colors ${
                  simSpeed === s
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Simulated Clock & Transit Status */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span className="text-white font-semibold">{simClock}</span>
            </div>
            <span className="text-slate-600">·</span>
            <div className="flex items-center gap-1 text-cyan-300">
              <Activity className="h-3 w-3 animate-pulse" />
              <span>{activeTransitCount} In Transit</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CAMERA & NAVIGATION CONTROLS (BOTTOM-RIGHT) */}
      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-2">
        <div className="flex flex-col rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden">
          <button
            onClick={onZoomIn}
            className="flex h-9 w-9 items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="flex h-9 w-9 items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-800"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={onTogglePitch}
            className={`flex h-9 w-9 items-center justify-center transition-colors border-b border-slate-800 ${
              is25DPitch ? "bg-cyan-500/20 text-cyan-400" : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            title={is25DPitch ? "2.5D Isometric Tilt Active" : "Switch to 2.5D Tilt"}
            aria-label="Toggle 2.5D Isometric Tilt"
          >
            <Layers className="h-4 w-4" />
          </button>
          <button
            onClick={onResetView}
            className="flex h-9 w-9 items-center justify-center text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            title="Fit to Terminal (Reset View)"
            aria-label="Fit to Terminal"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4. LAYER VISIBILITY DRAWER (BOTTOM-LEFT) */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-2 max-w-[260px]">
        {/* Layer Visibility Box */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-2xl backdrop-blur-md overflow-hidden text-xs text-slate-200">
          <div
            onClick={() => setLayersOpen(!layersOpen)}
            className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer bg-slate-800/60 hover:bg-slate-800 transition-colors border-b border-slate-800"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span className="font-semibold text-slate-200 text-[11px] tracking-wide uppercase">
                Terminal Layers
              </span>
            </div>
            {layersOpen ? (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            )}
          </div>

          {layersOpen && (
            <div className="p-2 space-y-1">
              <button
                onClick={() => onToggleLayer("vessels")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.vessels ? "bg-slate-800/80 text-white" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ship className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Vessels Fleet</span>
                </div>
                {layers.vessels ? <Eye className="h-3 w-3 text-cyan-400" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <button
                onClick={() => onToggleLayer("berths")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.berths ? "bg-slate-800/80 text-white" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Anchor className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Quay Berths</span>
                </div>
                {layers.berths ? <Eye className="h-3 w-3 text-emerald-400" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <button
                onClick={() => onToggleLayer("cranes")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.cranes ? "bg-slate-800/80 text-white" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-blue-400" />
                  <span>STS Quay Cranes (Active)</span>
                </div>
                {layers.cranes ? <Eye className="h-3 w-3 text-blue-400" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <button
                onClick={() => onToggleLayer("yards")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.yards ? "bg-slate-800/80 text-white" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Boxes className="h-3.5 w-3.5 text-amber-400" />
                  <span>Container Yards (2.5D)</span>
                </div>
                {layers.yards ? <Eye className="h-3 w-3 text-amber-400" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <button
                onClick={() => onToggleLayer("routes")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.routes ? "bg-slate-800/80 text-white" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Navigation Routes</span>
                </div>
                {layers.routes ? <Eye className="h-3 w-3 text-cyan-400" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <button
                onClick={() => onToggleLayer("fairway")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.fairway ? "bg-slate-800/80 text-white" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Navigation className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Approach Fairway & Buoys</span>
                </div>
                {layers.fairway ? <Eye className="h-3 w-3 text-indigo-400" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <button
                onClick={() => onToggleLayer("anchorages")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.anchorages ? "bg-slate-800/80 text-white" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Compass className="h-3.5 w-3.5 text-teal-400" />
                  <span>Anchorage Basins</span>
                </div>
                {layers.anchorages ? <Eye className="h-3 w-3 text-teal-400" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <div className="pt-1 border-t border-slate-800/60 my-1" />

              {/* Phase 3: Disruptions & Optimization Overlays */}
              <button
                onClick={() => onToggleLayer("disruptions")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.disruptions ? "bg-rose-950/40 text-rose-200 border border-rose-500/30" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                  <span>Disruption Halos</span>
                </div>
                {layers.disruptions ? <Eye className="h-3 w-3 text-rose-400" /> : <EyeOff className="h-3 w-3" />}
              </button>

              <button
                onClick={() => onToggleLayer("proposedPlan")}
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 transition-colors ${
                  layers.proposedPlan ? "bg-cyan-950/40 text-cyan-200 border border-cyan-500/30" : "text-slate-500 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Proposed Plan Vectors</span>
                </div>
                {layers.proposedPlan ? <Eye className="h-3 w-3 text-cyan-400" /> : <EyeOff className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>

        {/* Minimal Legend Toggle */}
        <div className="rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-xl backdrop-blur-md overflow-hidden text-xs text-slate-200">
          <button
            onClick={() => setLegendOpen(!legendOpen)}
            className="flex w-full items-center justify-between px-3.5 py-2 hover:bg-slate-800/60 transition-colors"
          >
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              Map Legend
            </span>
            {legendOpen ? (
              <ChevronDown className="h-3 w-3 text-slate-400" />
            ) : (
              <ChevronUp className="h-3 w-3 text-slate-400" />
            )}
          </button>

          {legendOpen && (
            <div className="p-3 pt-1 border-t border-slate-800 space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-emerald-500/80 border border-emerald-400/40"></span>
                <span className="text-slate-300">Available Berth</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-cyan-500/80 border border-cyan-400/40"></span>
                <span className="text-slate-300">Occupied / Working Berth</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-rose-500/80 border border-rose-400/40"></span>
                <span className="text-slate-300">Maintenance / Offline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border border-rose-500 bg-rose-500/30 animate-ping"></span>
                <span className="text-rose-300">Active Disruption Halo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-cyan-300 border-t-2 border-dashed border-cyan-400"></span>
                <span className="text-cyan-300">Proposed Assignment Vector</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
                <span className="text-slate-300">Active STS Crane (Working)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-cyan-400 border-t border-dashed border-cyan-300"></span>
                <span className="text-slate-300">Navigation Route Path</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-4 rounded-sm bg-indigo-900/40 border border-indigo-400/30"></span>
                <span className="text-slate-300">Navigation Fairway</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
