"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Zap,
  FlaskConical,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Navigation,
  Eye,
  Activity,
  Layers,
  Info,
} from "lucide-react";
import {
  PortTwinDisruption,
  PortTwinOptimizationRecommendation,
  PortTwinScenarioPreset,
  PORT_DISRUPTIONS,
  PORT_OPTIMIZATION_RECOMMENDATIONS,
  PORT_SCENARIO_PRESETS,
} from "@/data/port-twin-data";

export type IntelligenceTab = "disruptions" | "optimization" | "scenarios";

interface PortTwinIntelligenceProps {
  activeTab: IntelligenceTab;
  onChangeTab: (tab: IntelligenceTab) => void;
  // Disruption Handlers
  disruptions: PortTwinDisruption[];
  selectedDisruptionId: string | null;
  onSelectDisruption: (d: PortTwinDisruption) => void;
  // Optimization Handlers
  recommendations: PortTwinOptimizationRecommendation[];
  selectedRecommendationId: string | null;
  onSelectRecommendation: (rec: PortTwinOptimizationRecommendation) => void;
  showProposedPlan: boolean;
  onToggleProposedPlan: () => void;
  // Scenario Handlers
  scenarioPresets: PortTwinScenarioPreset[];
  activeScenario: PortTwinScenarioPreset | null;
  onActivateScenario: (preset: PortTwinScenarioPreset) => void;
  onClearScenario: () => void;
  isSimulating: boolean;
  simulationDeltas: {
    delay_hours: number;
    demurrage_usd: number;
    congestion_points: number;
  } | null;
}

