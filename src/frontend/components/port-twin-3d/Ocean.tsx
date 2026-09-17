"use client";

import React, { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

export function Ocean() {
  const meshRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.GridHelper>(null);

  // Subtle wave shimmer using time in useFrame
  useFrame(({ clock }) => {
    if (meshRef.current && meshRef.current.material) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const t = clock.getElapsedTime();
      mat.roughness = 0.35 + Math.sin(t * 0.4) * 0.05;
    }
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* Primary Deep Navy Water Surface */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[700, 700, 32, 32]} />
        <meshStandardMaterial
          color="#071322"
          emissive="#040b14"
          emissiveIntensity={0.2}
          roughness={0.35}
          metalness={0.65}
        />
      </mesh>

      {/* Shallow Coastal Contour Shelf Under Port Quay */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 10]} receiveShadow>
        <planeGeometry args={[220, 120]} />
        <meshStandardMaterial
          color="#0a1d33"
          roughness={0.5}
          metalness={0.4}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Fairway Navigational Deep Dredged Channel (Draft 17.5m) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0.38]}
        position={[45, 0.02, 35]}
        receiveShadow
      >
        <planeGeometry args={[180, 48]} />
        <meshStandardMaterial
          color="#050e1a"
          roughness={0.3}
          metalness={0.7}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Nautical Tactical Grid Coordinate Reference */}
      <gridHelper
        ref={gridRef}
        args={[600, 60, "#122a46", "#0b1c30"]}
        position={[0, 0.03, 0]}
      />
    </group>
  );
}
