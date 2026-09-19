"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Zap,
  FlaskConical,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import {
  PortTwinDisruption,
  PortTwinOptimizationRecommendation,
  PortTwinScenarioPreset,
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
    <div className="w-full rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden text-xs text-slate-800">
      {/* HEADER & TAB NAVIGATION STRIP */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2 hidden sm:inline">
            Operational Intelligence:
          </span>

          <button
            onClick={() => {
              onChangeTab("disruptions");
              setIsOpen(true);
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              activeTab === "disruptions"
                ? "bg-white text-rose-700 border border-slate-200 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>Disruptions & Sentinel</span>
            <span className="ml-1 rounded-full bg-rose-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-rose-700">
              {disruptions.length}
            </span>
          </button>

          <button
            onClick={() => {
              onChangeTab("optimization");
              setIsOpen(true);
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              activeTab === "optimization"
                ? "bg-white text-blue-700 border border-slate-200 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Zap className="h-3.5 w-3.5 text-blue-600" />
            <span>OR-Tools Recommendations</span>
            <span className="ml-1 rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-mono font-bold text-blue-700">
              {recommendations.length}
            </span>
          </button>

          <button
            onClick={() => {
              onChangeTab("scenarios");
              setIsOpen(true);
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              activeTab === "scenarios"
                ? "bg-white text-amber-800 border border-slate-200 shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
            <span>What-If Studio</span>
            {activeScenario && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>
        </div>

        {/* Minimize / Expand Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
          title={isOpen ? "Minimize Intelligence Deck" : "Expand Intelligence Deck"}
          aria-label={isOpen ? "Minimize Intelligence Deck" : "Expand Intelligence Deck"}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
      </div>

      {/* TAB BODY (WHEN EXPANDED) */}
      {isOpen && (
        <div className="p-4 space-y-3">
          {/* 1. DISRUPTIONS & SENTINEL TAB */}
          {activeTab === "disruptions" && (
            <div className="space-y-3">
              {/* Risk Exposure Banner */}
              <div className="flex flex-wrap items-center justify-between rounded-lg bg-rose-50/70 border border-rose-200 px-3.5 py-2 text-[11px]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-rose-900">Proactive Disruption Sentinel</span>
                    <span className="text-slate-500 block text-[10px]">
                      Quantified financial exposure across active quayside & weather alerts
                    </span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-rose-700 font-bold text-xs">${totalRiskExposure.toLocaleString()} USD</span>
                  <span className="text-[10px] text-slate-500 block">Total Risk Exposure</span>
                </div>
              </div>

              {/* Disruption Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {disruptions.map((d) => {
                  const isSelected = selectedDisruptionId === d.id;
                  const isCrit = d.severity === "Critical";
                  return (
                    <div
                      key={d.id}
                      onClick={() => onSelectDisruption(d)}
                      className={`rounded-lg p-3 cursor-pointer border transition-all ${
                        isSelected
                          ? "bg-rose-50/60 border-rose-400 shadow-sm ring-1 ring-rose-400"
                          : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold font-mono uppercase ${
                            isCrit ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.severity}
                        </span>
                        <span className="text-[10px] font-mono text-rose-700 font-semibold">
                          ${d.estimated_risk_usd.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-[11px] leading-snug">
                        {d.title}
                      </h4>
                      <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                        {d.description}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 font-mono">Target: {d.affected_resource_code}</span>
                        <span className="text-blue-700 font-medium flex items-center gap-0.5 hover:underline">
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
            <div className="space-y-3">
              {/* Proposed Plan Control Bar */}
              <div className="flex flex-wrap items-center justify-between rounded-lg bg-blue-50/70 border border-blue-200 px-3.5 py-2 text-[11px] gap-2">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-blue-950">Google OR-Tools CP-SAT 72h Schedule</span>
                    <span className="text-slate-500 block text-[10px]">
                      Optimal berth-crane pairings minimizing anchorage queue idle time
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right font-mono text-[10px] hidden sm:block">
                    <span className="text-emerald-700 font-bold">-{totalWaitingReduction.toFixed(1)}h wait</span>
                    <span className="text-slate-500 block">+${totalDemurrageSavings.toLocaleString()} saved</span>
                  </div>
                  <button
                    onClick={onToggleProposedPlan}
                    className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all ${
                      showProposedPlan
                        ? "bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {showProposedPlan ? "Proposed Plan (ON)" : "Show Proposed Overlay"}
                  </button>
                </div>
              </div>

              {/* Recommendation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recommendations.map((r) => {
                  const isSelected = selectedRecommendationId === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => onSelectRecommendation(r)}
                      className={`rounded-lg p-3 cursor-pointer border transition-all ${
                        isSelected
                          ? "bg-blue-50/60 border-blue-400 shadow-sm ring-1 ring-blue-400"
                          : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold font-mono text-blue-800">
                          PROPOSED → {r.recommended_berth_code}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                          -${r.demurrage_savings_usd.toLocaleString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-[11px] leading-snug">
                        {r.vessel_name}
                      </h4>
                      <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                        {r.assignment_rationale}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                        <span className="text-emerald-700 font-mono">-{r.waiting_reduction_hours}h wait</span>
                        <span className="text-blue-700 font-medium flex items-center gap-0.5 hover:underline">
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
            <div className="space-y-3">
              {/* Active Scenario Banner */}
              {activeScenario ? (
                <div className="flex flex-wrap items-center justify-between rounded-lg bg-amber-50 border border-amber-300 p-3 text-[11px] gap-2">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-amber-700 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{activeScenario.title}</span>
                        <span className="rounded bg-amber-200 px-1.5 py-0.2 text-[9px] font-mono font-bold text-amber-900">
                          SIMULATING
                        </span>
                      </div>
                      <span className="text-slate-600 text-[10px] block mt-0.5">
                        {activeScenario.mitigation_strategy}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right font-mono text-[10px]">
                      <span className="text-rose-700 font-bold block">
                        +{simulationDeltas?.delay_hours || activeScenario.expected_delay_increase_hours}h delay
                      </span>
                      <span className="text-amber-800">
                        +${(simulationDeltas?.demurrage_usd || activeScenario.expected_demurrage_delta_usd).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={onClearScenario}
                      className="flex items-center gap-1 rounded bg-white px-2.5 py-1 text-[10px] font-semibold text-slate-700 border border-slate-300 hover:bg-slate-100 transition-colors"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[11px] flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2">
                    <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
                    Select a disruption scenario below to simulate counterfactual CP-SAT schedules:
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">PORT DIGITAL TWIN</span>
                </div>
              )}

              {/* Scenario Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {scenarioPresets.map((scen) => {
                  const isActive = activeScenario?.id === scen.id;
                  return (
                    <div
                      key={scen.id}
                      onClick={() => onActivateScenario(scen)}
                      className={`rounded-lg p-3 cursor-pointer border transition-all ${
                        isActive
                          ? "bg-amber-50/80 border-amber-400 shadow-sm ring-1 ring-amber-400"
                          : "bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold font-mono text-amber-900">
                          {scen.affected_code}
                        </span>
                        <span className="text-[10px] font-mono text-rose-700 font-semibold">
                          +{scen.expected_delay_increase_hours}h
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-[11px] leading-snug">
                        {scen.title}
                      </h4>
                      <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
                        {scen.description}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                        <span className="text-amber-800 font-mono font-medium">+${scen.expected_demurrage_delta_usd.toLocaleString()}</span>
                        <span className="text-blue-700 font-medium flex items-center gap-0.5 hover:underline">
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
  );
}
