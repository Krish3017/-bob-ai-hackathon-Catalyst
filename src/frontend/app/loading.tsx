import React from "react";
import { Anchor } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#004741] text-white shadow-sm animate-pulse mb-3">
        <Anchor className="h-6 w-6" />
      </div>
      <div className="text-sm font-semibold text-[#102A27]">
        Loading NaviOps Telemetry...
      </div>
      <div className="text-xs text-[#899491] mt-1">
        Synchronizing quayside berthing lines and resource allocations
      </div>
    </div>
  );
}
