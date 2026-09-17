"use client";

import React, { useRef, useState, useMemo } from "react";
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

// Single 3D Container Ship Model
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

  // Map world position from vessel coordinates
  const [vx, , vz] = geoToWorld(vessel.coordinates, 0);

  // Vessel scale derived from real Length Overall (LOA)
  // E.g. 400m ULCS = length 22, beam 3.4
  const length = Math.max(10, Math.min(24, vessel.loa_meters * 0.055));
  const beam = Math.max(2.0, Math.min(3.8, vessel.beam_meters * 0.065));
  const depth = 2.4;

  const isWorking = vessel.status === "Working";
  const isApproaching = vessel.status === "Approaching";
  const isDelayed = vessel.status === "Delayed";
  const isAnchored = vessel.status === "Anchored";

  const statusColor = isWorking
    ? "#38bdf8"
    : isApproaching
    ? "#60a5fa"
    : isDelayed
    ? "#f43f5e"
    : isAnchored
    ? "#fbbf24"
    : "#a855f7";

  // Three.js rotation angle from compass heading
  // In our coordinate system: 0° is North (-Z), 90° is East (+X).
  // Standard ship model has bow pointing towards -Z.
  const rotationAngle = headingToRadians(vessel.heading_degrees);

  // Subtle bow wake wave animation for approaching ships
  useFrame(({ clock }) => {
    if (wakeRef.current && isApproaching) {
      const t = clock.getElapsedTime() * 3;
      const s = 1 + Math.sin(t) * 0.15;
      wakeRef.current.scale.set(s, s, 1);
    }
  });

  return (
    <group
      position={[vx, 0.4, vz]}
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
      {/* 1. Main Ship Hull (Dark Marine Steel) */}
      {/* Midbody & Aft Hull */}
      <mesh position={[0, depth / 2, length * 0.12]} castShadow receiveShadow>
        <boxGeometry args={[beam, depth, length * 0.76]} />
        <meshStandardMaterial
          color={isDelayed ? "#2a1520" : hovered ? "#1e293b" : "#0f172a"}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>

      {/* Raked Bulbous Bow Wedge (Pointing towards -Z / Bow) */}
      <mesh
        position={[0, depth / 2, -length * 0.38]}
        rotation={[Math.PI, 0, 0]}
        castShadow
      >
        <coneGeometry args={[beam / 2, length * 0.28, 4]} />
        <meshStandardMaterial
          color={statusColor}
          roughness={0.6}
          metalness={0.4}
        />
      </mesh>

      {/* Red/Amber Antifouling Underwater Hull Boot-topping stripe */}
      <mesh position={[0, 0.2, length * 0.12]}>
        <boxGeometry args={[beam + 0.08, 0.35, length * 0.74]} />
        <meshStandardMaterial color="#991b1b" roughness={0.8} />
      </mesh>

      {/* 2. Container Bays on Cargo Deck */}
      <group position={[0, depth, -length * 0.08]}>
        {[-0.26, 0, 0.26].map((rowOffset, rIdx) => {
          const numBays = Math.floor(length * 0.28);
          return (
            <group key={rIdx} position={[rowOffset * beam, 0, 0]}>
              {Array.from({ length: numBays }).map((_, bIdx) => {
                const bz = (bIdx - numBays / 2) * 1.8;
                const stackHeight = 1.4 + ((bIdx + rIdx) % 3) * 0.5;
                const colors = ["#0284c7", "#15803d", "#ea580c", "#831843", "#f8fafc"];
                const cColor = colors[(bIdx * 2 + rIdx + 1) % colors.length];

                return (
                  <mesh
                    key={bIdx}
                    position={[0, stackHeight / 2, bz]}
                    castShadow
                  >
                    <boxGeometry args={[beam * 0.28, stackHeight, 1.5]} />
                    <meshStandardMaterial color={cColor} roughness={0.4} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>

      {/* 3. Stern Accommodation Castle & Navigation Bridge (White Superstructure) */}
      <group position={[0, depth + 1.2, length * 0.34]}>
        {/* Main Accommodation Block */}
        <mesh castShadow>
          <boxGeometry args={[beam * 0.85, 2.4, 2.8]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        {/* Navigation Bridge Wings */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[beam * 1.15, 0.7, 1.8]} />
          <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.6} />
        </mesh>
        {/* Exhaust Funnel Stacks */}
        <mesh position={[0, 2.2, 0.6]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 1.6, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Radar Mast Pillar */}
        <mesh position={[0, 2.6, -0.4]}>
          <cylinderGeometry args={[0.08, 0.1, 1.8, 6]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
        {/* Nav Mast Top Beacon */}
        <pointLight position={[0, 3.5, -0.4]} color={statusColor} intensity={2} distance={12} />
      </group>

      {/* 4. Bow Wake Ripple Wave (If vessel is navigating / approaching) */}
      {isApproaching && (
        <mesh
          ref={wakeRef}
          position={[0, 0.05, -length * 0.46]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[beam * 2.2, 3.5]} />
          <meshBasicMaterial
            color="#e0f2fe"
            transparent
            opacity={0.45}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 5. Vessel Label HUD */}
      <Html
        position={[0, depth + 4.8, 0]}
        center
        distanceFactor={80}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold shadow-2xl backdrop-blur-md transition-all select-none whitespace-nowrap ${
            isSelected
              ? "bg-slate-900 border-2 border-white text-white ring-2 ring-cyan-400 scale-110"
              : hovered
              ? "bg-slate-900/95 border border-cyan-400 text-cyan-200"
              : isDelayed
              ? "bg-rose-950/90 border border-rose-500 text-rose-100 ring-1 ring-rose-500"
              : "bg-slate-950/90 border border-slate-700/80 text-slate-200"
          }`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span>{vessel.vessel_name}</span>
          {isApproaching && vessel.speed_knots && (
            <span className="text-[9px] text-cyan-300 font-mono font-normal">
              {vessel.speed_knots}kts
            </span>
          )}
          {isWorking && vessel.moves_completed && vessel.moves_total && (
            <span className="text-[9px] text-emerald-400 font-mono font-normal">
              {Math.round((vessel.moves_completed / vessel.moves_total) * 100)}%
            </span>
          )}
          {isDelayed && (
            <span className="text-[9px] text-rose-400 font-mono font-bold">+5.5h</span>
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
