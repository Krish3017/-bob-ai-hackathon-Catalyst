"use client";

import React, { useRef } from "react";
import * as THREE from "three";

export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={[0, -0.02, 0]}>
      {/* 1. Primary Light Theme Nautical Water Surface (Clean distinguishable water) */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1400, 1400]} />
        <meshStandardMaterial
          color="#b8d5f2"
          roughness={0.65}
          metalness={0.08}
        />
      </mesh>

      {/* 2. Coastal Harbor Basin Under Quay (Subtle depth shelf) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 12]} receiveShadow>
        <planeGeometry args={[260, 140]} />
        <meshStandardMaterial
          color="#a8caed"
          roughness={0.7}
          metalness={0.05}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* 3. Fairway Deep Dredged Navigational Channel (Draft 17.5m corridor) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0.38]}
        position={[45, 0.02, 35]}
        receiveShadow
      >
        <planeGeometry args={[240, 56]} />
        <meshStandardMaterial
          color="#9ec2e8"
          roughness={0.6}
          metalness={0.05}
        />
      </mesh>

      {/* Fairway Channel Border Guidelines (Dashed channel limits) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0.38]}
        position={[25, 0.03, 50]}
      >
        <planeGeometry args={[230, 0.35]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0.38]}
        position={[65, 0.03, 20]}
      >
        <planeGeometry args={[230, 0.35]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
      </mesh>

      {/* 4. Subtle Nautical Hydrographic Chart Grid Reference */}
      <gridHelper
        args={[800, 60, "#93c5fd", "#cbd5e1"]}
        position={[0, 0.03, 0]}
      />
    </group>
  );
}
