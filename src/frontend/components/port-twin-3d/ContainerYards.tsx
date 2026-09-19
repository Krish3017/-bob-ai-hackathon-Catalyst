"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { PortTwinYard } from "@/data/port-twin-data";
import { geoToWorld } from "./coords";

interface ContainerYardsProps {
  yards: PortTwinYard[];
  selectedYardId?: string | null;
  onSelectYard: (yard: PortTwinYard) => void;
  onHoverYard?: (yard: PortTwinYard | null, x?: number, y?: number) => void;
  visible?: boolean;
}

// Professional shipping line color palette
const CONTAINER_COLORS = [
  "#1e3a8a", // Maersk Deep Navy
  "#15803d", // Evergreen Forest Green
  "#c2410c", // Hapag-Lloyd Burnt Orange
  "#2563eb", // CMA CGM Royal Blue
  "#b91c1c", // K-Line Crimson
  "#475569", // Slate Grey
  "#d97706", // Amber
];

export function ContainerYards({
  yards,
  selectedYardId,
  onSelectYard,
  onHoverYard,
  visible = true,
}: ContainerYardsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!visible) return null;

  return (
    <group>
      {yards.map((yard, yIndex) => {
        const isSelected = selectedYardId === yard.id;
        const isHovered = hoveredId === yard.id;
        const [cx, , cz] = geoToWorld(yard.coordinates, 0.4);

        // Utilization status color
        const utilColor =
          yard.utilization_pct > 85
            ? "#f59e0b"
            : yard.utilization_pct > 95
            ? "#ef4444"
            : "#10b981";

        // Yard footprint shape
        const shape = new THREE.Shape();
        yard.polygon.forEach((pt, idx) => {
          const [x, , z] = geoToWorld(pt);
          if (idx === 0) shape.moveTo(x, z);
          else shape.lineTo(x, z);
        });

        // Compact dimensions for readable 2.5D container blocks
        const tiers = Math.max(1, Math.min(3, Math.ceil(yard.stacking_tiers * 0.6)));
        const numRows = 3;
        const numBays = 4;
        const cWidth = 1.3;
        const cLength = 3.2;
        const cHeight = 0.65;

        return (
          <group
            key={yard.id}
            onClick={(e) => {
              e.stopPropagation();
              if ((e as any).delta > 4) return;
              onSelectYard(yard);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(yard.id);
              document.body.style.cursor = "pointer";
              onHoverYard?.(yard, e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
              onHoverYard?.(yard, e.clientX, e.clientY);
            }}
            onPointerOut={() => {
              setHoveredId(null);
              document.body.style.cursor = "auto";
              onHoverYard?.(null);
            }}
          >
            {/* 1. Yard Base Pad (Clean light gray pavement) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.38, 0]} receiveShadow>
              <shapeGeometry args={[shape]} />
              <meshStandardMaterial
                color={isSelected ? "#e2e8f0" : "#f1f5f9"}
                roughness={0.9}
                metalness={0.05}
              />
            </mesh>

            {/* 2. RTG Gantry Crane Guide Lines */}
            <mesh position={[cx - 6.5, 0.39, cz]} rotation={[0, 0.35, 0]}>
              <boxGeometry args={[0.15, 0.04, 15]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>
            <mesh position={[cx + 6.5, 0.39, cz]} rotation={[0, 0.35, 0]}>
              <boxGeometry args={[0.15, 0.04, 15]} />
              <meshStandardMaterial color="#94a3b8" />
            </mesh>

            {/* 3. Compact 2.5D Container Stacks */}
            <group position={[cx, 0.4, cz]} rotation={[0, 0.35, 0]}>
              {Array.from({ length: numRows }).map((_, rIdx) => {
                const rx = (rIdx - (numRows - 1) / 2) * (cWidth + 0.5);
                return (
                  <group key={rIdx} position={[rx, 0, 0]}>
                    {Array.from({ length: numBays }).map((_, bIdx) => {
                      const bz = (bIdx - (numBays - 1) / 2) * (cLength + 0.35);
                      const stackTiers =
                        bIdx === numBays - 1 && yard.utilization_pct < 80
                          ? Math.max(1, tiers - 1)
                          : tiers;

                      return (
                        <group key={bIdx} position={[0, 0, bz]}>
                          {Array.from({ length: stackTiers }).map((_, tIdx) => {
                            const colorIndex =
                              (yIndex * 7 + rIdx * 3 + bIdx * 2 + tIdx) %
                              CONTAINER_COLORS.length;
                            const containerColor = CONTAINER_COLORS[colorIndex];
                            const ty = tIdx * cHeight + cHeight / 2;

                            return (
                              <mesh
                                key={tIdx}
                                position={[0, ty, 0]}
                                castShadow
                                receiveShadow
                              >
                                <boxGeometry args={[cWidth, cHeight - 0.03, cLength]} />
                                <meshStandardMaterial
                                  color={containerColor}
                                  roughness={0.5}
                                  metalness={0.15}
                                />
                              </mesh>
                            );
                          })}
                        </group>
                      );
                    })}
                  </group>
                );
              })}
            </group>

            {/* 4. Compact White GIS Yard Tag Badge */}
            {/* 4. Compact White GIS Yard Marker Badge */}
            <Html
              position={[cx, 2.5, cz]}
              center
              distanceFactor={85}
              zIndexRange={[10, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold shadow-sm transition-all select-none ${
                  isSelected
                    ? "bg-slate-900 border border-blue-500 text-white shadow-md"
                    : isHovered
                    ? "bg-white border border-blue-500 text-blue-900 shadow"
                    : "bg-white/95 border border-slate-300 text-slate-700"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: utilColor }}
                />
                <span>{yard.yard_code}</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
