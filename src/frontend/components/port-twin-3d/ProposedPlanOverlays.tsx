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
  // Generate 3D parabolic parabolic flight arc curves
  const arcs = useMemo(() => {
    return recommendations.map((rec) => {
      const [startLng, startLat] = rec.trajectory[0];
      const [endLng, endLat] = rec.trajectory[rec.trajectory.length - 1];

      const start = geoToWorld([startLng, startLat], 1.2);
      const end = geoToWorld([endLng, endLat], 2.8);

      const midX = (start[0] + end[0]) / 2;
      const midZ = (start[2] + end[2]) / 2;
      const dist = Math.hypot(end[0] - start[0], end[2] - start[2]);
      const arcHeight = Math.max(8, dist * 0.22);
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
            {/* 1. Luminous 3D Assignment Vector Arc Tube */}
            <mesh>
              <tubeGeometry args={[curve, 48, isSelected ? 0.35 : 0.22, 8, false]} />
              <meshStandardMaterial
                color={isSelected ? "#00f2fe" : "#38bdf8"}
                emissive="#0284c7"
                emissiveIntensity={0.8}
                transparent
                opacity={0.85}
                roughness={0.2}
              />
            </mesh>

            {/* 2. Destination Anchor Mooring Arrow Ring */}
            <mesh
              position={geoToWorld(rec.trajectory[rec.trajectory.length - 1], 2.8)}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[1.2, 2.0, 16]} />
              <meshBasicMaterial color="#00f2fe" transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>

            {/* 3. Floating Optimization Benefit Pill Badge */}
            <Html
              position={midpoint}
              center
              distanceFactor={80}
              zIndexRange={[15, 0]}
              style={{ pointerEvents: "none" }}
            >
              <div
                className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-bold shadow-2xl backdrop-blur-md transition-all select-none whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-cyan-950 border-2 border-white text-white ring-2 ring-cyan-400 scale-110"
                    : "bg-slate-900/95 border border-cyan-500/80 text-cyan-200 hover:border-cyan-400"
                }`}
              >
                <span className="text-cyan-400">⚡ {rec.vessel_name}</span>
                <span className="text-slate-400">→</span>
                <span className="text-emerald-300 font-bold">{rec.proposed_berth_code}</span>
                <span className="text-[9px] text-emerald-400 bg-emerald-950/80 px-1 rounded border border-emerald-500/30">
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
