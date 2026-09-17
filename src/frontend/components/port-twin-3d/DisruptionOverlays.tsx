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
  const radarGroupRef = useRef<THREE.Group>(null);

  // Pulse animation for hazard rings
  useFrame(({ clock }) => {
    if (radarGroupRef.current) {
      const t = clock.getElapsedTime() * 2;
      radarGroupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        if (mesh.isMesh) {
          const s = 1 + ((t + i * 0.7) % 2) * 0.6;
          mesh.scale.set(s, 1, s);
        }
      });
    }
  });

  if (!visible) return null;

  return (
    <group ref={radarGroupRef}>
      {disruptions.map((d) => {
        const isSelected = selectedDisruptionId === d.id;
        const [dx, , dz] = geoToWorld(d.coordinates, 2.5);
        const isCritical = d.severity === "Critical";
        const ringColor = isCritical ? "#f43f5e" : "#f59e0b";

        return (
          <group
            key={d.id}
            position={[dx, 2.6, dz]}
            onClick={(e) => {
              e.stopPropagation();
              onSelectDisruption(d);
            }}
          >
            {/* 1. Pulsing Hazard Radar Disk */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.5, 3.8, 32]} />
              <meshBasicMaterial
                color={ringColor}
                transparent
                opacity={isSelected ? 0.6 : 0.35}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* 2. Vertical Hazard Warning Beacon Pillar */}
            <mesh position={[0, 4.0, 0]}>
              <cylinderGeometry args={[0.08, 0.4, 8, 8]} />
              <meshStandardMaterial
                color={ringColor}
                emissive={ringColor}
                emissiveIntensity={0.8}
                transparent
                opacity={0.65}
              />
            </mesh>

            {/* Hazard Point Light */}
            <pointLight position={[0, 8.0, 0]} color={ringColor} intensity={3} distance={20} />

            {/* 3. Disruption Floating Badge HUD */}
            <Html
              position={[0, 8.8, 0]}
              center
              distanceFactor={80}
              zIndexRange={[15, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold shadow-2xl backdrop-blur-md transition-all select-none whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-rose-950 border-2 border-white text-white ring-2 ring-rose-400 scale-110"
                    : "bg-slate-900/95 border border-rose-500/80 text-rose-200"
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                <span>{d.incident_code}</span>
                <span className="text-[9px] text-slate-300 font-sans font-normal">
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
