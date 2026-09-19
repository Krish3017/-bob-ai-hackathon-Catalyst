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
import { Berth, Vessel } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Anchor, Edit2, ShieldAlert } from "lucide-react";

export default function BerthsPage() {
  const [berths, setBerths] = useState<Berth[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("viewer");
  const [updateModal, setUpdateModal] = useState<{ isOpen: boolean; berth: Berth | null }>({
    isOpen: false,
    berth: null,
  });

  const loadBerths = async () => {
    if (typeof window !== "undefined") {
      setCurrentRole(localStorage.getItem("naviops_role") || "viewer");
    }
    try {
      const [bList, vList] = await Promise.all([api.getBerths(), api.getVessels()]);
      setBerths(bList);
      setVessels(vList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBerths();
  }, []);

  return (
    <AppShell
      title="Asset Directory: Quay Berths"
      description="Quayside docking infrastructure, structural vessel length limits, and real-time berth assignments."
      onRefresh={loadBerths}
      allowedRoles={["admin", "operations", "viewer"]}
    >
      <AssetTabs />
      <Card className="border-[#E3E5E0]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Anchor className="h-4 w-4 text-[#004741]" />
            <CardTitle>Terminal Berth Inventory</CardTitle>
          </div>
          <CardDescription>
            Berth status directly enforces exclusive non-overlap constraints in the optimization engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Berth Code</TableHead>
                <TableHead>Facility Name</TableHead>
                <TableHead>Max Supported Length</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Assigned Vessel</TableHead>
                <TableHead>Available From</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {berths.length === 0 ? (
                <TableEmpty message="No terminal berths currently recorded." colSpan={7} />
              ) : (
                berths.map((b) => {
                const currentVessel = vessels.find((v) => v.id === b.current_vessel_id);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="font-bold text-[#102A27]">{b.berth_code}</TableCell>
                    <TableCell className="text-[#5C6B68] font-medium">{b.berth_name}</TableCell>
                    <TableCell className="font-mono text-xs text-[#102A27]">
                      {b.max_vessel_length} meters
                    </TableCell>
                    <TableCell>
                      <Badge variant="status" status={b.status} context="berth">
                        {b.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[#102A27]">
                      {currentVessel ? (
                        <div className="font-semibold text-[#102A27]">
                          {currentVessel.vessel_name} ({currentVessel.vessel_code})
                        </div>
                      ) : (
                        <span className="text-[#899491] italic">None (Ready for Berthing)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-[#5C6B68]">
                      {formatDateTime(b.available_from)}
                    </TableCell>
                    <TableCell className="text-right">
                      {currentRole !== "viewer" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setUpdateModal({ isOpen: true, berth: b })}
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

      {updateModal.isOpen && updateModal.berth && (
        <UpdateResourceModal
          isOpen={updateModal.isOpen}
          onClose={() => setUpdateModal({ isOpen: false, berth: null })}
          onSuccess={loadBerths}
          resourceType="berth"
          resource={updateModal.berth}
        />
      )}
    </AppShell>
  );
}
