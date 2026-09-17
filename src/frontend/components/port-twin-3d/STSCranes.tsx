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

// Single animated STS Container Crane Sub-component
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

  const [cx, , cz] = geoToWorld(crane.coordinates, 2.5);

  const isFailed = crane.status === "Failed";
  const isMaint = crane.status === "Maintenance";
  const isBusy = crane.status === "Busy";

  const statusColor = isFailed
    ? "#f43f5e"
    : isMaint
    ? "#f59e0b"
    : isBusy
    ? "#38bdf8"
    : "#10b981";

  // Boom rotation angle: Quay wall runs roughly at angle -0.34 rad (-19.5 deg).
  // Boom reaches outward towards the sea (+Z / South-East direction).
  const craneRotation = -0.34;

  // Animate trolley and spreader hoist back and forth along boom if crane is busy
  useFrame(({ clock }) => {
    if (trolleyRef.current && isBusy && !isFailed) {
      const t = clock.getElapsedTime() * 0.8;
      // Trolley moves along local Z axis from landside (-2) to seaside (+6)
      const offset = Math.sin(t) * 3.5 + 2.0;
      trolleyRef.current.position.z = offset;
    }
  });

  return (
    <group
      position={[cx, 2.5, cz]}
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
      {/* 1. Gantry Wheel Rail Carriages (4 corner bogies) */}
      {[
        [-1.6, -1.8],
        [1.6, -1.8],
        [-1.6, 1.8],
        [1.6, 1.8],
      ].map(([wx, wz], idx) => (
        <mesh key={idx} position={[wx, 0.2, wz]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.9]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.2} />
        </mesh>
      ))}

      {/* 2. Gantry Portal Legs (A-frame structure) */}
      {/* Landside A-frame */}
      <group position={[0, 0, -1.8]}>
        <mesh position={[-1.2, 4.0, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.4, 8.2, 0.4]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[1.2, 4.0, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.4, 8.2, 0.4]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Horizontal tie beam */}
        <mesh position={[0, 7.8, 0]} castShadow>
          <boxGeometry args={[3.2, 0.4, 0.4]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
      </group>

      {/* Seaside A-frame */}
      <group position={[0, 0, 1.8]}>
        <mesh position={[-1.2, 4.0, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.4, 8.2, 0.4]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[1.2, 4.0, 0]} rotation={[0, 0, 0.15]} castShadow>
          <boxGeometry args={[0.4, 8.2, 0.4]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Horizontal tie beam */}
        <mesh position={[0, 7.8, 0]} castShadow>
          <boxGeometry args={[3.2, 0.4, 0.4]} />
          <meshStandardMaterial color="#475569" metalness={0.7} />
        </mesh>
      </group>

      {/* Side cross bracing between legs */}
      <mesh position={[-1.4, 4.5, 0]} rotation={[0.45, 0, 0]}>
        <boxGeometry args={[0.2, 0.2, 4.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[1.4, 4.5, 0]} rotation={[-0.45, 0, 0]}>
        <boxGeometry args={[0.2, 0.2, 4.2]} />
        <meshStandardMaterial color="#334155" />
      </mesh>

      {/* 3. Machinery House & Operator Cab (top girder level) */}
      <mesh position={[0, 8.4, -1.2]} castShadow>
        <boxGeometry args={[2.4, 1.2, 2.2]} />
        <meshStandardMaterial color={isFailed ? "#f43f5e" : "#1e293b"} metalness={0.5} />
      </mesh>

      {/* 4. Upper Tower Apex & Stay Cables */}
      <mesh position={[0, 10.2, -0.2]} castShadow>
        <boxGeometry args={[1.6, 2.4, 0.5]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* 5. Horizontal Boom Arm Extending Over Water (Length ~14 units) */}
      <mesh position={[0, 8.2, 3.8]} castShadow>
        <boxGeometry args={[0.9, 0.6, 13.5]} />
        <meshStandardMaterial
          color={isFailed ? "#f43f5e" : hovered ? "#38bdf8" : "#94a3b8"}
          metalness={0.6}
        />
      </mesh>

      {/* Back-reach Counterweight Arm */}
      <mesh position={[0, 8.2, -3.8]} castShadow>
        <boxGeometry args={[0.9, 0.6, 4.5]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* 6. Dynamic Trolley & Spreader Holding Container */}
      <group ref={trolleyRef} position={[0, 7.7, 3.5]}>
        {/* Trolley Carriage */}
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.35, 1.1]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>
        {/* Hoist Steel Cables */}
        <mesh position={[-0.4, -1.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.4]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        <mesh position={[0.4, -1.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2.4]} />
          <meshBasicMaterial color="#94a3b8" />
        </mesh>
        {/* Spreader Frame */}
        <mesh position={[0, -2.4, 0]} castShadow>
          <boxGeometry args={[1.4, 0.25, 2.8]} />
          <meshStandardMaterial color="#eab308" metalness={0.4} />
        </mesh>
        {/* Container being lifted (if busy) */}
        {isBusy && !isFailed && (
          <mesh position={[0, -3.1, 0]} castShadow>
            <boxGeometry args={[1.2, 1.0, 2.6]} />
            <meshStandardMaterial color={statusColor} roughness={0.4} />
          </mesh>
        )}
      </group>

      {/* 7. Operational Status Beacon Light */}
      <pointLight position={[0, 11.5, -0.2]} color={statusColor} intensity={2.5} distance={15} />
      <mesh position={[0, 11.5, -0.2]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>

      {/* 8. STS Crane Label HUD */}
      <Html
        position={[0, 12.8, 0]}
        center
        distanceFactor={75}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div
          className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-mono font-bold shadow-2xl backdrop-blur-md transition-all select-none ${
            isSelected
              ? "bg-slate-900 border-2 border-white text-white ring-2 ring-cyan-400 scale-110"
              : hovered
              ? "bg-slate-900/95 border border-cyan-400 text-cyan-200"
              : "bg-slate-950/90 border border-slate-700/80 text-slate-200"
          }`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <span>{crane.crane_code}</span>
          {isFailed && (
            <span className="text-[8px] text-rose-400 font-bold uppercase">FAIL</span>
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
