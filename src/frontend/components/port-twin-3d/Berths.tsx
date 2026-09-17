"use client";

import React, { useState, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { PortTwinBerth } from "@/data/port-twin-data";
import { geoToWorld } from "./coords";

interface BerthsProps {
  berths: PortTwinBerth[];
  selectedBerthId?: string | null;
  onSelectBerth: (berth: PortTwinBerth) => void;
  visible?: boolean;
}

export function Berths({
  berths,
  selectedBerthId,
  onSelectBerth,
  visible = true,
}: BerthsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!visible) return null;

  return (
    <group>
      {berths.map((berth) => {
        const isSelected = selectedBerthId === berth.id;
        const isHovered = hoveredId === berth.id;
        const [cx, , cz] = geoToWorld(berth.coordinates, 2.5);

        // Status color token
        const statusColor =
          berth.status === "Available"
            ? "#10b981"
            : berth.status === "Occupied"
            ? "#38bdf8"
            : "#f43f5e";

        // Build polygon shape for berth mooring zone
        const shape = new THREE.Shape();
        berth.polygon.forEach((pt, idx) => {
          const [x, , z] = geoToWorld(pt);
          if (idx === 0) shape.moveTo(x, z);
          else shape.lineTo(x, z);
        });

        // Compute bollard positions along quayside edge of berth polygon
        const p1 = geoToWorld(berth.polygon[0]);
        const p2 = geoToWorld(berth.polygon[1]);

        return (
          <group
            key={berth.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectBerth(berth);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(berth.id);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHoveredId(null);
              document.body.style.cursor = "auto";
            }}
          >
            {/* 1. Berth Mooring Zone Surface Decal */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.46, 0]}>
              <shapeGeometry args={[shape]} />
              <meshStandardMaterial
                color={statusColor}
                transparent
                opacity={isSelected ? 0.45 : isHovered ? 0.35 : 0.22}
                roughness={0.4}
              />
            </mesh>

            {/* 2. Mooring Bollards along quay rim */}
            {[0.2, 0.5, 0.8].map((t, bIdx) => {
              const bx = p1[0] + (p2[0] - p1[0]) * t;
              const bz = p1[2] + (p2[2] - p1[2]) * t;
              return (
                <group key={bIdx} position={[bx, 2.55, bz]}>
                  <mesh castShadow>
                    <cylinderGeometry args={[0.25, 0.3, 0.55, 8]} />
                    <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
                  </mesh>
                  {/* Bollard Cap */}
                  <mesh position={[0, 0.3, 0]}>
                    <sphereGeometry args={[0.32, 8, 8]} />
                    <meshStandardMaterial color="#475569" metalness={0.9} />
                  </mesh>
                </group>
              );
            })}

            {/* 3. Rubber Marine Fender Cylinders on water face */}
            {[0.3, 0.7].map((t, fIdx) => {
              const fx = p1[0] + (p2[0] - p1[0]) * t;
              const fz = p1[2] + (p2[2] - p1[2]) * t;
              return (
                <mesh
                  key={fIdx}
                  position={[fx, 1.2, fz + 0.3]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.45, 0.45, 0.9, 8]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.9} />
                </mesh>
              );
            })}

            {/* 4. High-Tech Berth Label Badge (HTML Overlay) */}
            <Html
              position={[cx, 3.8, cz]}
              center
              distanceFactor={80}
              zIndexRange={[10, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-mono font-bold shadow-lg backdrop-blur-md transition-all select-none ${
                  isSelected
                    ? "bg-slate-900 border-2 border-white text-white ring-2 ring-cyan-400 scale-110"
                    : isHovered
                    ? "bg-slate-900/95 border border-cyan-400 text-cyan-200"
                    : "bg-slate-950/85 border border-slate-700/80 text-slate-300"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <span>{berth.berth_code}</span>
                <span className="text-[9px] font-normal text-slate-400">
                  {berth.max_vessel_length}m
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
