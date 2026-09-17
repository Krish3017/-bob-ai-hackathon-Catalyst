"use client";

import React, { useState, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { PortTwinYard } from "@/data/port-twin-data";
import { geoToWorld } from "./coords";

interface ContainerYardsProps {
  yards: PortTwinYard[];
  selectedYardId?: string | null;
  onSelectYard: (yard: PortTwinYard) => void;
  visible?: boolean;
}

// Shipping line color palette
const CONTAINER_COLORS = [
  "#0284c7", // Maersk Blue
  "#15803d", // Evergreen Emerald
  "#ea580c", // Hapag-Lloyd Orange
  "#1e40af", // CMA CGM Navy
  "#991b1b", // K-Line Crimson
  "#f1f5f9", // White Reefer
  "#b45309", // Amber
];

export function ContainerYards({
  yards,
  selectedYardId,
  onSelectYard,
  visible = true,
}: ContainerYardsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!visible) return null;

  return (
    <group>
      {yards.map((yard, yIndex) => {
        const isSelected = selectedYardId === yard.id;
        const isHovered = hoveredId === yard.id;
        const [cx, , cz] = geoToWorld(yard.coordinates, 2.5);

        // Utilization status color
        const utilColor =
          yard.utilization_pct > 85
            ? "#f59e0b"
            : yard.utilization_pct > 95
            ? "#f43f5e"
            : "#0284c7";

        // Yard footprint shape
        const shape = new THREE.Shape();
        yard.polygon.forEach((pt, idx) => {
          const [x, , z] = geoToWorld(pt);
          if (idx === 0) shape.moveTo(x, z);
          else shape.lineTo(x, z);
        });

        // Determine number of container rows & tiers
        const tiers = Math.max(2, Math.min(5, yard.stacking_tiers));
        const numRows = 3;
        const numBays = 4;
        const cWidth = 1.4;
        const cLength = 3.6;
        const cHeight = 0.9;

        return (
          <group
            key={yard.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectYard(yard);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(yard.id);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHoveredId(null);
              document.body.style.cursor = "auto";
            }}
          >
            {/* 1. Yard Tarmac Base Pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.45, 0]} receiveShadow>
              <shapeGeometry args={[shape]} />
              <meshStandardMaterial
                color={isSelected ? "#1e293b" : "#141c28"}
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>

            {/* 2. RTG Gantry Crane Rails along yard boundary */}
            <mesh
              position={[cx - 7, 2.48, cz]}
              rotation={[0, 0.35, 0]}
            >
              <boxGeometry args={[0.2, 0.08, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>
            <mesh
              position={[cx + 7, 2.48, cz]}
              rotation={[0, 0.35, 0]}
            >
              <boxGeometry args={[0.2, 0.08, 16]} />
              <meshStandardMaterial color="#64748b" metalness={0.8} />
            </mesh>

            {/* 3. Stacked 3D Containers within Yard Block */}
            <group position={[cx, 2.5, cz]} rotation={[0, 0.35, 0]}>
              {Array.from({ length: numRows }).map((_, rIdx) => {
                const rx = (rIdx - (numRows - 1) / 2) * (cWidth + 0.6);
                return (
                  <group key={rIdx} position={[rx, 0, 0]}>
                    {Array.from({ length: numBays }).map((_, bIdx) => {
                      const bz = (bIdx - (numBays - 1) / 2) * (cLength + 0.4);
                      // Tiers based on utilization
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
                                <boxGeometry args={[cWidth, cHeight - 0.04, cLength]} />
                                <meshStandardMaterial
                                  color={containerColor}
                                  roughness={0.4}
                                  metalness={0.2}
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

            {/* 4. Yard Telemetry Floating HUD Badge */}
            <Html
              position={[cx, 8.5, cz]}
              center
              distanceFactor={85}
              zIndexRange={[10, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold shadow-xl backdrop-blur-md transition-all select-none ${
                  isSelected
                    ? "bg-slate-900 border-2 border-white text-white ring-2 ring-cyan-400 scale-110"
                    : isHovered
                    ? "bg-slate-900/95 border border-cyan-400 text-cyan-200"
                    : "bg-slate-950/85 border border-slate-700/80 text-slate-300"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: utilColor }}
                />
                <span className="font-bold">{yard.yard_code}</span>
                <span className="text-[9px] text-slate-400 font-sans font-normal">
                  {yard.utilization_pct}% TEU
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
