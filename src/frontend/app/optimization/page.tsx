"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/design-system/table";
import { Badge } from "@/design-system/badge";
import { api } from "@/lib/api";
import { OptimizationRun, ScheduleItem, DashboardSummary, Berth, Vessel, Crane, SimulationResponse, SimulateOptimizationRequest } from "@/types";
import { formatDateTime, formatDuration, getCongestionMeta } from "@/lib/utils";
import {
  Zap,
  CheckCircle2,
  Clock,
  Anchor,
  Layers,
  Calendar,
  Search,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  Check,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Leaf,
  FlaskConical,
  Sliders,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/design-system/toast";
import { useConfirm } from "@/components/design-system/confirm-dialog";

export default function OptimizationPage() {
  const [run, setRun] = useState<OptimizationRun | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("viewer");
  const [loading, setLoading] = useState(true);
  const [isSolving, setIsSolving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // What-If Scenario Sandbox State
  const [activeTab, setActiveTab] = useState<"live" | "whatif">("live");
  const [simBerths, setSimBerths] = useState<string[]>([]);
  const [simCranes, setSimCranes] = useState<string[]>([]);
  const [simDelayHours, setSimDelayHours] = useState<number>(0);
  const [scenarioName, setScenarioName] = useState<string>("Custom Scenario");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);

  const toast = useToast();
  const confirm = useConfirm();

  const loadData = async () => {
    if (typeof window !== "undefined") {
      setCurrentRole(localStorage.getItem("naviops_role") || "viewer");
    }
    try {
      const [sum, bList, vList, cList] = await Promise.all([
        api.getDashboardSummary(),
        api.getBerths(),
        api.getVessels(),
        api.getCranes(),
      ]);
      setSummary(sum);
      setBerths(bList);
      setVessels(vList);
      setCranes(cList);
      try {
        const latestRun = await api.getLatestOptimizationRun();
        setRun(latestRun);
      } catch (runErr: any) {
        if (runErr?.status !== 404) {
          console.error("Error loading latest optimization run:", runErr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePlan = async () => {
    if (currentRole === "viewer") {
      toast.error(
        "Permission denied",
        "Viewer role cannot trigger optimization runs. Admin or Operations role required."
      );
      return;
    }
    setIsSolving(true);
    setApplySuccess(null);
    try {
      const newRun = await api.runOptimization();
      setRun(newRun);
      const sum = await api.getDashboardSummary();
      setSummary(sum);
      toast.success(
        "Optimization completed",
        "72-hour operational schedule generated with optimal berth allocations."
      );
    } catch (err: any) {
      toast.error("Optimization solver failed", err.message || "Unable to solve.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleApplyPlan = async () => {
    if (currentRole !== "admin") {
      toast.error(
        "Permission denied",
        "Only Port Managers / Admins have authority to approve and apply operational schedules."
      );
      return;
    }
    if (!run) return;

    const confirmed = await confirm({
      title: "Apply optimization plan?",
      description:
        "This will update berth and resource assignments using the selected 72-hour optimization plan. Live operational allocations will be modified.",
      confirmText: "Apply plan",
      cancelText: "Cancel",
      variant: "default",
    });

    if (!confirmed) return;

    setIsApplying(true);
    try {
      const res = await api.applySchedule(run.id);
      setApplySuccess(res.message);
      setRun({ ...run, applied: true });
      toast.success(
        "Optimization plan applied",
        "Live berth allocations and vessel schedules have been updated."
      );
    } catch (err: any) {
      toast.error(
        "Failed to apply schedule",
        err.message || "An unexpected error occurred."
      );
    } finally {
      setIsApplying(false);
    }
  };

  const handleRunSimulation = async (customOverrides?: Partial<SimulateOptimizationRequest>) => {
    setIsSimulating(true);
    try {
      const payload: SimulateOptimizationRequest = {
        scenario_name: customOverrides?.scenario_name || scenarioName,
        unavailable_berth_ids: customOverrides?.unavailable_berth_ids ?? simBerths,
        unavailable_crane_ids: customOverrides?.unavailable_crane_ids ?? simCranes,
        vessel_delay_hours: customOverrides?.vessel_delay_hours ?? (simDelayHours > 0 ? Object.fromEntries(vessels.map(v => [v.id, simDelayHours])) : {}),
      };
      const res = await api.simulateOptimization(payload);
      setSimResult(res);
      toast.success("Simulation Complete", `Counterfactual analysis computed for ${res.scenario_name}.`);
    } catch (err: any) {
      toast.error("Simulation Failed", err.message || "Failed to execute simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleApplyPreset = (preset: "crane" | "berth" | "storm") => {
    if (preset === "crane") {
      const cr2 = cranes.find(c => c.crane_code === "CR-02")?.id || (cranes.length > 1 ? cranes[1].id : "");
      setSimCranes(cr2 ? [cr2] : []);
      setSimBerths([]);
      setSimDelayHours(0);
      setScenarioName("Crane CR-02 Outage (12h)");
      handleRunSimulation({
        scenario_name: "Crane CR-02 Outage (12h)",
        unavailable_crane_ids: cr2 ? [cr2] : [],
        unavailable_berth_ids: [],
        vessel_delay_hours: {}
      });
    } else if (preset === "berth") {
      const b1 = berths.find(b => b.berth_code === "B-01")?.id || (berths.length > 0 ? berths[0].id : "");
      setSimBerths(b1 ? [b1] : []);
      setSimCranes([]);
      setSimDelayHours(0);
      setScenarioName("Berth B-01 Emergency Maintenance (24h)");
      handleRunSimulation({
        scenario_name: "Berth B-01 Emergency Maintenance (24h)",
        unavailable_berth_ids: b1 ? [b1] : [],
        unavailable_crane_ids: [],
        vessel_delay_hours: {}
      });
    } else if (preset === "storm") {
      setSimBerths([]);
      setSimCranes([]);
      setSimDelayHours(6);
      setScenarioName("Severe Weather Fog (+6h fleet arrival delay)");
      const delays = Object.fromEntries(vessels.map(v => [v.id, 6]));
      handleRunSimulation({
        scenario_name: "Severe Weather Fog (+6h fleet arrival delay)",
        unavailable_berth_ids: [],
        unavailable_crane_ids: [],
        vessel_delay_hours: delays
      });
    }
  };

  const congestion = summary?.congestion;
  const metrics = run?.metrics;
  const schedules = run?.schedules || [];

  // Filter schedules by search
  const filteredSchedules = schedules.filter(
    (s) =>
      searchQuery === "" ||
      s.vessel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.vessel_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.berth_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group schedules by berth for Gantt visualization
  const berthRows = berths.map((b) => {
    const items = schedules.filter((s) => s.berth_id === b.id);
    return {
      berth: b,
      items,
    };
  });

  return (
    <AppShell
      title="72-Hour Operational Schedule Optimizer"
      description="Mathematical combinatorial solver (Google OR-Tools CP-SAT) for berth allocations and crane dispatch."
      congestionScore={congestion?.score ?? 0}
      congestionLevel={getCongestionMeta(congestion?.score ?? 0).label}
      onRefresh={loadData}
      isRefreshing={loading}
    >
      {/* 1. Optimizer Header Banner & Execution Toolbar */}
      <div className="rounded-xl border border-[#E3E5E0] bg-white p-5 shadow-card">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E1EFEC] text-[#004741] border border-[#E1EFEC]">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#102A27] leading-tight">
                  72-Hour Quayside Schedule Optimizer
                </h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[#5C6B68]">
                    Google OR-Tools CP-SAT Solver
                  </span>
                  <span className="text-[#D5D9D3]">·</span>
                  {run?.applied ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" />
                      Active Approved Schedule
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <Clock className="h-3 w-3" />
                      Proposed Draft Plan (Pending Approval)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Run Solver Button */}
            <button
              type="button"
              onClick={handleGeneratePlan}
              disabled={isSolving || currentRole === "viewer"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50",
                "bg-[#004741] hover:bg-[#003B36]"
              )}
            >
              <Zap className={cn("h-3.5 w-3.5 text-white", isSolving && "animate-spin")} />
              <span className="text-white">{isSolving ? "Solving Model..." : "Generate Optimized Plan"}</span>
            </button>

            {/* Approve & Apply Button (Admin only) */}
            {currentRole === "admin" && (
              <button
                type="button"
                onClick={handleApplyPlan}
                disabled={isApplying || !run || run.applied}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50",
                  run?.applied
                    ? "border border-[#E3E5E0] bg-[#F7F6F2] text-[#899491] cursor-not-allowed"
                    : "border border-emerald-600 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                <span className="text-white">
                  {isApplying
                    ? "Applying Schedule..."
                    : run?.applied
                    ? "Schedule Applied"
                    : "Approve & Apply Plan"}
                </span>
              </button>
            )}

            {currentRole === "operations" && !run?.applied && (
              <span className="text-[11px] text-[#899491] italic">
                (Admin approval required to apply)
              </span>
            )}
          </div>
        </div>

        {applySuccess && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-800 font-medium animate-in fade-in duration-150">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{applySuccess}</span>
          </div>
        )}
      </div>

      {/* 2. Key Optimization Results Metrics (6-Metric Operations & ESG Dashboard) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Vessels Scheduled */}
        <div className="rounded-xl border border-[#E3E5E0] bg-white p-3.5 shadow-card">
          <div className="flex items-center justify-between text-xs text-[#5C6B68]">
            <span className="font-medium text-[11px]">Fleet</span>
            <Anchor className="h-3.5 w-3.5 text-[#899491]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#102A27]">
              {metrics?.vessels_scheduled ?? "—"}
            </span>
            <span className="text-[11px] text-[#5C6B68]">vessels</span>
          </div>
          <div className="mt-2 text-[10px] font-medium text-[#004741] border-t border-[#F0EDE4] pt-1.5 truncate">
            100% Non-Overlap
          </div>
        </div>

        {/* Expected Average Wait Time */}
        <div className="rounded-xl border border-[#E3E5E0] bg-white p-3.5 shadow-card">
          <div className="flex items-center justify-between text-xs text-[#5C6B68]">
            <span className="font-medium text-[11px]">Queue Wait</span>
            <Clock className="h-3.5 w-3.5 text-[#899491]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#102A27]">
              {metrics?.avg_waiting_hours ?? 0}h
            </span>
            <span className="text-[11px] text-[#5C6B68]">avg</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-700 border-t border-[#F0EDE4] pt-1.5 truncate">
            <TrendingDown className="h-3 w-3 shrink-0" />
            <span>
              {metrics && metrics.delay_reduction_pct > 0
                ? `-${metrics.delay_reduction_pct.toFixed(1)}% vs Base`
                : "Computed"}
            </span>
          </div>
        </div>

        {/* Demurrage ROI Avoided */}
        <div className="rounded-xl border border-[#E3E5E0] bg-gradient-to-br from-white to-[#E5F2EA]/30 p-3.5 shadow-card border-l-4 border-l-[#2F7D5B]">
          <div className="flex items-center justify-between text-xs text-[#5C6B68]">
            <span className="font-medium text-[11px]">Demurrage Avoided</span>
            <DollarSign className="h-3.5 w-3.5 text-[#2F7D5B]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-[#2F7D5B]">
              +${(metrics?.demurrage_saved_usd ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-[#2F7D5B] border-t border-[#F0EDE4] pt-1.5 truncate">
            ROI Positive ($1.25k/h)
          </div>
        </div>

        {/* GreenPort Decarbonization */}
        <div className="rounded-xl border border-[#E3E5E0] bg-gradient-to-br from-white to-[#E1F3F5]/30 p-3.5 shadow-card border-l-4 border-l-[#2F7D8C]">
          <div className="flex items-center justify-between text-xs text-[#5C6B68]">
            <span className="font-medium text-[11px]">CO₂ Abated</span>
            <Leaf className="h-3.5 w-3.5 text-[#2F7D8C]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold font-mono text-[#2F7D8C]">
              {(metrics?.co2_abated_mt ?? 0).toFixed(1)}
            </span>
            <span className="text-[11px] text-[#5C6B68]">MT</span>
          </div>
          <div className="mt-2 text-[10px] font-semibold text-[#2F7D8C] border-t border-[#F0EDE4] pt-1.5 truncate">
            IMO 2030 Offset
          </div>
        </div>

        {/* Berth Utilization Factor */}
        <div className="rounded-xl border border-[#E3E5E0] bg-white p-3.5 shadow-card">
          <div className="flex items-center justify-between text-xs text-[#5C6B68]">
            <span className="font-medium text-[11px]">Berth Efficiency</span>
            <Layers className="h-3.5 w-3.5 text-[#899491]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-[#102A27]">
              {Math.round((metrics?.berth_occupancy_ratio ?? 0) * 100)}%
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[#5C6B68] border-t border-[#F0EDE4] pt-1.5 truncate">
            Quayside Occupancy
          </div>
        </div>

        {/* Solver Solution Status */}
        <div className="rounded-xl border border-[#E3E5E0] bg-white p-3.5 shadow-card">
          <div className="flex items-center justify-between text-xs text-[#5C6B68]">
            <span className="font-medium text-[11px]">Solver Status</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-700 font-mono">
              {run?.status || "OPTIMAL"}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-[#5C6B68] border-t border-[#F0EDE4] pt-1.5 truncate">
            {run ? `Score: ${run.objective_value}` : "Ready"}
          </div>
        </div>
      </div>

      {/* View Switcher: Live 72h Schedule vs What-If Simulation Sandbox */}
      <div className="flex items-center gap-2 border-b border-[#E3E5E0] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("live")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
            activeTab === "live"
              ? "bg-[#102A27] text-white shadow-sm"
              : "bg-white/80 text-[#5C6B68] hover:text-[#102A27] border border-[#E3E5E0]"
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Live 72h Schedule & Gantt</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("whatif")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer",
            activeTab === "whatif"
              ? "bg-[#102A27] text-white shadow-sm"
              : "bg-white/80 text-[#5C6B68] hover:text-[#102A27] border border-[#E3E5E0]"
          )}
        >
          <FlaskConical className="h-3.5 w-3.5 text-[#E0A75E]" />
          <span>What-If Scenario Sandbox (Port Digital Twin)</span>
          <span className="rounded bg-[#E0A75E]/20 text-[#C25E00] px-1.5 py-0.5 text-[9px] font-bold">
            PRO
          </span>
        </button>
      </div>

      {activeTab === "live" ? (
        <>
          {/* 3. Interactive 72-Hour Visual Gantt Schedule */}
          <div className="rounded-xl border border-[#E3E5E0] bg-white shadow-card overflow-hidden">
            {/* Gantt Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3.5 border-b border-[#F0EDE4]">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#004741]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#102A27]">
              72-Hour Berth Occupancy Timeline
            </h3>
          </div>

          {/* Priority Color Legend */}
          <div className="flex items-center gap-3 text-xs text-[#5C6B68]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#B94A48]" />
              <span className="text-[11px]">Priority 1 (Critical)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#EA580C]" />
              <span className="text-[11px]">Priority 2 (High)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#2F7D8C]" />
              <span className="text-[11px]">Standard Fleet</span>
            </span>
          </div>
        </div>

        <div className="p-5 overflow-x-auto">
          <div className="min-w-[720px]">
            {/* Time Axis Header */}
            <div className="flex items-center mb-2 text-[11px] font-semibold text-[#899491] border-b border-[#F0EDE4] pb-2">
              <div className="w-32 shrink-0 text-[#5C6B68]">Quay Berth</div>
              <div className="flex-1 grid grid-cols-6 pl-2">
                <div>Now (0h)</div>
                <div>+12h</div>
                <div>+24h</div>
                <div>+36h</div>
                <div>+48h</div>
                <div>+60h</div>
              </div>
            </div>

            {/* Berth Rows */}
            <div className="space-y-3">
              {berthRows.map(({ berth, items }) => (
                <div key={berth.id} className="flex items-center gap-3">
                  {/* Berth Label Card */}
                  <div className="w-32 shrink-0 rounded-lg border border-[#E3E5E0] bg-[#F7F6F2] p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#102A27]">{berth.berth_code}</span>
                      <span className="text-[10px] text-[#5C6B68]">≤{berth.max_vessel_length}m</span>
                    </div>
                    <div className="text-[10px] text-[#5C6B68] truncate mt-0.5">
                      {berth.berth_name}
                    </div>
                  </div>

                  {/* Gantt Lane */}
                  <div className="relative h-14 flex-1 rounded-lg border border-[#E3E5E0] bg-white overflow-hidden shadow-2xs">
                    {/* Vertical Time Grid Dividers */}
                    <div className="absolute inset-0 grid grid-cols-6 pointer-events-none divide-x divide-slate-100" />

                    {/* Empty State when no vessels are assigned */}
                    {items.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#899491] italic pointer-events-none">
                        No vessels scheduled
                      </div>
                    )}

                    {/* Scheduled Vessel Blocks */}
                    {items.map((item) => {
                      const timelineStart = run?.planning_horizon_start
                        ? new Date(run.planning_horizon_start).getTime()
                        : new Date().getTime();
                      const start = new Date(item.planned_start).getTime();
                      const end = new Date(item.planned_end).getTime();

                      const startHours = Math.max(0, (start - timelineStart) / (1000 * 3600));
                      const durationHours = Math.max(2, (end - start) / (1000 * 3600));

                      const leftPct = Math.min(95, (startHours / 72) * 100);
                      const widthPct = Math.max(7, Math.min(100 - leftPct, (durationHours / 72) * 100));

                      // Look up vessel priority from vessels list for true semantic coloring
                      const vesselObj = vessels.find((v) => v.id === item.vessel_id);
                      const priority = vesselObj?.priority ?? 3;

                      const blockColor =
                        priority === 1
                          ? "bg-[#B94A48] hover:bg-[#9E3E3C] text-white border-[#B94A48]"
                          : priority === 2
                          ? "bg-[#EA580C] hover:bg-[#C2410C] text-white border-[#EA580C]"
                          : "bg-[#2F7D8C] hover:bg-[#256B79] text-white border-[#2F7D8C]";

                      return (
                        <div
                          key={item.id}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                          className={cn(
                            "absolute top-1.5 bottom-1.5 rounded-lg px-2 py-1 text-[10px] flex flex-col justify-center transition-colors cursor-pointer border truncate z-10 shadow-sm gantt-block",
                            blockColor
                          )}
                          title={`${item.vessel_name} (${item.vessel_code})\nStart: ${formatDateTime(item.planned_start)}\nEnd: ${formatDateTime(item.planned_end)}\nDuration: ${item.duration_hours}h\nCranes: ${item.assigned_cranes.join(", ")}\nReason: ${item.assignment_reason}`}
                        >
                          <span className="font-bold truncate leading-tight text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                            {item.vessel_name}
                          </span>
                          <span className="text-[9px] text-white/90 truncate leading-tight mt-0.5 font-medium">
                            {item.duration_hours}h · {item.assigned_cranes && item.assigned_cranes.length > 0 ? item.assigned_cranes.slice(0, 2).join(", ") : "Cranes"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Schedule Results & Assignment Rationales */}
      <div className="rounded-xl border border-[#E3E5E0] bg-white shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b border-[#F0EDE4]">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#102A27]">
              Discrete Vessel Assignment Rationales ({filteredSchedules.length})
            </h3>
            <p className="text-[11px] text-[#5C6B68]">
              Optimal non-overlapping schedule generated by the CP-SAT engine
            </p>
          </div>

          <div className="relative sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#899491]" />
            <input
              type="text"
              placeholder="Filter by vessel or berth..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E3E5E0] bg-[#F7F6F2] pl-8 pr-2.5 py-1 text-xs text-[#102A27] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#004741]"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vessel</TableHead>
              <TableHead>Berth Assignment</TableHead>
              <TableHead>Assigned Cranes</TableHead>
              <TableHead>Berthing Window</TableHead>
              <TableHead>Wait Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Solver Rationale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSchedules.length === 0 ? (
              <TableEmpty message="No active schedule records match search." colSpan={7} />
            ) : (
              filteredSchedules.map((item) => (
                <TableRow key={item.id} className="hover:bg-[#F7F6F2]/70 transition-colors">
                  <TableCell className="font-semibold text-[#102A27]">
                    <div>{item.vessel_name}</div>
                    <div className="text-[11px] font-mono font-normal text-[#899491]">
                      {item.vessel_code}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs font-medium text-[#102A27]">
                    <div className="flex items-center gap-1 text-[#004741]">
                      <Anchor className="h-3 w-3 text-[#004741]" />
                      <span>{item.berth_code}</span>
                    </div>
                    <div className="text-[10px] text-[#899491]">{item.berth_name}</div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.assigned_cranes.map((cCode, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded bg-[#F0EDE4] px-1.5 py-0.5 text-[10px] font-medium text-[#5C6B68] font-mono"
                        >
                          {cCode}
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell className="text-xs text-[#5C6B68]">
                    <div>{formatDateTime(item.planned_start)}</div>
                    <div className="text-[10px] text-[#899491]">
                      until {formatDateTime(item.planned_end)} ({item.duration_hours}h)
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs font-medium text-[#102A27]">
                    {item.waiting_time > 0 ? (
                      <span className="text-amber-700 font-semibold">
                        +{formatDuration(item.waiting_time)}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">0h (Direct)</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="status"
                      status={run?.applied ? "Applied" : item.status}
                      context="optimization"
                      size="sm"
                    >
                      {run?.applied ? "Applied" : item.status}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-xs text-[#5C6B68] max-w-sm">
                    {item.assignment_reason}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </>
    ) : (
      /* What-If Scenario Sandbox View */
      <div className="space-y-5 animate-in fade-in duration-200">
        {/* Configuration Card */}
        <div className="rounded-xl border border-[#E3E5E0] bg-white p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F0EDE4] gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#102A27] flex items-center gap-2">
                <Sliders className="h-4 w-4 text-[#004741]" />
                What-If Scenario Configuration Studio
              </h3>
              <p className="text-xs text-[#5C6B68] mt-0.5">
                Simulate quayside outages, berth closures, or arrival bunching to compute counterfactual delay and cost impact.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#899491] bg-[#F7F6F2] px-2.5 py-1 rounded-md border border-[#E3E5E0]">
              Safe Sandbox Mode: Read-Only Simulation
            </span>
          </div>

          {/* Quick Scenario Presets */}
          <div className="mb-4">
            <label className="text-[11px] font-bold text-[#5C6B68] uppercase tracking-wider block mb-2">
              Quick Scenario Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset("crane")}
                disabled={isSimulating}
                className="flex items-center gap-1.5 rounded-lg border border-[#F2C4C3] bg-[#FCE9E8]/60 hover:bg-[#FCE9E8] px-3 py-1.5 text-xs font-medium text-[#B94A48] transition-colors cursor-pointer"
              >
                <Zap className="h-3.5 w-3.5" />
                Crane CR-02 Outage (12h)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("berth")}
                disabled={isSimulating}
                className="flex items-center gap-1.5 rounded-lg border border-[#F0D49A] bg-[#FFF4DE]/60 hover:bg-[#FFF4DE] px-3 py-1.5 text-xs font-medium text-[#C58A2B] transition-colors cursor-pointer"
              >
                <Anchor className="h-3.5 w-3.5" />
                Berth B-01 Maintenance (24h)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset("storm")}
                disabled={isSimulating}
                className="flex items-center gap-1.5 rounded-lg border border-[#BCE4E8] bg-[#E1F3F5]/60 hover:bg-[#E1F3F5] px-3 py-1.5 text-xs font-medium text-[#2F7D8C] transition-colors cursor-pointer"
              >
                <Clock className="h-3.5 w-3.5" />
                Severe Storm Fog (+6h Fleet Delay)
              </button>
            </div>
          </div>

          {/* Custom Interactive Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-[#F0EDE4]">
            {/* Berths Selection */}
            <div>
              <label className="text-xs font-semibold text-[#102A27] block mb-1.5">
                Simulate Disabled Berths ({simBerths.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {berths.map((b) => {
                  const isSelected = simBerths.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSimBerths(isSelected ? simBerths.filter((id) => id !== b.id) : [...simBerths, b.id]);
                      }}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-md border transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#B94A48] text-white border-[#B94A48] shadow-2xs"
                          : "bg-white text-[#5C6B68] border-[#D5D9D3] hover:border-[#102A27]"
                      )}
                    >
                      {b.berth_code} {isSelected ? "✕" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cranes Selection */}
            <div>
              <label className="text-xs font-semibold text-[#102A27] block mb-1.5">
                Simulate Offline Cranes ({simCranes.length} selected)
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {cranes.map((c) => {
                  const isSelected = simCranes.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSimCranes(isSelected ? simCranes.filter((id) => id !== c.id) : [...simCranes, c.id]);
                      }}
                      className={cn(
                        "px-2 py-0.5 text-[11px] font-medium rounded-md border transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#EA580C] text-white border-[#EA580C] shadow-2xs"
                          : "bg-white text-[#5C6B68] border-[#D5D9D3] hover:border-[#102A27]"
                      )}
                    >
                      {c.crane_code} {isSelected ? "✕" : ""}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fleet Delay Slider */}
            <div>
              <label className="text-xs font-semibold text-[#102A27] flex items-center justify-between mb-1.5">
                <span>Additional Fleet Delay:</span>
                <span className="font-bold font-mono text-[#004741]">{simDelayHours}h</span>
              </label>
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={simDelayHours}
                onChange={(e) => setSimDelayHours(Number(e.target.value))}
                className="w-full accent-[#004741] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#899491] mt-1">
                <span>On-Time (0h)</span>
                <span>+6h</span>
                <span>+12h Max</span>
              </div>
            </div>
          </div>

          {/* Run Action Bar */}
          <div className="mt-5 pt-3 border-t border-[#F0EDE4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#5C6B68]">
              <span>Active simulation params:</span>
              <span className="font-semibold text-[#102A27]">
                {simBerths.length} Berths offline · {simCranes.length} Cranes failed · +{simDelayHours}h arrival delay
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleRunSimulation()}
              disabled={isSimulating}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#004741] px-4 py-2 text-xs font-semibold text-white hover:bg-[#003B36] shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <FlaskConical className={cn("h-4 w-4 text-white", isSimulating && "animate-spin")} />
              <span>{isSimulating ? "Simulating CP-SAT Schedule..." : "Run CP-SAT Simulation"}</span>
            </button>
          </div>
        </div>

        {/* Simulation Output Results */}
        {simResult ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Narrative Summary */}
            <div className="rounded-xl border border-[#D5D9D3] bg-[#F7F6F2] p-4 text-xs shadow-sm flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-[#C58A2B] shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-[#102A27]">
                  Simulation Results: {simResult.scenario_name}
                </h4>
                <p className="text-[#5C6B68] mt-1 font-medium leading-relaxed">
                  {simResult.summary}
                </p>
              </div>
            </div>

            {/* Counterfactual Deltas Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Waiting Time Delta */}
              <div className="rounded-xl border border-[#E3E5E0] bg-white p-4 shadow-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B68]">
                  Queue Waiting Delta
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-2xl font-bold font-mono",
                    simResult.deltas.waiting_time_delta_hours > 0 ? "text-[#B94A48]" : "text-[#2F7D5B]"
                  )}>
                    {simResult.deltas.waiting_time_delta_hours > 0 ? `+${simResult.deltas.waiting_time_delta_hours}h` : `${simResult.deltas.waiting_time_delta_hours}h`}
                  </span>
                </div>
                <span className="text-[11px] text-[#899491] block mt-1">
                  Baseline: {simResult.baseline_metrics.avg_waiting_hours}h avg
                </span>
              </div>

              {/* Demurrage Delta */}
              <div className="rounded-xl border border-[#E3E5E0] bg-white p-4 shadow-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B68]">
                  Demurrage Exposure Delta
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-2xl font-bold font-mono",
                    simResult.deltas.demurrage_delta_usd > 0 ? "text-[#B94A48]" : "text-[#2F7D5B]"
                  )}>
                    {simResult.deltas.demurrage_delta_usd >= 0 ? `+$${simResult.deltas.demurrage_delta_usd.toLocaleString()}` : `-$${Math.abs(simResult.deltas.demurrage_delta_usd).toLocaleString()}`}
                  </span>
                </div>
                <span className="text-[11px] text-[#899491] block mt-1">
                  Carrier penalty risk
                </span>
              </div>

              {/* CO2 Emissions Delta */}
              <div className="rounded-xl border border-[#E3E5E0] bg-white p-4 shadow-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B68]">
                  CO₂ Emissions Delta
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-2xl font-bold font-mono",
                    simResult.deltas.co2_delta_mt > 0 ? "text-[#B94A48]" : "text-[#2F7D8C]"
                  )}>
                    {simResult.deltas.co2_delta_mt >= 0 ? `+${simResult.deltas.co2_delta_mt} MT` : `${simResult.deltas.co2_delta_mt} MT`}
                  </span>
                </div>
                <span className="text-[11px] text-[#899491] block mt-1">
                  Idle auxiliary engine burn
                </span>
              </div>

              {/* Congestion Shift */}
              <div className="rounded-xl border border-[#E3E5E0] bg-white p-4 shadow-card">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5C6B68]">
                  Congestion Index Shift
                </span>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className={cn(
                    "text-2xl font-bold font-mono",
                    simResult.deltas.congestion_score_delta > 0 ? "text-[#B94A48]" : "text-[#2F7D5B]"
                  )}>
                    {simResult.deltas.congestion_score_delta >= 0 ? `+${simResult.deltas.congestion_score_delta} pts` : `${simResult.deltas.congestion_score_delta} pts`}
                  </span>
                </div>
                <span className="text-[11px] text-[#899491] block mt-1">
                  Diagnostic index shift
                </span>
              </div>
            </div>

            {/* Simulated Counterfactual Schedule Table */}
            <div className="rounded-xl border border-[#E3E5E0] bg-white shadow-card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-[#F0EDE4] flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#102A27]">
                  Simulated Berth Allocations ({simResult.simulated_schedules.length} Vessels)
                </h4>
                <span className="text-[11px] text-[#5C6B68] italic">
                  Counterfactual plan generated without altering live operational database
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vessel</TableHead>
                    <TableHead>Simulated Berth</TableHead>
                    <TableHead>Assigned Cranes</TableHead>
                    <TableHead>Berthing Window</TableHead>
                    <TableHead>Waiting Time</TableHead>
                    <TableHead>Solver Rationale</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {simResult.simulated_schedules.map((item) => (
                    <TableRow key={item.id} className="hover:bg-[#F7F6F2]/70 transition-colors">
                      <TableCell className="font-semibold text-[#102A27]">
                        <div>{item.vessel_name}</div>
                        <div className="text-[11px] font-mono font-normal text-[#899491]">
                          {item.vessel_code}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[#004741]">
                        <div className="flex items-center gap-1">
                          <Anchor className="h-3 w-3 text-[#004741]" />
                          <span>{item.berth_code}</span>
                        </div>
                        <div className="text-[10px] text-[#899491]">{item.berth_name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.assigned_cranes.map((cCode, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded bg-[#F0EDE4] px-1.5 py-0.5 text-[10px] font-medium text-[#5C6B68] font-mono"
                            >
                              {cCode}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#5C6B68]">
                        <div>{formatDateTime(item.planned_start)}</div>
                        <div className="text-[10px] text-[#899491]">
                          until {formatDateTime(item.planned_end)} ({item.duration_hours}h)
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium text-[#102A27]">
                        {item.waiting_time > 0 ? (
                          <span className="text-amber-700 font-semibold">
                            +{formatDuration(item.waiting_time)}
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">0h (Direct)</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-[#5C6B68] max-w-sm">
                        {item.assignment_reason}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#D5D9D3] bg-[#F7F6F2]/50 p-12 text-center">
            <FlaskConical className="h-8 w-8 text-[#899491] mx-auto mb-2 opacity-50" />
            <h4 className="text-sm font-semibold text-[#102A27]">No Simulation Executed Yet</h4>
            <p className="text-xs text-[#5C6B68] mt-1 max-w-md mx-auto">
              Select a scenario preset above (e.g. Crane CR-02 Outage) or choose custom berths to disable, then click "Run CP-SAT Simulation" to view counterfactual impact deltas.
            </p>
          </div>
        )}
      </div>
    )}
  </AppShell>
);
}
