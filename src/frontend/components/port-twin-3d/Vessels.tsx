"use client";

import React, { useState, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { PortTwinVessel, PortTwinBerth } from "@/data/port-twin-data";
import { resolveVesselLayout, ResolvedVesselDisplay } from "@/lib/vessel-layout";

// Shipping line container color tokens
const CONTAINER_PALETTE = [
  "#1e3a8a", // Maersk Deep Navy
  "#15803d", // Evergreen Forest Green
  "#c2410c", // Hapag-Lloyd Burnt Orange
  "#2563eb", // CMA CGM Blue
  "#334155", // Slate Grey
  "#ffffff", // Reefer White
];

interface VesselsProps {
  vessels: PortTwinVessel[];
  berths?: PortTwinBerth[];
  selectedVesselId?: string | null;
  onSelectVessel: (vessel: PortTwinVessel) => void;
  onHoverVessel?: (vessel: PortTwinVessel | null, x?: number, y?: number) => void;
  visible?: boolean;
}

// Single Recognizable Container Ship Model
function ContainerShip({
  display,
  isSelected,
  onSelect,
  onHover,
}: {
  display: ResolvedVesselDisplay;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: (vessel: PortTwinVessel | null, x?: number, y?: number) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const { vessel, worldPosition, rotationY, labelOffsetY, labelOffsetX, isSecondaryBerthed } = display;

  // Dimension scaling based on Length Overall (LOA)
  const length = Math.max(11, Math.min(22, vessel.loa_meters * 0.05));
  const beam = Math.max(2.2, Math.min(3.6, vessel.beam_meters * 0.06));
  const hullHeight = 1.6;

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

  const hasHighPriority = isSelected || hovered || isDelayed;

  return (
    <group
      position={worldPosition}
      rotation={[0, rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if ((e as any).delta > 4) return;
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
        onHover?.(vessel, e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover?.(vessel, e.clientX, e.clientY);
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
        onHover?.(null);
      }}
    >
      {/* ================= 1. SHIP HULL ================= */}
      {/* Aft & Midbody Hull (Parallel midbody with slight sheer) */}
      <mesh position={[0, hullHeight / 2, length * 0.1]} castShadow receiveShadow>
        <boxGeometry args={[beam, hullHeight, length * 0.7]} />
        <meshStandardMaterial
          color={isDelayed ? "#450a0a" : hovered ? "#1e3a8a" : "#1e293b"}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {/* Red Anti-fouling Boot-topping Stripe at Waterline */}
      <mesh position={[0, 0.15, length * 0.1]}>
        <boxGeometry args={[beam + 0.05, 0.28, length * 0.72]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
      </mesh>

      {/* Tapered Raked Bow Section (Pointing towards -Z) */}
      <mesh
        position={[0, hullHeight / 2, -length * 0.32]}
        rotation={[Math.PI, 0, 0]}
        castShadow
      >
        <coneGeometry args={[beam / 2, length * 0.22, 4]} />
        <meshStandardMaterial
          color={hovered ? "#1e3a8a" : "#1e293b"}
          roughness={0.6}
        />
      </mesh>

      {/* Bulbous Bow Stem Foot Wedge */}
      <mesh position={[0, 0.2, -length * 0.44]}>
        <sphereGeometry args={[beam * 0.22, 8, 8]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.7} />
      </mesh>

      {/* Flatter Transom Stern Block (Aft) */}
      <mesh position={[0, hullHeight / 2 + 0.1, length * 0.44]} castShadow>
        <boxGeometry args={[beam * 0.9, hullHeight * 0.8, length * 0.08]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* ================= 2. CARGO DECK & CONTAINER STACKS ================= */}
      <group position={[0, hullHeight, -length * 0.06]}>
        {/* Cargo Deck Surface */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[beam * 0.92, 0.1, length * 0.62]} />
          <meshStandardMaterial color="#334155" roughness={0.8} />
        </mesh>

        {/* 3 Rows of Organized Container Bays */}
        {[-0.26, 0, 0.26].map((rowFrac, rIdx) => {
          const numBays = Math.floor(length * 0.24);
          return (
            <group key={rIdx} position={[rowFrac * beam, 0.1, 0]}>
              {Array.from({ length: numBays }).map((_, bIdx) => {
                const bz = (bIdx - numBays / 2 + 0.5) * 1.6;
                const stackTiers = 2 + ((bIdx + rIdx) % 2);
                const cHeight = 0.55 * stackTiers;
                const cColor = CONTAINER_PALETTE[(bIdx * 2 + rIdx + 1) % CONTAINER_PALETTE.length];

                return (
                  <mesh
                    key={bIdx}
                    position={[0, cHeight / 2, bz]}
                    castShadow
                  >
                    <boxGeometry args={[beam * 0.24, cHeight, 1.4]} />
                    <meshStandardMaterial color={cColor} roughness={0.4} metalness={0.1} />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>

      {/* ================= 3. AFT ACCOMMODATION CASTLE & BRIDGE ================= */}
      <group position={[0, hullHeight + 0.75, length * 0.32]}>
        {/* Main Accommodation Castle Deckhouse */}
        <mesh castShadow>
          <boxGeometry args={[beam * 0.85, 1.4, 2.0]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
        {/* Navigation Bridge Level with Overhanging Wings */}
        <mesh position={[0, 0.85, 0]} castShadow>
          <boxGeometry args={[beam * 1.12, 0.45, 1.4]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Twin Exhaust Funnel Casing */}
        <mesh position={[0, 1.4, 0.4]} castShadow>
          <boxGeometry args={[beam * 0.35, 0.8, 0.6]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Fore Radar Mast */}
        <mesh position={[0, 1.5, -0.4]}>
          <cylinderGeometry args={[0.04, 0.05, 1.1, 6]} />
          <meshStandardMaterial color="#94a3b8" />
        </mesh>
      </group>

      {/* ================= 4. COLLISION-AWARE GIS VESSEL LABEL ================= */}
      <Html
        position={[labelOffsetX, hullHeight + labelOffsetY, 0]}
        center
        distanceFactor={85}
        zIndexRange={hasHighPriority ? [100, 50] : [20, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] font-bold shadow-sm transition-all select-none whitespace-nowrap ${
            isSelected
              ? "bg-slate-900 border border-blue-400 text-white shadow-lg ring-2 ring-blue-500/40 z-30"
              : hovered
              ? "bg-white border border-blue-500 text-blue-950 shadow-md ring-1 ring-blue-400/50 z-30"
              : isDelayed
              ? "bg-white border border-rose-500 text-rose-900 shadow-sm z-20"
              : "bg-white/95 border border-slate-300 text-slate-800 shadow-sm z-10"
          }`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ backgroundColor: statusColor }}
          />
          <span>{vessel.vessel_name}</span>
          {isSecondaryBerthed && vessel.assigned_berth_code && (
            <span className="text-[7.5px] font-mono px-1 py-0.2 bg-amber-100 text-amber-900 rounded font-semibold">
              Q:{vessel.assigned_berth_code}
            </span>
          )}
          {(isSelected || hovered) && vessel.assigned_berth_code && !isSecondaryBerthed && (
            <span className="text-[7.5px] font-mono px-1 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold">
              {vessel.assigned_berth_code}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
}

export function Vessels({
  vessels,
  berths = [],
  selectedVesselId,
  onSelectVessel,
  onHoverVessel,
  visible = true,
}: VesselsProps) {
  // Compute deterministic, collision-free layout for all vessels
  const resolvedDisplays = useMemo(() => {
    return resolveVesselLayout(vessels, berths);
  }, [vessels, berths]);

  if (!visible) return null;

  return (
    <group>
      {resolvedDisplays.map((disp) => (
        <ContainerShip
          key={disp.vessel.id}
          display={disp}
          isSelected={selectedVesselId === disp.vessel.id}
          onSelect={() => onSelectVessel(disp.vessel)}
          onHover={onHoverVessel}
        />
      ))}
    </group>
  );
}
