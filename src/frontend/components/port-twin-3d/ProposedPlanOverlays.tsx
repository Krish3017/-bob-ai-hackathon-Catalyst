"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { PortTwinOptimizationRecommendation } from "@/data/port-twin-data";
import { geoToWorld } from "./coords";

interface ProposedPlanOverlaysProps {
  recommendations: PortTwinOptimizationRecommendation[];
  selectedRecommendationId?: string | null;
  onSelectRecommendation: (rec: PortTwinOptimizationRecommendation) => void;
  visible?: boolean;
}

export function ProposedPlanOverlays({
  recommendations,
  selectedRecommendationId,
  onSelectRecommendation,
  visible = true,
}: ProposedPlanOverlaysProps) {
  const arcs = useMemo(() => {
    return recommendations.map((rec) => {
      const [startLng, startLat] = rec.trajectory[0];
      const [endLng, endLat] = rec.trajectory[rec.trajectory.length - 1];

      const start = geoToWorld([startLng, startLat], 0.3);
      const end = geoToWorld([endLng, endLat], 0.5);

      const midX = (start[0] + end[0]) / 2;
      const midZ = (start[2] + end[2]) / 2;
      const dist = Math.hypot(end[0] - start[0], end[2] - start[2]);
      const arcHeight = Math.max(3.5, dist * 0.12);
      const mid = [midX, arcHeight, midZ];

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(...start),
        new THREE.Vector3(...mid),
        new THREE.Vector3(...end)
      );

      return {
        rec,
        curve,
        midpoint: mid as [number, number, number],
      };
    });
  }, [recommendations]);

  if (!visible) return null;

  return (
    <group>
      {arcs.map(({ rec, curve, midpoint }) => {
        const isSelected = selectedRecommendationId === rec.id;

        return (
          <group
            key={rec.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectRecommendation(rec);
            }}
          >
            {/* 1. Thin Luminous Assignment Curve */}
            <mesh>
              <tubeGeometry args={[curve, 48, isSelected ? 0.18 : 0.1, 8, false]} />
              <meshStandardMaterial
                color={isSelected ? "#0284c7" : "#0ea5e9"}
                roughness={0.3}
                transparent
                opacity={0.85}
              />
            </mesh>

            {/* Destination Target Ring on Berth */}
            <mesh
              position={geoToWorld(rec.trajectory[rec.trajectory.length - 1], 0.52)}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.8, 1.3, 16]} />
              <meshBasicMaterial color="#0284c7" transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>

            {/* 2. Compact White GIS Assignment Pill */}
            <Html
              position={midpoint}
              center
              distanceFactor={80}
              zIndexRange={[15, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                className={`flex items-center gap-1.5 rounded px-2 py-0.5 text-[9px] font-mono font-bold shadow-sm transition-all select-none whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 border-2 border-blue-500 text-white shadow-md scale-105"
                    : "bg-white/95 border border-sky-400 text-sky-900 hover:border-sky-600"
                }`}
              >
                <span className="text-blue-600">⚡ {rec.vessel_name}</span>
                <span className="text-slate-400">→</span>
                <span className="text-emerald-700 font-bold">{rec.proposed_berth_code}</span>
                <span className="text-[8px] text-emerald-700 bg-emerald-50 px-1 rounded border border-emerald-300">
                  +${(rec.demurrage_savings_usd / 1000).toFixed(1)}k
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
