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
  // Extract navigational buoys
  const buoys = useMemo(() => {
    return FAIRWAY_NAV_GEOJSON.features
      .filter((f) => f.geometry.type === "Point")
      .map((f) => {
        const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
        return {
          id: f.properties?.buoy_id || "NB",
          name: f.properties?.name || "Navigational Buoy",
          color: f.properties?.color || "#10b981",
          position: geoToWorld(coords, 0.2),
        };
      });
  }, []);

  // Build 3D curves for active navigation routes
  const routeGeometries = useMemo(() => {
    return PORT_ROUTES.map((route) => {
      const points = route.waypoints.map((wp) => {
        const [x, , z] = geoToWorld(wp, 0.12);
        return new THREE.Vector3(x, 0.12, z);
      });
      const curve = new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.15);
      return {
        id: route.id,
        color: route.color === "#38bdf8" ? "#2563eb" : route.color,
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
              <mesh>
                <cylinderGeometry args={[0.35, 0.45, 0.55, 8]} />
                <meshStandardMaterial color={buoy.color} roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[0.04, 0.05, 0.5, 6]} />
                <meshStandardMaterial color="#475569" />
              </mesh>
              <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshBasicMaterial color={buoy.color} />
              </mesh>

              <Html
                position={[0, 1.4, 0]}
                center
                distanceFactor={75}
                zIndexRange={[10, 0]}
                style={{ pointerEvents: "none" }}
              >
                <div className="rounded bg-white/95 px-1 py-0.2 text-[8px] font-mono font-bold text-slate-700 border border-slate-300 shadow-sm">
                  {buoy.id}
                </div>
              </Html>
            </group>
          ))}
        </group>
      )}

      {/* 2. Navigation Routes Spline Lines */}
      {routesVisible && (
        <group>
          {routeGeometries.map((r) => (
            <mesh key={r.id}>
              <tubeGeometry args={[r.curve, 64, 0.12, 6, false]} />
              <meshStandardMaterial
                color={r.color}
                roughness={0.3}
                transparent
                opacity={0.85}
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
            const [cx, , cz] = geoToWorld(anc.coordinates, 0.02);

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
                  if ((e as any).delta > 4) return;
                  onSelectAnchorage?.(anc);
                }}
              >
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                  <shapeGeometry args={[shape]} />
                  <meshStandardMaterial
                    color="#0d9488"
                    transparent
                    opacity={isSelected ? 0.3 : 0.12}
                    roughness={0.6}
                  />
                </mesh>

                <Html
                  position={[cx, 0.8, cz]}
                  center
                  distanceFactor={85}
                  zIndexRange={[10, 0]}
                  style={{ pointerEvents: "none" }}
                >
                  <div className="flex items-center gap-1 rounded bg-white/95 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-teal-800 border border-teal-300 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
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
