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
      // In Three.js Shape: X corresponds to 3D X, Y in Shape corresponds to 3D Z
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
      {/* 1. Terminal Island Extruded Landmass (Quay Wall Elevation ~2.4m) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 2.4, 0]}
        receiveShadow
        castShadow
      >
        <extrudeGeometry
          args={[
            landmassShape,
            {
              depth: 2.4,
              bevelEnabled: true,
              bevelSegments: 2,
              steps: 1,
              bevelSize: 0.3,
              bevelThickness: 0.2,
            },
          ]}
        />
        <meshStandardMaterial
          color="#131b26"
          roughness={0.85}
          metalness={0.15}
        />
      </mesh>

      {/* 2. Dark Granite Revetment Sub-base / Breakwater Slope */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.4, 0]}
        receiveShadow
      >
        <extrudeGeometry
          args={[
            landmassShape,
            {
              depth: 0.6,
              bevelEnabled: true,
              bevelSize: 1.8,
              bevelThickness: 0.4,
            },
          ]}
        />
        <meshStandardMaterial
          color="#0d141e"
          roughness={0.95}
          metalness={0.05}
        />
      </mesh>

      {/* 3. Reinforced Concrete Quayside Apron (Heavy Operations Deck) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 2.44, 0]}
        receiveShadow
      >
        <shapeGeometry args={[apronShape]} />
        <meshStandardMaterial
          color="#1c2738"
          roughness={0.7}
          metalness={0.25}
        />
      </mesh>

      {/* 4. Quayside Edge Safety Line (High-visibility warning strip) */}
      <mesh
        rotation={[-Math.PI / 2, 0, -0.34]}
        position={[0.5, 2.46, 2.5]}
      >
        <planeGeometry args={[95, 0.4]} />
        <meshBasicMaterial color="#f59e0b" opacity={0.8} transparent />
      </mesh>

      {/* 5. Crane Rail Guideway (Seaside Rail) */}
      <mesh
        rotation={[-Math.PI / 2, 0, -0.34]}
        position={[0.3, 2.47, 1.2]}
      >
        <planeGeometry args={[94, 0.25]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 6. Crane Rail Guideway (Landside Rail) */}
      <mesh
        rotation={[-Math.PI / 2, 0, -0.34]}
        position={[0.3, 2.47, -2.8]}
      >
        <planeGeometry args={[94, 0.25]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* 7. East Breakwater Jetty Structure */}
      <group position={[70, 1.2, 10]} rotation={[0, -0.4, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[45, 2.4, 5]} />
          <meshStandardMaterial color="#172230" roughness={0.9} />
        </mesh>
        {/* Navigation Beacon Pillar at Breakwater Head */}
        <mesh position={[21, 2.5, 0]}>
          <cylinderGeometry args={[0.8, 1.2, 3, 12]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
        </mesh>
        <pointLight position={[21, 4.5, 0]} color="#10b981" intensity={3} distance={25} />
      </group>

      {/* 8. West Breakwater Jetty Structure */}
      <group position={[-50, 1.2, 16]} rotation={[0, 0.35, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[35, 2.4, 4.5]} />
          <meshStandardMaterial color="#172230" roughness={0.9} />
        </mesh>
        {/* Navigation Beacon Pillar at Breakwater Head */}
        <mesh position={[-16, 2.5, 0]}>
          <cylinderGeometry args={[0.8, 1.2, 3, 12]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
        </mesh>
        <pointLight position={[-16, 4.5, 0]} color="#ef4444" intensity={3} distance={25} />
      </group>
    </group>
  );
}
