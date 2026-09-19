"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { PortTwinDisruption } from "@/data/port-twin-data";
import { geoToWorld } from "./coords";

interface DisruptionOverlaysProps {
  disruptions: PortTwinDisruption[];
  selectedDisruptionId?: string | null;
  onSelectDisruption: (d: PortTwinDisruption) => void;
  visible?: boolean;
}

export function DisruptionOverlays({
  disruptions,
  selectedDisruptionId,
  onSelectDisruption,
  visible = true,
}: DisruptionOverlaysProps) {
  if (!visible) return null;

  return (
    <group>
      {disruptions.map((d) => {
        const isSelected = selectedDisruptionId === d.id;
        const [dx, , dz] = geoToWorld(d.coordinates, 0.4);
        const isCritical = d.severity === "Critical";
        const ringColor = isCritical ? "#ef4444" : "#f59e0b";

        return (
          <group
            key={d.id}
            position={[dx, 0.42, dz]}
            onClick={(e) => {
              e.stopPropagation();
              if ((e as any).delta > 4) return;
              onSelectDisruption(d);
            }}
          >
            {/* 1. Subtle Static Warning Halo Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.2, 2.2, 24]} />
              <meshBasicMaterial
                color={ringColor}
                transparent
                opacity={isSelected ? 0.5 : 0.25}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Subtle central pin */}
            <mesh position={[0, 1.2, 0]}>
              <cylinderGeometry args={[0.04, 0.12, 2.4, 6]} />
              <meshBasicMaterial color={ringColor} />
            </mesh>
            <mesh position={[0, 2.4, 0]}>
              <sphereGeometry args={[0.25, 8, 8]} />
              <meshBasicMaterial color={ringColor} />
            </mesh>

            {/* 2. Compact White GIS Disruption Badge */}
            <Html
              position={[0, 3.2, 0]}
              center
              distanceFactor={80}
              zIndexRange={[15, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] font-mono font-bold shadow-sm transition-all select-none whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 border-2 border-rose-500 text-white shadow-md scale-105"
                    : "bg-white/95 border border-rose-400 text-rose-700 hover:border-rose-600"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>{d.incident_code}</span>
                <span className="text-[8px] text-slate-500 font-sans font-normal">
                  · {d.incident_type}
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