export function PortTwinIntelligence({
  activeTab,
  onChangeTab,
  disruptions,
  selectedDisruptionId,
  onSelectDisruption,
  recommendations,
  selectedRecommendationId,
  onSelectRecommendation,
  showProposedPlan,
  onToggleProposedPlan,
  scenarioPresets,
  activeScenario,
  onActivateScenario,
  onClearScenario,
  isSimulating,
  simulationDeltas,
}: PortTwinIntelligenceProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Aggregated Sentinel Financial Risk
  const totalRiskExposure = disruptions.reduce((acc, d) => acc + d.estimated_risk_usd, 0);

  // Aggregated Optimization Savings
  const totalWaitingReduction = recommendations.reduce((acc, r) => acc + r.waiting_reduction_hours, 0);
  const totalDemurrageSavings = recommendations.reduce((acc, r) => acc + r.demurrage_savings_usd, 0);

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[680px] max-w-[calc(100vw-3rem)] pointer-events-auto">
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-md overflow-hidden text-xs text-slate-200 transition-all">
        {/* TOP TAB STRIP */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onChangeTab("disruptions");
                setIsOpen(true);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-all ${
                activeTab === "disruptions"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
              <span>Disruptions & Sentinel</span>
              <span className="ml-1 rounded-full bg-rose-500/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-200">
                {disruptions.length}
              </span>
            </button>

            <button
              onClick={() => {
                onChangeTab("optimization");
                setIsOpen(true);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-all ${
                activeTab === "optimization"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>OR-Tools Recommendations</span>
              <span className="ml-1 rounded-full bg-cyan-500/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-cyan-200">
                {recommendations.length}
              </span>
            </button>

            <button
              onClick={() => {
                onChangeTab("scenarios");
                setIsOpen(true);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-all ${
                activeTab === "scenarios"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
              <span>What-If Studio</span>
              {activeScenario && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Minimize / Expand Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            title={isOpen ? "Minimize Intelligence Deck" : "Expand Intelligence Deck"}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        {/* TAB BODY (WHEN EXPANDED) */}
        {isOpen && (
          <div className="p-3 max-h-[260px] overflow-y-auto space-y-2">
            {/* 1. DISRUPTIONS & SENTINEL TAB */}
            {activeTab === "disruptions" && (
              <div className="space-y-2">
                {/* Sentinel Risk Banner */}
                <div className="flex items-center justify-between rounded-xl bg-rose-950/40 border border-rose-500/30 px-3 py-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-rose-300">Proactive Disruption Sentinel</span>
                      <span className="text-slate-400 block text-[10px]">
                        Quantified financial exposure across active quayside & weather incidents
                      </span>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-rose-400 font-bold text-xs">${totalRiskExposure.toLocaleString()} USD</span>
                    <span className="text-[10px] text-slate-400 block">Total Risk</span>
                  </div>
                </div>

                {/* Disruption Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {disruptions.map((d) => {
                    const isSelected = selectedDisruptionId === d.id;
                    const isCrit = d.severity === "Critical";
                    return (
                      <div
                        key={d.id}
                        onClick={() => onSelectDisruption(d)}
                        className={`rounded-xl p-2.5 cursor-pointer border transition-all ${
                          isSelected
                            ? "bg-rose-500/20 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]"
                            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-bold font-mono uppercase ${
                              isCrit ? "bg-rose-500/30 text-rose-300" : "bg-amber-500/30 text-amber-300"
                            }`}
                          >
                            {d.severity}
                          </span>
                          <span className="text-[10px] font-mono text-rose-400 font-semibold">
                            ${d.estimated_risk_usd.toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-[11px] leading-snug line-clamp-1">
                          {d.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {d.description}
                        </p>
                        <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[9px]">
                          <span className="text-slate-400 font-mono">Target: {d.affected_resource_code}</span>
                          <span className="text-cyan-400 font-medium flex items-center gap-0.5">
                            Locate on Map <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. OPTIMIZATION RECOMMENDATIONS TAB */}
            {activeTab === "optimization" && (
              <div className="space-y-2">
                {/* Proposed Plan Control Bar */}
                <div className="flex items-center justify-between rounded-xl bg-cyan-950/40 border border-cyan-500/30 px-3 py-2 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-cyan-400 shrink-0" />
                    <div>
                      <span className="font-semibold text-cyan-300">Google OR-Tools CP-SAT 72h Schedule</span>
                      <span className="text-slate-400 block text-[10px]">
                        Optimal berth-crane pairings minimizing anchorage queue idle time
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono text-[10px] hidden sm:block">
                      <span className="text-emerald-400 font-bold">-{totalWaitingReduction.toFixed(1)}h wait</span>
                      <span className="text-slate-400 block">+${totalDemurrageSavings.toLocaleString()} saved</span>
                    </div>
                    <button
                      onClick={onToggleProposedPlan}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                        showProposedPlan
                          ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_#06b6d4]"
                          : "bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:bg-slate-700"
                      }`}
                    >
                      {showProposedPlan ? "Proposed Plan (ON)" : "Show Proposed Overlay"}
                    </button>
                  </div>
                </div>

                {/* Recommendation Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {recommendations.map((r) => {
                    const isSelected = selectedRecommendationId === r.id;
                    return (
                      <div
                        key={r.id}
                        onClick={() => onSelectRecommendation(r)}
                        className={`rounded-xl p-2.5 cursor-pointer border transition-all ${
                          isSelected
                            ? "bg-cyan-500/20 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.2 text-[9px] font-bold font-mono text-cyan-300 border border-cyan-500/40">
                            PROPOSED → {r.recommended_berth_code}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                            -${r.demurrage_savings_usd.toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-[11px] leading-snug">
                          {r.vessel_name}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {r.assignment_rationale}
                        </p>
                        <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[9px]">
                          <span className="text-emerald-400 font-mono">-{r.waiting_reduction_hours}h wait</span>
                          <span className="text-cyan-300 font-medium flex items-center gap-0.5">
                            Show Vector <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. WHAT-IF SCENARIO STUDIO TAB */}
            {activeTab === "scenarios" && (
              <div className="space-y-2">
                {/* Active Scenario Banner */}
                {activeScenario ? (
                  <div className="flex items-center justify-between rounded-xl bg-amber-950/50 border border-amber-500/50 p-2.5 text-[11px] animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{activeScenario.title}</span>
                          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-mono text-amber-300 border border-amber-500/30">
                            SIMULATING
                          </span>
                        </div>
                        <span className="text-slate-300 text-[10px] block mt-0.5">
                          {activeScenario.mitigation_strategy}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono text-[10px]">
                        <span className="text-rose-400 font-bold block">
                          +{simulationDeltas?.delay_hours || activeScenario.expected_delay_increase_hours}h delay
                        </span>
                        <span className="text-amber-400">
                          +${(simulationDeltas?.demurrage_usd || activeScenario.expected_demurrage_delta_usd).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={onClearScenario}
                        className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-200 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-800/60 border border-slate-700/80 p-2 text-[11px] flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <FlaskConical className="h-3.5 w-3.5 text-amber-400" />
                      Select a disruption scenario below to simulate counterfactual CP-SAT schedules:
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">PORT DIGITAL TWIN</span>
                  </div>
                )}

                {/* Scenario Presets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {scenarioPresets.map((scen) => {
                    const isActive = activeScenario?.id === scen.id;
                    return (
                      <div
                        key={scen.id}
                        onClick={() => onActivateScenario(scen)}
                        className={`rounded-xl p-2.5 cursor-pointer border transition-all ${
                          isActive
                            ? "bg-amber-500/20 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                            : "bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="rounded-full bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold font-mono text-amber-300 border border-amber-500/40">
                            {scen.affected_code}
                          </span>
                          <span className="text-[10px] font-mono text-rose-400 font-semibold">
                            +{scen.expected_delay_increase_hours}h
                          </span>
                        </div>
                        <h4 className="font-bold text-white text-[11px] leading-snug">
                          {scen.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                          {scen.description}
                        </p>
                        <div className="mt-2 pt-1.5 border-t border-slate-700/60 flex items-center justify-between text-[9px]">
                          <span className="text-amber-400 font-mono">+${scen.expected_demurrage_delta_usd.toLocaleString()}</span>
                          <span className="text-cyan-300 font-medium flex items-center gap-0.5">
                            {isActive ? "Simulating" : "Test Scenario"} <ArrowRight className="h-2.5 w-2.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
