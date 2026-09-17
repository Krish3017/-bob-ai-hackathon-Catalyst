"use client";

import React, { useRef } from "react";
import * as THREE from "three";

export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={[0, -0.02, 0]}>
      {/* 1. Primary Pale Blue Nautical Water Surface */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial
          color="#dbeafe"
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>

      {/* 2. Coastal Harbor Shelf Basin Under Quay (Subtle soft tone) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 10]} receiveShadow>
        <planeGeometry args={[240, 130]} />
        <meshStandardMaterial
          color="#d0e3f7"
          roughness={0.7}
          metalness={0.05}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 3. Fairway Deep Dredged Navigational Channel (Draft 17.5m corridor) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0.38]}
        position={[45, 0.02, 35]}
        receiveShadow
      >
        <planeGeometry args={[200, 52]} />
        <meshStandardMaterial
          color="#c2ddf8"
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>

      {/* Fairway Channel Border Guidelines (Dashed channel limits) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0.38]}
        position={[25, 0.03, 50]}
      >
        <planeGeometry args={[190, 0.4]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0.38]}
        position={[65, 0.03, 20]}
      >
        <planeGeometry args={[190, 0.4]} />
        <meshBasicMaterial color="#93c5fd" />
      </mesh>

      {/* 4. Subtle Nautical Chart Grid Reference */}
      <gridHelper
        args={[600, 50, "#bfdbfe", "#cbd5e1"]}
        position={[0, 0.03, 0]}
      />
    </group>
  );
}
