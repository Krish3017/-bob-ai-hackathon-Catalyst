"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import {
  PORT_ROUTES,
  FAIRWAY_NAV_GEOJSON,
  PORT_ANCHORAGES,
  PortTwinAnchorage,
} from "@/data/port-twin-data";
import { geoToWorld } from "./coords";
import { Html } from "@react-three/drei";

interface NavigationRoutesProps {
  routesVisible?: boolean;
  fairwayVisible?: boolean;
  anchoragesVisible?: boolean;
  selectedAnchorageId?: string | null;
  onSelectAnchorage?: (anc: PortTwinAnchorage) => void;
}

export function NavigationRoutes({
  routesVisible = true,
  fairwayVisible = true,
  anchoragesVisible = true,
  selectedAnchorageId,
  onSelectAnchorage,
}: NavigationRoutesProps) {
  // Extract navigational buoys from FAIRWAY_NAV_GEOJSON
  const buoys = useMemo(() => {
    return FAIRWAY_NAV_GEOJSON.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => {
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        return {
          id: f.properties?.buoy_id || "NB",
          name: f.properties?.name || "Navigational Buoy",
          color: f.properties?.color || "#10b981",
          position: geoToWorld(coords, 0.4),
        };
      });
  }, []);

  // Build 3D curves for active navigation routes
  const routeGeometries = useMemo(() => {
    return PORT_ROUTES.map((route) => {
      const points = route.waypoints.map((wp) => {
        const [x, , z] = geoToWorld(wp, 0.25);
        return new THREE.Vector3(x, 0.25, z);
      });
      const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.15);
      return {
        id: route.id,
        color: route.color,
        name: route.name,
        curve,
      };
    });
  }, []);

  return (
    <group>
      {/* 1. Fairway Navigational Buoys */}
      {fairwayVisible && (
        <group>
          {buoys.map((buoy) => (
            <group key={buoy.id} position={buoy.position}>
              {/* Buoy Flotation Drum */}
              <mesh castShadow>
                <cylinderGeometry args={[0.5, 0.6, 0.8, 8]} />
                <meshStandardMaterial color={buoy.color} metalness={0.4} roughness={0.5} />
              </mesh>
              {/* Buoy Top Tower Mast */}
              <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.06, 0.08, 0.9, 6]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
              {/* Flashing Nav Light */}
              <mesh position={[0, 1.3, 0]}>
                <sphereGeometry args={[0.16, 8, 8]} />
                <meshBasicMaterial color={buoy.color} />
              </mesh>
              <pointLight position={[0, 1.4, 0]} color={buoy.color} intensity={2} distance={15} />

              {/* Buoy Tag */}
              <Html
                position={[0, 2.2, 0]}
                center
                distanceFactor={70}
                zIndexRange={[10, 0]}
                style={{ pointerEvents: "none" }}
              >
                <div className="rounded bg-slate-900/90 px-1 py-0.5 text-[8px] font-mono font-bold text-slate-300 border border-slate-700/60 shadow">
                  {buoy.id}
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 2. Navigation Routes Spline Ribbons */}
      {routesVisible && (
        <group>
          {routeGeometries.map((r) => (
            <mesh key={r.id}>
              <tubeGeometry args={[r.curve, 64, 0.18, 6, false]} />
              <meshStandardMaterial
                color={r.color}
                emissive={r.color}
                emissiveIntensity={0.6}
                transparent
                opacity={0.75}
                roughness={0.2}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 3. Anchorage Zones Water Decals */}
      {anchoragesVisible && (
        <group>
          {PORT_ANCHORAGES.map((anc) => {
            const isSelected = selectedAnchorageId === anc.id;
            const [cx, , cz] = geoToWorld(anc.coordinates, 0.05);

            const shape = new THREE.Shape();
            anc.polygon.forEach((pt, idx) => {
              const [x, , z] = geoToWorld(pt);
              if (idx === 0) shape.moveTo(x, z);
              else shape.lineTo(x, z);
            });

            return (
              <group
                key={anc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAnchorage?.(anc);
                }}
              >
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
                  <shapeGeometry args={[shape]} />
                  <meshStandardMaterial
                    color="#14b8a6"
                    transparent
                    opacity={isSelected ? 0.35 : 0.15}
                    roughness={0.5}
                  />
                </mesh>

                <Html
                  position={[cx, 1.5, cz]}
                  center
                  distanceFactor={85}
                  zIndexRange={[10, 0]}
                  style={{ pointerEvents: "none" }}
                >
                  <div className="flex items-center gap-1 rounded bg-slate-900/85 px-1.5 py-0.5 text-[9px] font-mono text-teal-300 border border-teal-500/40 shadow backdrop-blur-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                    <span>{anc.zone_name}</span>
                  </div>
                </Html>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
}
