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
  onHoverBerth?: (berth: PortTwinBerth | null, x?: number, y?: number) => void;
  visible?: boolean;
}

export function Berths({
  berths,
  selectedBerthId,
  onSelectBerth,
  onHoverBerth,
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
              if ((e as any).delta > 4) return;
              onSelectBerth(berth);
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHoveredId(berth.id);
              document.body.style.cursor = "pointer";
              onHoverBerth?.(berth, e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              e.stopPropagation();
              onHoverBerth?.(berth, e.clientX, e.clientY);
            }}
            onPointerOut={() => {
              setHoveredId(null);
              document.body.style.cursor = "auto";
              onHoverBerth?.(null);
            }}
          >
            {/* 1. Berth Mooring Pocket Decal Pad */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.38, 0]}>
              <shapeGeometry args={[shape]} />
              <meshStandardMaterial
                color={fillColor}
                transparent
                opacity={isSelected ? 0.95 : isHovered ? 0.8 : 0.65}
                roughness={0.5}
              />
            </mesh>

            {/* Physical Quay Coping Beam Strip along water boundary */}
            {(() => {
              const dx = p2[0] - p1[0];
              const dz = p2[2] - p1[2];
              const segLength = Math.hypot(dx, dz);
              const segAngle = Math.atan2(dx, dz);
              const midX = (p1[0] + p2[0]) / 2;
              const midZ = (p1[2] + p2[2]) / 2;
              return (
                <group>
                  {/* Heavy Concrete Quay Edge Cap */}
                  <mesh
                    position={[midX, 0.41, midZ]}
                    rotation={[0, segAngle, 0]}
                    castShadow
                    receiveShadow
                  >
                    <boxGeometry args={[0.55, 0.12, segLength]} />
                    <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.2} />
                  </mesh>
                  {/* High-visibility Quay Safety Curb Line */}
                  <mesh
                    position={[midX, 0.43, midZ]}
                    rotation={[0, segAngle, 0]}
                  >
                    <boxGeometry args={[0.15, 0.04, segLength * 0.98]} />
                    <meshStandardMaterial color={isSelected ? "#3b82f6" : "#f59e0b"} roughness={0.5} />
                  </mesh>
                  {/* Berth Boundary Pylons at ends */}
                  <mesh position={[p1[0], 0.5, p1[2]]}>
                    <cylinderGeometry args={[0.2, 0.25, 0.6, 6]} />
                    <meshStandardMaterial color="#334155" metalness={0.5} />
                  </mesh>
                  <mesh position={[p2[0], 0.5, p2[2]]}>
                    <cylinderGeometry args={[0.2, 0.25, 0.6, 6]} />
                    <meshStandardMaterial color="#334155" metalness={0.5} />
                  </mesh>
                </group>
              );
            })()}

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

            {/* 4. Compact Light GIS Berth Marker Badge */}
            <Html
              position={[cx, 1.2, cz]}
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
                    : "bg-white/95 border border-slate-300 text-slate-800"
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: statusColor }}
                />
                <span>{berth.berth_code}</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
