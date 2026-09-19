"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AssetTabs } from "@/components/layout/asset-tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/design-system/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from "@/design-system/table";
import { Badge } from "@/design-system/badge";
import { Button } from "@/design-system/button";
import { UpdateResourceModal } from "@/components/dialogs/update-resource-modal";
import { api } from "@/lib/api";
import { Crane, Berth } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Cpu, Edit2, AlertCircle } from "lucide-react";

export default function CranesPage() {
  const [cranes, setCranes] = useState<Crane[]>([]);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("viewer");
  const [updateModal, setUpdateModal] = useState<{ isOpen: boolean; crane: Crane | null }>({
    isOpen: false,
    crane: null,
  });

  const loadCranes = async () => {
    if (typeof window !== "undefined") {
      setCurrentRole(localStorage.getItem("naviops_role") || "viewer");
    }
    try {
      const [cList, bList] = await Promise.all([api.getCranes(), api.getBerths()]);
      setCranes(cList);
      setBerths(bList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCranes();
  }, []);

  return (
    <AppShell
      title="Asset Directory: STS Cranes"
      description="Quay crane operational readiness, hourly handling rates, and maintenance telemetry."
      onRefresh={loadCranes}
      allowedRoles={["admin", "operations", "viewer"]}
    >
      <AssetTabs />
      <Card className="border-[#E3E5E0]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[#004741]" />
            <CardTitle>Crane Fleet Registry</CardTitle>
          </div>
          <CardDescription>
            Failed or maintenance cranes are strictly barred from assignment during optimization runs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crane Code</TableHead>
                <TableHead>Equipment Model</TableHead>
                <TableHead>Moves / Hour</TableHead>
                <TableHead>Assigned Berth</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. Available Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cranes.length === 0 ? (
                <TableEmpty message="No STS gantry cranes currently recorded." colSpan={7} />
              ) : (
                cranes.map((c) => {
                const assignedBerth = berths.find((b) => b.id === c.assigned_berth_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold text-[#102A27]">{c.crane_code}</TableCell>
                    <TableCell className="text-[#5C6B68] font-medium">{c.crane_name}</TableCell>
                    <TableCell className="font-mono text-xs text-[#102A27]">
                      {c.capacity_per_hour} moves/hr
                    </TableCell>
                    <TableCell className="text-xs text-[#5C6B68]">
                      {assignedBerth ? assignedBerth.berth_code : "Unassigned Rail"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="status" status={c.status} context="crane">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#5C6B68]">
                      {formatDateTime(c.available_from)}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentRole !== "viewer" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUpdateModal({ isOpen: true, crane: c })}
                          leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                        >
                          Update Status
                        </Button>
                      ) : (
                        <span className="text-[11px] text-[#899491] italic">Read-Only</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {updateModal.isOpen && updateModal.crane && (
        <UpdateResourceModal
          isOpen={updateModal.isOpen}
          onClose={() => setUpdateModal({ isOpen: false, crane: null })}
          onSuccess={loadCranes}
          resourceType="crane"
          resource={updateModal.crane}
        />
      )}
    </AppShell>
  );
}
