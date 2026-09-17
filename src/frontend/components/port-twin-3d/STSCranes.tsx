"use client";

import React, { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { PortTwinCrane } from "@/data/port-twin-data";
import { geoToWorld } from "./coords";

interface STSCranesProps {
  cranes: PortTwinCrane[];
  selectedCraneId?: string | null;
  onSelectCrane: (crane: PortTwinCrane) => void;
  visible?: boolean;
}

function SingleSTSCrane({
  crane,
  isSelected,
  onSelect,
}: {
  crane: PortTwinCrane;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const trolleyRef = useRef<THREE.Group>(null);

  const [cx, , cz] = geoToWorld(crane.coordinates, 0.4);

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

  const craneRotation = -0.34;

  // Subtle spreader trolley translation along boom arm
  useFrame(({ clock }) => {
    if (trolleyRef.current && isBusy && !isFailed) {
      const t = clock.getElapsedTime() * 0.7;
      const offset = Math.sin(t) * 2.8 + 1.8;
      trolleyRef.current.position.z = offset;
    }
  });

  return (
    <group
      position={[cx, 0.4, cz]}
      rotation={[0, craneRotation, 0]}
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
      {/* 1. Gantry Wheel Carriages */}
      {[
        [-1.4, -1.6],
        [1.4, -1.6],
        [-1.4, 1.6],
        [1.4, 1.6],
      ].map(([wx, wz], idx) => (
        <mesh key={idx} position={[wx, 0.12, wz]}>
          <boxGeometry args={[0.4, 0.25, 0.7]} />
          <meshStandardMaterial color="#475569" metalness={0.6} />
        </mesh>
      ))}

      {/* 2. Gantry Portal Legs (Crisp White / Steel Grey Marine Architecture) */}
      <group position={[0, 0, -1.6]}>
        <mesh position={[-1.1, 3.2, 0]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[0.3, 6.4, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[1.1, 3.2, 0]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[0.3, 6.4, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 6.2, 0]}>
          <boxGeometry args={[2.6, 0.3, 0.3]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>

      <group position={[0, 0, 1.6]}>
        <mesh position={[-1.1, 3.2, 0]} rotation={[0, 0, -0.14]}>
          <boxGeometry args={[0.3, 6.4, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[1.1, 3.2, 0]} rotation={[0, 0, 0.14]}>
          <boxGeometry args={[0.3, 6.4, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 6.2, 0]}>
          <boxGeometry args={[2.6, 0.3, 0.3]} />
          <meshStandardMaterial color="#cbd5e1" />
        </mesh>
      </group>

      {/* 3. Machinery House & Operator Cab */}
      <mesh position={[0, 6.8, -1.0]}>
        <boxGeometry args={[2.0, 1.0, 1.8]} />
        <meshStandardMaterial color={isFailed ? "#ef4444" : "#e2e8f0"} roughness={0.4} />
      </mesh>

      {/* 4. Upper Tower Apex */}
      <mesh position={[0, 8.2, -0.2]}>
        <boxGeometry args={[1.3, 1.8, 0.4]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>

      {/* 5. Horizontal Boom Arm Extending Outward Over Water */}
      <mesh position={[0, 6.6, 3.2]}>
        <boxGeometry args={[0.7, 0.45, 11.5]} />
        <meshStandardMaterial
          color={isFailed ? "#ef4444" : hovered ? "#2563eb" : "#f1f5f9"}
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>

      {/* Back-reach Arm */}
      <mesh position={[0, 6.6, -3.2]}>
        <boxGeometry args={[0.7, 0.45, 3.8]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>

      {/* 6. Trolley & Spreader Holding Container */}
      <group ref={trolleyRef} position={[0, 6.2, 3.0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.25, 0.9]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        {/* Steel cables */}
        <mesh position={[-0.3, -0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.6]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
        <mesh position={[0.3, -0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.6]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
        {/* Spreader */}
        <mesh position={[0, -1.6, 0]}>
          <boxGeometry args={[1.1, 0.18, 2.2]} />
          <meshStandardMaterial color="#d97706" />
        </mesh>
        {isBusy && !isFailed && (
          <mesh position={[0, -2.1, 0]}>
            <boxGeometry args={[0.95, 0.75, 2.0]} />
            <meshStandardMaterial color="#1e3a8a" roughness={0.4} />
          </mesh>
        )}
      </group>

      {/* 7. Compact White GIS Crane Tag */}
      <Html
        position={[0, 9.6, 0]}
        center
        distanceFactor={80}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold shadow-sm transition-all select-none ${
            isSelected
              ? "bg-slate-900 border-2 border-blue-500 text-white shadow-md scale-105"
              : hovered
              ? "bg-white border border-blue-500 text-blue-900 shadow"
              : "bg-white/95 border border-slate-300 text-slate-700"
          }`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          <span>{crane.crane_code}</span>
          {isFailed && (
            <span className="text-[7px] text-rose-600 font-bold uppercase">ERR</span>
          )}
        </div>
      </Html>
    </group>
  );
}

export function STSCranes({
  cranes,
  selectedCraneId,
  onSelectCrane,
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
        />
      ))}
    </group>
  );
}
