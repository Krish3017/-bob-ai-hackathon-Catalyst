"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { PortTwinCrane } from "@/data/port-twin-data";
import { getQuayCranePosition, QUAY_ANGLE } from "./coords";

interface STSCranesProps {
  cranes: PortTwinCrane[];
  selectedCraneId?: string | null;
  onSelectCrane: (crane: PortTwinCrane) => void;
  onHoverCrane?: (crane: PortTwinCrane | null, x?: number, y?: number) => void;
  visible?: boolean;
}

function SingleSTSCrane({
  crane,
  isSelected,
  onSelect,
  onHover,
}: {
  crane: PortTwinCrane;
  isSelected: boolean;
  onSelect: () => void;
  onHover?: (crane: PortTwinCrane | null, x?: number, y?: number) => void;
}) {
  const [hovered, setHovered] = useState(false);

  // Position crane securely on the quayside rail
  const [cx, cy, cz] = getQuayCranePosition(crane.coordinates);

  const isFailed = crane.status === "Failed";
  const isMaint = crane.status === "Maintenance";
  const isBusy = crane.status === "Busy";

  const statusColor = isFailed
    ? "#ef4444"
    : isMaint
    ? "#f59e0b"
    : isBusy
    ? "#2563eb"
    : "#10b981";

  // Static boom orientation reaching over the water towards berthed ships
  const craneRotation = QUAY_ANGLE;

  return (
    <group
      position={[cx, cy, cz]}
      rotation={[0, craneRotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if ((e as any).delta > 4) return;
        onSelect();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
        onHover?.(crane, e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        e.stopPropagation();
        onHover?.(crane, e.clientX, e.clientY);
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
        onHover?.(null);
      }}
    >
      {/* 1. Gantry Wheel Rail Bogies (Corner carriages) */}
      {[
        [-1.3, -1.5],
        [1.3, -1.5],
        [-1.3, 1.5],
        [1.3, 1.5],
      ].map(([wx, wz], idx) => (
        <mesh key={idx} position={[wx, 0.12, wz]}>
          <boxGeometry args={[0.38, 0.22, 0.65]} />
          <meshStandardMaterial color="#475569" metalness={0.6} />
        </mesh>
      ))}

      {/* 2. Gantry Portal Legs (Crisp White / Marine Steel Architecture) */}
      <group position={[0, 0, -1.5]}>
        <mesh position={[-1.05, 3.2, 0]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[0.28, 6.4, 0.28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[1.05, 3.2, 0]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[0.28, 6.4, 0.28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 6.2, 0]}>
          <boxGeometry args={[2.5, 0.28, 0.28]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>

      <group position={[0, 0, 1.5]}>
        <mesh position={[-1.05, 3.2, 0]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[0.28, 6.4, 0.28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[1.05, 3.2, 0]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[0.28, 6.4, 0.28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 6.2, 0]}>
          <boxGeometry args={[2.5, 0.28, 0.28]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>

      {/* 3. Machinery House & Operator Cab */}
      <mesh position={[0, 6.8, -1.0]}>
        <boxGeometry args={[1.9, 0.95, 1.7]} />
        <meshStandardMaterial color={isFailed ? "#ef4444" : "#e2e8f0"} roughness={0.4} />
      </mesh>

      {/* 4. Upper Tower Apex */}
      <mesh position={[0, 8.2, -0.2]}>
        <boxGeometry args={[1.2, 1.8, 0.35]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>

      {/* 5. Horizontal Boom Arm Extending Outward Over Water (Static) */}
      <mesh position={[0, 6.6, 3.2]}>
        <boxGeometry args={[0.65, 0.42, 11.2]} />
        <meshStandardMaterial
          color={isFailed ? "#ef4444" : hovered ? "#2563eb" : "#f1f5f9"}
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>

      {/* Back-reach Counterweight Arm */}
      <mesh position={[0, 6.6, -3.2]}>
        <boxGeometry args={[0.65, 0.42, 3.6]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>

      {/* 6. Static Trolley & Spreader Assembly (Stable positioning) */}
      <group position={[0, 6.2, 3.5]}>
        <mesh>
          <boxGeometry args={[0.85, 0.22, 0.85]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Steel hoist cables */}
        <mesh position={[-0.28, -0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.6]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
        <mesh position={[0.28, -0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.6]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
        {/* Spreader Frame */}
        <mesh position={[0, -1.6, 0]}>
          <boxGeometry args={[1.05, 0.16, 2.1]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        {/* Container (if actively working) */}
        {isBusy && !isFailed && (
          <mesh position={[0, -2.1, 0]}>
            <boxGeometry args={[0.9, 0.72, 1.9]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
          </mesh>
        )}
      </group>

      {/* 7. Minimal Status Indicator (Only on Failed, Selected, or Hovered) */}
      {(isFailed || isSelected || hovered) && (
        <Html
          position={[0, 9.4, 0]}
          center
          distanceFactor={80}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold shadow-sm transition-all select-none ${
              isFailed
                ? "bg-white/98 border border-rose-400 text-rose-700 shadow-md"
                : isSelected
                ? "bg-slate-900 border border-blue-500 text-white shadow-md"
                : "bg-white/95 border border-slate-300 text-slate-800"
            }`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            <span>{crane.crane_code}</span>
            {isFailed && (
              <span className="text-[7px] bg-rose-100 text-rose-700 px-1 rounded font-bold uppercase">
                FAIL
              </span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export function STSCranes({
  cranes,
  selectedCraneId,
  onSelectCrane,
  onHoverCrane,
  visible = true,
}: STSCranesProps) {
  if (!visible) return null;

  return (
    <group>
      {cranes.map((crane) => (
        <SingleSTSCrane
          key={crane.id}
          crane={crane}
          isSelected={selectedCraneId === crane.id}
          onSelect={() => onSelectCrane(crane)}
          onHover={onHoverCrane}
        />
      ))}
    </group>
  );
}
