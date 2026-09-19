"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AssetTabs } from "@/components/layout/asset-tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/design-system/card";
import { Badge } from "@/design-system/badge";
import { Button } from "@/design-system/button";
import { UpdateResourceModal } from "@/components/dialogs/update-resource-modal";
import { api } from "@/lib/api";
import { Yard } from "@/types";
import { Boxes, Edit2, AlertCircle } from "lucide-react";
import { getResourceUtilizationMeta } from "@/lib/utils";

export default function YardsPage() {
  const [yards, setYards] = useState<Yard[]>([]);
  const [currentRole, setCurrentRole] = useState<string>("viewer");
  const [updateModal, setUpdateModal] = useState<{ isOpen: boolean; yard: Yard | null }>({
    isOpen: false,
    yard: null,
  });

  const loadYards = async () => {
    if (typeof window !== "undefined") {
      setCurrentRole(localStorage.getItem("naviops_role") || "viewer");
    }
    try {
      const yList = await api.getYards();
      setYards(yList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadYards();
  }, []);


  return (
    <AppShell
      title="Asset Directory: Container Yard Capacity"
      description="Inbound/outbound buffer zones, reefer stacks, and dangerous goods segregation capacity."
      onRefresh={loadYards}
    >
      <AssetTabs />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {yards.map((y) => {
          const util = y.utilization_percentage || 0;
          const utilMeta = getResourceUtilizationMeta(util);

          return (
            <Card key={y.id} className="border-[#E3E5E0]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-[#004741]" />
                    <span className="font-bold text-sm text-[#102A27]">{y.yard_code}</span>
                  </div>
                  <Badge variant="status" status={y.status} context="yard">
                    {y.status}
                  </Badge>
                </div>
                <CardDescription className="truncate">{y.yard_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-[#5C6B68]">Utilization Rate:</span>
                    <span className={utilMeta.textClass}>
                      {util}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#F0EDE4] overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${utilMeta.barClass}`} style={{ width: `${Math.min(100, util)}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-[#F7F6F2] p-3 rounded-lg border border-[#F0EDE4]">
                  <div>
                    <span className="text-[#899491] block text-[11px]">Total Capacity</span>
                    <span className="font-bold text-[#102A27]">{(y.total_capacity ?? 0).toLocaleString()} TEU</span>
                  </div>
                  <div>
                    <span className="text-[#899491] block text-[11px]">Occupied Stack</span>
                    <span className="font-bold text-[#102A27]">{(y.occupied_capacity ?? 0).toLocaleString()} TEU</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#F0EDE4]">
                  <span className="text-xs text-[#5C6B68] font-medium">{y.cargo_type}</span>
                  {currentRole !== "viewer" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUpdateModal({ isOpen: true, yard: y })}
                      leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                    >
                      Update TEU
                    </Button>
                  ) : (
                    <span className="text-[11px] text-[#899491] font-medium italic">
                      Read-Only (Viewer)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

          );
        })}
      </div>

      {updateModal.isOpen && updateModal.yard && (
        <UpdateResourceModal
          isOpen={updateModal.isOpen}
          onClose={() => setUpdateModal({ isOpen: false, yard: null })}
          onSuccess={loadYards}
          resourceType="yard"
          resource={updateModal.yard}
        />
      )}
    </AppShell>
  );
}
