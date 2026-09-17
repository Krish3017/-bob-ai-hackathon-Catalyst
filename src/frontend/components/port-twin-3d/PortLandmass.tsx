"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { TERMINAL_LANDMASS_GEOJSON, QUAYSIDE_APRON_GEOJSON } from "@/data/port-twin-data";
import { geoToWorld } from "./coords";

export function PortLandmass() {
  // Build 2D shape for the main reclaimed terminal island
  const landmassShape = useMemo(() => {
    const coords = (TERMINAL_LANDMASS_GEOJSON.features[0].geometry as GeoJSON.Polygon).coordinates[0];
    const shape = new THREE.Shape();
    
    coords.forEach((pt, i) => {
      const [x, , z] = geoToWorld(pt as [number, number]);
      if (i === 0) {
        shape.moveTo(x, z);
      } else {
        shape.lineTo(x, z);
      }
    });
    return shape;
  }, []);

  // Build quayside concrete apron corridor shape
  const apronShape = useMemo(() => {
    const coords = (QUAYSIDE_APRON_GEOJSON.features[0].geometry as GeoJSON.Polygon).coordinates[0];
    const shape = new THREE.Shape();
    coords.forEach((pt, i) => {
      const [x, , z] = geoToWorld(pt as [number, number]);
      if (i === 0) {
        shape.moveTo(x, z);
      } else {
        shape.lineTo(x, z);
      }
    });
    return shape;
  }, []);

  return (
    <group>
      {/* 1. Terminal Landmass Flat Surface (Warm off-white / light slate GIS land plane, height 0.35m) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.35, 0]}
        receiveShadow
      >
        <extrudeGeometry
          args={[
            landmassShape,
            {
              depth: 0.35,
              bevelEnabled: false,
              steps: 1,
            },
          ]}
        />
        <meshStandardMaterial
          color="#f8fafc"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle Quay Wall Sea Edge Trim (Crisp boundary line against water) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
      >
        <extrudeGeometry
          args={[
            landmassShape,
            {
              depth: 0.38,
              bevelEnabled: true,
              bevelSize: 0.4,
              bevelThickness: 0.05,
            },
          ]}
        />
        <meshStandardMaterial
          color="#94a3b8"
          roughness={0.8}
        />
      </mesh>

      {/* 2. Reinforced Concrete Quayside Apron Corridor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.36, 0]}
        receiveShadow
      >
        <shapeGeometry args={[apronShape]} />
        <meshStandardMaterial
          color="#e2e8f0"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* 3. Quayside Edge Demarcation Line */}
      <mesh
        rotation={[-Math.PI / 2, 0, -0.34]}
        position={[0.5, 0.37, 2.5]}
      >
        <planeGeometry args={[95, 0.3]} />
        <meshBasicMaterial color="#64748b" />
      </mesh>

      {/* 4. STS Crane Rail Guideways along Quayside */}
      <mesh
        rotation={[-Math.PI / 2, 0, -0.34]}
        position={[0.3, 0.38, 1.2]}
      >
        <planeGeometry args={[94, 0.18]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, -0.34]}
        position={[0.3, 0.38, -2.8]}
      >
        <planeGeometry args={[94, 0.18]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* 5. Terminal Internal Logistics Access Roads & Truck Corridors */}
      <mesh
        rotation={[-Math.PI / 2, 0, -0.34]}
        position={[0.3, 0.37, -6.5]}
      >
        <planeGeometry args={[96, 2.5]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
      </mesh>
      {/* Central Perimeter Spine Road */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0.4]}
        position={[5, 0.37, -22]}
      >
        <planeGeometry args={[65, 3.2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.9} />
      </mesh>

      {/* 6. East Breakwater Structure */}
      <group position={[70, 0.25, 10]} rotation={[0, -0.4, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[45, 0.5, 4]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>
        {/* Entrance Light Beacon */}
        <mesh position={[21, 0.75, 0]}>
          <cylinderGeometry args={[0.5, 0.6, 1.5, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[21, 1.6, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#10b981" />
        </mesh>
      </group>

      {/* 7. West Breakwater Structure */}
      <group position={[-50, 0.25, 16]} rotation={[0, 0.35, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[35, 0.5, 4]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.8} />
        </mesh>
        {/* Entrance Light Beacon */}
        <mesh position={[-16, 0.75, 0]}>
          <cylinderGeometry args={[0.5, 0.6, 1.5, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.4} />
        </mesh>
        <mesh position={[-16, 1.6, 0]}>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  );
}
