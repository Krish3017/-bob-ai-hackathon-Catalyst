"use client";

import React, { useState } from "react";
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
        const [cx, , cz] = geoToWorld(berth.coordinates, 0.4);

        // Status color token
        const statusColor =
          berth.status === "Available"
            ? "#10b981"
            : berth.status === "Occupied"
            ? "#2563eb"
            : "#ef4444";

        const fillColor =
          berth.status === "Available"
            ? "#ecfdf5"
            : berth.status === "Occupied"
            ? "#eff6ff"
            : "#fff1f2";

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
            {/* 1. Berth Mooring Pocket Decal Pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.38, 0]}>
              <shapeGeometry args={[shape]} />
              <meshStandardMaterial
                color={fillColor}
                transparent
                opacity={isSelected ? 0.9 : isHovered ? 0.75 : 0.6}
                roughness={0.5}
              />
            </mesh>

            {/* Berth Edge Boundary Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.385, 0]}>
              <ringGeometry args={[0, 0, 4]} />
            </mesh>

            {/* 2. Mooring Bollards along quay rim */}
            {[0.2, 0.5, 0.8].map((t, bIdx) => {
              const bx = p1[0] + (p2[0] - p1[0]) * t;
              const bz = p1[2] + (p2[2] - p1[2]) * t;
              return (
                <group key={bIdx} position={[bx, 0.42, bz]}>
                  <mesh>
                    <cylinderGeometry args={[0.18, 0.22, 0.35, 8]} />
                    <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
                  </mesh>
                  <mesh position={[0, 0.2, 0]}>
                    <sphereGeometry args={[0.22, 8, 8]} />
                    <meshStandardMaterial color="#334155" metalness={0.7} />
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
                  position={[fx, 0.18, fz + 0.2]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.3, 0.3, 0.6, 8]} />
                  <meshStandardMaterial color="#334155" roughness={0.9} />
                </mesh>
              );
            })}

            {/* 4. Compact Light GIS Berth Label Badge */}
            <Html
              position={[cx, 1.4, cz]}
              center
              distanceFactor={85}
              zIndexRange={[10, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono font-bold shadow-sm transition-all select-none ${
                  isSelected
                    ? "bg-slate-900 border-2 border-blue-500 text-white shadow-md scale-105"
                    : isHovered
                    ? "bg-white border border-blue-500 text-blue-900 shadow"
                    : "bg-white/95 border border-slate-300 text-slate-800"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <span>{berth.berth_code}</span>
                <span className="text-[9px] font-normal text-slate-500 font-sans">
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
