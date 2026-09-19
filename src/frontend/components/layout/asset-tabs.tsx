"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Ship, Anchor, Cpu, Boxes } from "lucide-react";

interface AssetTab {
  name: string;
  href: string;
  icon: any;
}

const assetTabs: AssetTab[] = [
  { name: "Vessels Fleet", href: "/vessels", icon: Ship },
  { name: "Quay Berths", href: "/berths", icon: Anchor },
  { name: "STS Cranes", href: "/cranes", icon: Cpu },
  { name: "Yard Zones", href: "/yards", icon: Boxes },
];

export function AssetTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-[#E3E5E0] pb-2 mb-4">
      {assetTabs.map((tab) => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isActive
                ? "bg-[#004741] text-white font-semibold shadow-sm"
                : "text-[#5C6B68] hover:bg-[#E1EFEC] hover:text-[#004741]"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{tab.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
