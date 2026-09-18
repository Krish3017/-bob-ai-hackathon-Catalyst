"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/design-system/table";
import { Badge } from "@/design-system/badge";
import { AddVesselModal } from "@/components/dialogs/add-vessel-modal";
import { AddDisruptionModal } from "@/components/dialogs/add-disruption-modal";
import { UpdateResourceModal } from "@/components/dialogs/update-resource-modal";
import { api } from "@/lib/api";
import { Vessel, Berth, Crane, Yard } from "@/types";
import { formatDateTime, formatDuration } from "@/lib/utils";
import {
  Plus,
  AlertTriangle,
  Anchor,
  Ship,
  Edit2,
  Trash2,
  Zap,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/design-system/toast";
import { useConfirm } from "@/components/design-system/confirm-dialog";

export default function OperationsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [yards, setYards] = useState<Yard[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("operations");
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Expandable row tracking
  const [expandedVesselId, setExpandedVesselId] = useState<string | null>(null);

  // Modal dialog states
  const [isAddVesselOpen, setIsAddVesselOpen] = useState(false);
  const [isAddDisruptionOpen, setIsAddDisruptionOpen] = useState(false);
  const [updateModalData, setUpdateModalData] = useState<{
    isOpen: boolean;
    type: "vessel" | "berth";
    resource: any;
  }>({
    isOpen: false,
    type: "vessel",
    resource: null,
  });

  const loadAll = async () => {
    try {
      setRefreshing(true);
      const [vList, bList, cList, yList] = await Promise.all([
        api.getVessels(),
        api.getBerths(),
        api.getCranes(),
        api.getYards(),
      ]);
      setVessels(vList);
      setBerths(bList);
      setCranes(cList);
      setYards(yList);
    } catch (err) {
      console.error("Error loading operational data:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentRole(localStorage.getItem("naviops_role") || "operations");
    }
    loadAll();
    // Auto-refresh every 30 seconds to reflect live vessel/berth state changes
    const interval = setInterval(loadAll, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleDeleteVessel = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: "Remove vessel?",
      description: `This will permanently remove ${name} from the live port operations queue. This action cannot be undone.`,
      confirmText: "Remove vessel",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    try {
      await api.deleteVessel(id);
      toast.success("Vessel removed", `${name} removed from operations queue.`);
      setVessels((prev) => prev.filter((v) => v.id !== id));
      loadAll();
    } catch (err: any) {
      toast.error("Unable to remove vessel", err.message || "Action restricted.");
    }
  };

  const filteredVessels = vessels.filter((v) => {
    const matchesStatus =
      statusFilter === "all" || v.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      v.vessel_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vessel_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.shipping_line.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const toggleRow = (id: string) => {
    setExpandedVesselId(expandedVesselId === id ? null : id);
  };

  return (
    <AppShell
      title="Operations Workspace"
      description="Manage vessel arrivals, berth assignments, queue prioritization, and quick status updates."
      onRefresh={loadAll}
      isRefreshing={refreshing}
      allowedRoles={["admin", "operations"]}
    >
      {/* 1. Primary Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-[#E3E5E0] bg-white p-3.5 shadow-card">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAddVesselOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#004741] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003B36] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-white" />
            <span className="text-white">Add Vessel</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddDisruptionOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E3E5E0] bg-white px-3 py-1.5 text-xs font-medium text-[#5C6B68] hover:bg-[#F7F6F2] transition-colors cursor-pointer"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            <span>Report Disruption</span>
          </button>

          <Link href="/optimization">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#C5DDD9] bg-[#E1EFEC] px-3 py-1.5 text-xs font-semibold text-[#004741] hover:bg-[#C5DDD9] transition-colors"
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Run 72h Solver</span>
            </button>
          </Link>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#899491]" />
            <input
              type="text"
              placeholder="Search vessel or line..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E3E5E0] bg-[#F7F6F2] pl-8 pr-2.5 py-1 text-xs text-[#102A27] placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#E3E5E0] bg-[#F7F6F2] px-2.5 py-1 text-xs font-medium text-[#5C6B68] focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">All Statuses ({vessels.length})</option>
              <option value="Waiting">Waiting ({vessels.filter((v) => v.status === "Waiting").length})</option>
              <option value="Unloading">Unloading ({vessels.filter((v) => v.status === "Unloading").length})</option>
              <option value="Loading">Loading ({vessels.filter((v) => v.status === "Loading").length})</option>
              <option value="Scheduled">Scheduled ({vessels.filter((v) => v.status === "Scheduled").length})</option>
              <option value="Delayed">Delayed ({vessels.filter((v) => v.status === "Delayed").length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Focused Vessel Operations Table */}
      <div className="rounded-xl border border-[#E3E5E0] bg-white shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#F0EDE4]">
          <div className="flex items-center gap-2">
            <Ship className="h-4 w-4 text-[#004741]" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#102A27]">
              Vessel Fleet Queue ({filteredVessels.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#899491]">
            Click any row to reveal carrier and cargo specifications
          </span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Vessel</TableHead>
              <TableHead>ETA</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned Berth</TableHead>
              <TableHead>Wait Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVessels.length === 0 ? (
              <TableEmpty message="No vessels matching filter." colSpan={8} />
            ) : (
              filteredVessels.map((v) => {
                const assignedBerth = berths.find((b) => b.id === v.assigned_berth_id);
                const isExpanded = expandedVesselId === v.id;

                return (
                  <React.Fragment key={v.id}>
                    <TableRow
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-[#F7F6F2]/80",
                        isExpanded && "bg-[#F7F6F2]/50"
                      )}
                      onClick={() => toggleRow(v.id)}
                    >
                      <TableCell className="w-8 text-center text-[#899491]">
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5 mx-auto" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-[#102A27]">
                        <div>{v.vessel_name}</div>
                        <div className="text-[11px] font-mono font-normal text-[#899491]">
                          {v.vessel_code}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-[#5C6B68]">
                        {formatDateTime(v.eta)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="priority" priority={v.priority} size="sm" />
                      </TableCell>
                      <TableCell className="text-xs font-medium text-[#102A27]">
                        {assignedBerth ? (
                          <span className="inline-flex items-center gap-1 text-[#004741]">
                            <Anchor className="h-3 w-3 text-[#004741]" />
                            {assignedBerth.berth_code}
                          </span>
                        ) : (
                          <span className="text-[#899491] italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono font-medium">
                        {v.expected_waiting_time > 6 ? (
                          <span className="text-[#B94A48] font-bold">
                            +{formatDuration(v.expected_waiting_time)}
                          </span>
                        ) : v.expected_waiting_time > 0 ? (
                          <span className="text-[#C58A2B] font-semibold">
                            +{formatDuration(v.expected_waiting_time)}
                          </span>
                        ) : (
                          <span className="text-[#2F7D5B] font-medium">0h (Direct)</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="status" status={v.status} context="vessel" size="sm">
                          {v.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setUpdateModalData({
                                isOpen: true,
                                type: "vessel",
                                resource: v,
                              })
                            }
                            className="rounded p-1 text-[#899491] hover:bg-[#F0EDE4] hover:text-[#5C6B68] transition-colors"
                            title="Update Status / Reassign"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>

                          {currentRole === "admin" && (
                            <button
                              type="button"
                              onClick={() => handleDeleteVessel(v.id, v.vessel_name)}
                              className="rounded p-1 text-[#899491] hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Delete vessel record (Admin only)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expandable Details Drawer/Row */}
                    {isExpanded && (
                      <TableRow className="bg-[#F7F6F2]/60 border-t border-[#F0EDE4]">
                        <TableCell colSpan={8} className="py-3 px-6">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-[#899491] block">
                                Shipping Carrier
                              </span>
                              <span className="font-semibold text-[#102A27] mt-0.5 block">
                                {v.shipping_line}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-[#899491] block">
                                Cargo Specifications
                              </span>
                              <span className="font-semibold text-[#102A27] mt-0.5 block">
                                {(v.cargo_volume ?? 0).toLocaleString()} TEU ({v.cargo_type})
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-[#899491] block">
                                Vessel Length
                              </span>
                              <span className="font-semibold text-[#102A27] mt-0.5 block">
                                {v.vessel_length} meters
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] font-medium uppercase tracking-wider text-[#899491] block">
                                Estimated Departure (ETD)
                              </span>
                              <span className="font-semibold text-[#102A27] mt-0.5 block">
                                {formatDateTime(v.etd)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modals */}
      <AddVesselModal
        isOpen={isAddVesselOpen}
        onClose={() => setIsAddVesselOpen(false)}
        onSuccess={loadAll}
      />

      <AddDisruptionModal
        isOpen={isAddDisruptionOpen}
        onClose={() => setIsAddDisruptionOpen(false)}
        onSuccess={loadAll}
        berths={berths}
        cranes={cranes}
        yards={yards}
      />

      {updateModalData.isOpen && (
        <UpdateResourceModal
          isOpen={updateModalData.isOpen}
          onClose={() =>
            setUpdateModalData({ isOpen: false, type: "vessel", resource: null })
          }
          onSuccess={loadAll}
          resourceType={updateModalData.type}
          resource={updateModalData.resource}
        />
      )}
    </AppShell>
  );
}
