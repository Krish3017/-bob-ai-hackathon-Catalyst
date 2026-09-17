"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { PortTwinVessel } from "@/data/port-twin-data";
import { geoToWorld, headingToRadians } from "./coords";

interface VesselsProps {
  vessels: PortTwinVessel[];
  selectedVesselId?: string | null;
  onSelectVessel: (vessel: PortTwinVessel) => void;
  visible?: boolean;
}

function SingleVessel({
  vessel,
  isSelected,
  onSelect,
}: {
  vessel: PortTwinVessel;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const wakeRef = useRef<THREE.Mesh>(null);

  const [vx, , vz] = geoToWorld(vessel.coordinates, 0);

  const length = Math.max(9, Math.min(20, vessel.loa_meters * 0.048));
  const beam = Math.max(1.8, Math.min(3.2, vessel.beam_meters * 0.055));
  const depth = 1.8;

  const isWorking = vessel.status === "Working";
  const isApproaching = vessel.status === "Approaching";
  const isDelayed = vessel.status === "Delayed";
  const isAnchored = vessel.status === "Anchored";

  const statusColor = isWorking
    ? "#0284c7"
    : isApproaching
    ? "#2563eb"
    : isDelayed
    ? "#ef4444"
    : isAnchored
    ? "#f59e0b"
    : "#7c3aed";

  const rotationAngle = headingToRadians(vessel.heading_degrees);

  // Subtle bow wake wave animation for approaching ships
  useFrame(({ clock }) => {
    if (wakeRef.current && isApproaching) {
      const t = clock.getElapsedTime() * 2.5;
      const s = 1 + Math.sin(t) * 0.12;
      wakeRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group
      position={[vx, 0.1, vz]}
      rotation={[0, rotationAngle, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* 1. Container Ship Hull */}
      <mesh position={[0, depth / 2, length * 0.12]} castShadow receiveShadow>
        <boxGeometry args={[beam, depth, length * 0.76]} />
        <meshStandardMaterial
          color={isDelayed ? "#450a0a" : hovered ? "#1e3a8a" : "#1e293b"}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Raked Bulbous Bow Wedge */}
      <mesh
        position={[0, depth / 2, -length * 0.38]}
        rotation={[Math.PI, 0, 0]}
        castShadow
      >
        <coneGeometry args={[beam / 2, length * 0.28, 4]} />
        <meshStandardMaterial
          color={statusColor}
          roughness={0.5}
        />
      </mesh>

      {/* 2. Container Stacks on Cargo Deck */}
      <group position={[0, depth, -length * 0.08]}>
        {[-0.24, 0, 0.24].map((rowOffset, rIdx) => {
          const numBays = Math.floor(length * 0.26);
          return (
            <group key={rIdx} position={[rowOffset * beam, 0, 0]}>
              {Array.from({ length: numBays }).map((_, bIdx) => {
                const bz = (bIdx - numBays / 2) * 1.5;
                const stackHeight = 1.0 + ((bIdx + rIdx) % 3) * 0.4;
                const colors = ["#1e3a8a", "#15803d", "#c2410c", "#334155", "#f8fafc"];
                const cColor = colors[(bIdx * 2 + rIdx + 1) % colors.length];

                return (
                  <mesh
                    key={bIdx}
                    position={[0, stackHeight / 2, bz]}
                    castShadow
                  >
                    <boxGeometry args={[beam * 0.26, stackHeight, 1.3]} />
                    <meshStandardMaterial color={cColor} roughness={0.4} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>

      {/* 3. Stern Accommodation Castle & Navigation Bridge */}
      <group position={[0, depth + 0.9, length * 0.34]}>
        <mesh castShadow>
          <boxGeometry args={[beam * 0.85, 1.8, 2.2]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[beam * 1.1, 0.5, 1.4]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.5, 0.4]}>
          <cylinderGeometry args={[0.2, 0.25, 1.2, 8]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      </group>

      {/* 4. Bow Wake Wave (Approaching ships) */}
      {isApproaching && (
        <mesh
          ref={wakeRef}
          position={[0, 0.04, -length * 0.44]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[beam * 2.0, 2.8]} />
          <meshBasicMaterial
            color="#bae6fd"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 5. Compact White GIS Vessel Label Tag */}
      <Html
        position={[0, depth + 3.4, 0]}
        center
        distanceFactor={80}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold shadow-sm transition-all select-none whitespace-nowrap ${
            isSelected
              ? "bg-slate-900 border-2 border-blue-500 text-white shadow-md scale-105"
              : hovered
              ? "bg-white border border-blue-500 text-blue-900 shadow"
              : isDelayed
              ? "bg-white border border-rose-500 text-rose-800"
              : "bg-white/95 border border-slate-300 text-slate-800"
          }`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span>{vessel.vessel_name}</span>
          {isApproaching && vessel.speed_knots && (
            <span className="text-[9px] text-blue-600 font-mono font-normal">
              {vessel.speed_knots}kts
            </span>
          )}
          {isWorking && vessel.moves_completed && vessel.moves_total && (
            <span className="text-[9px] text-emerald-600 font-mono font-normal">
              {Math.round((vessel.moves_completed / vessel.moves_total) * 100)}%
            </span>
          )}
          {isDelayed && (
            <span className="text-[9px] text-rose-600 font-mono font-bold">+5.5h</span>
          )}
        </div>
      </Html>
    </group>
  );
}

export function Vessels({
  vessels,
  selectedVesselId,
  onSelectVessel,
  visible = true,
}: VesselsProps) {
  if (!visible) return null;

  return (
    <group>
      {vessels.map((vessel) => (
        <SingleVessel
          key={vessel.id}
          vessel={vessel}
          isSelected={selectedVesselId === vessel.id}
          onSelect={() => onSelectVessel(vessel)}
        />
      ))}
    </group>
  );
}
