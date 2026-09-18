"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/design-system/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/design-system/table";
import { Badge } from "@/design-system/badge";
import { Button } from "@/design-system/button";
import { AddDisruptionModal } from "@/components/dialogs/add-disruption-modal";
import { api } from "@/lib/api";
import { Disruption, Berth, Crane, Yard } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle, Plus, CheckCircle, Trash2 } from "lucide-react";
import { useToast } from "@/components/design-system/toast";
import { useConfirm } from "@/components/design-system/confirm-dialog";

export default function DisruptionsPage() {
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [yards, setYards] = useState<Yard[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("viewer");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const toast = useToast();
  const confirm = useConfirm();

  const loadAll = async () => {
    if (typeof window !== "undefined") {
      setCurrentRole(localStorage.getItem("naviops_role") || "viewer");
    }
    try {
      const [dList, bList, cList, yList] = await Promise.all([
        api.getDisruptions(),
        api.getBerths(),
        api.getCranes(),
        api.getYards(),
      ]);
      setDisruptions(dList);
      setBerths(bList);
      setCranes(cList);
      setYards(yList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentRole(localStorage.getItem("naviops_role") || "viewer");
    }
    loadAll();
    // Auto-refresh every 30 seconds so new disruptions appear without manual reload
    const interval = setInterval(loadAll, 30_000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id: string) => {
    const confirmed = await confirm({
      title: "Resolve disruption?",
      description:
        "This will mark the disruption incident as resolved and return affected resources to normal operational scheduling.",
      confirmText: "Resolve incident",
      cancelText: "Cancel",
      variant: "default",
    });

    if (!confirmed) return;

    try {
      await api.updateDisruption(id, { status: "Resolved" });
      toast.success(
        "Disruption resolved",
        "Incident closed and resources restored to operational queue."
      );
      loadAll();
    } catch (err: any) {
      toast.error(
        "Unable to resolve disruption",
        err.message || "An unexpected error occurred."
      );
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: "Delete disruption record?",
      description:
        "This will permanently remove this incident record and associated event history. This action cannot be undone.",
      confirmText: "Delete incident",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    try {
      await api.deleteDisruption(id);
      toast.success("Disruption deleted", "Incident record removed.");
      loadAll();
    } catch (err: any) {
      toast.error(
        "Unable to delete disruption",
        err.message || "Action restricted."
      );
    }
  };

  return (
    <AppShell
      title="Disruptions & Incident Center"
      description="Report and resolve unexpected equipment failures, adverse weather, or channel bottlenecks."
      onRefresh={loadAll}
    >
      {/* Incident Actions Toolbar */}
      <div className="flex items-center justify-between rounded-xl border border-[#E3E5E0] bg-white p-3.5 shadow-card mb-4">
        <div className="text-xs font-semibold text-[#102A27]">
          Active Incidents ({disruptions.filter((d) => d.status === "Active").length}) · Total ({disruptions.length})
        </div>

        {currentRole !== "viewer" ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Report New Incident
          </Button>
        ) : (
          <div className="text-xs text-[#899491] font-medium italic">
            Read-Only (Viewer Access)
          </div>
        )}
      </div>

      <Card className="border-[#E3E5E0]">
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Incident Title</TableHead>
                <TableHead>Disruption Type</TableHead>
                <TableHead>Affected Resource</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Reported At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disruptions.length === 0 ? (
                <TableEmpty message="No disruptions currently recorded." colSpan={7} />
              ) : (
                disruptions.map((d) => {
                  let specificResourceName = "";
                  if (d.affected_resource_id) {
                    if (d.affected_resource_type === "crane") {
                      const c = cranes.find((item) => item.id === d.affected_resource_id);
                      if (c) specificResourceName = `${c.crane_code} (${c.crane_name})`;
                    } else if (d.affected_resource_type === "berth") {
                      const b = berths.find((item) => item.id === d.affected_resource_id);
                      if (b) specificResourceName = `${b.berth_code} (${b.berth_name})`;
                    } else if (d.affected_resource_type === "yard") {
                      const y = yards.find((item) => item.id === d.affected_resource_id);
                      if (y) specificResourceName = `${y.yard_code} (${y.yard_name})`;
                    }
                  }

                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-semibold text-[#102A27]">
                        <div>{d.title}</div>
                        {d.description && (
                          <div className="text-xs text-[#5C6B68] font-normal max-w-sm line-clamp-1">
                            {d.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-[#5C6B68]">{d.disruption_type}</TableCell>
                      <TableCell className="text-xs font-medium text-[#102A27]">
                        <span className="uppercase font-mono text-[11px] text-[#004741] font-semibold block">
                          {d.affected_resource_type}
                        </span>
                        {specificResourceName ? (
                          <span className="text-[11px] text-[#5C6B68] block mt-0.5">
                            {specificResourceName}
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#899491] italic block mt-0.5">
                            Port-wide
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="status" status={d.severity} context="disruption">
                          {d.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-[#5C6B68]">{formatDateTime(d.start_time)}</TableCell>
                      <TableCell>
                        <Badge variant="status" status={d.status} context="disruption">
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {currentRole !== "viewer" && d.status === "Active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              onClick={() => handleResolve(d.id)}
                              leftIcon={<CheckCircle className="h-3.5 w-3.5" />}
                            >
                              Resolve
                            </Button>
                          )}
                          {currentRole === "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-rose-600 hover:text-rose-700"
                              onClick={() => handleDelete(d.id)}
                              title="Delete incident (Admin Only)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {currentRole === "viewer" && (
                            <span className="text-[11px] text-[#899491] font-medium italic">
                              Read-Only
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddDisruptionModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={loadAll}
        berths={berths}
        cranes={cranes}
        yards={yards}
      />
    </AppShell>
  );
}
