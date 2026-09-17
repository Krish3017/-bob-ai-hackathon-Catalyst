"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";

import { Ocean } from "./Ocean";
import { PortLandmass } from "./PortLandmass";
import { Berths } from "./Berths";
import { ContainerYards } from "./ContainerYards";
import { STSCranes } from "./STSCranes";
import { Vessels } from "./Vessels";
import { NavigationRoutes } from "./NavigationRoutes";
import { DisruptionOverlays } from "./DisruptionOverlays";
import { ProposedPlanOverlays } from "./ProposedPlanOverlays";

import {
  PortTwinBerth,
  PortTwinCrane,
  PortTwinYard,
  PortTwinVessel,
  PortTwinAnchorage,
  PortTwinDisruption,
  PortTwinOptimizationRecommendation,
} from "@/data/port-twin-data";

export interface PortSceneControlsHandle {
  resetCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  togglePitch: (is25D: boolean) => void;
  flyTo: (coords: [number, number, number]) => void;
}

export interface LayerVisibility3D {
  vessels: boolean;
  berths: boolean;
  cranes: boolean;
  yards: boolean;
  fairway: boolean;
  anchorages: boolean;
  routes: boolean;
  disruptions: boolean;
  proposedPlan: boolean;
}

interface PortSceneProps {
  berths: PortTwinBerth[];
  cranes: PortTwinCrane[];
  yards: PortTwinYard[];
  vessels: PortTwinVessel[];
  disruptions: PortTwinDisruption[];
  recommendations: PortTwinOptimizationRecommendation[];
  layers: LayerVisibility3D;

  selectedBerthId?: string | null;
  selectedCraneId?: string | null;
  selectedYardId?: string | null;
  selectedVesselId?: string | null;
  selectedDisruptionId?: string | null;
  selectedRecommendationId?: string | null;

  onSelectBerth: (berth: PortTwinBerth) => void;
  onSelectCrane: (crane: PortTwinCrane) => void;
  onSelectYard: (yard: PortTwinYard) => void;
  onSelectVessel: (vessel: PortTwinVessel) => void;
  onSelectAnchorage?: (anc: PortTwinAnchorage) => void;
  onSelectDisruption: (d: PortTwinDisruption) => void;
  onSelectRecommendation: (rec: PortTwinOptimizationRecommendation) => void;
  onPointerMissed?: () => void;
}

export const PortScene = forwardRef<PortSceneControlsHandle, PortSceneProps>(
  function PortScene(
    {
      berths,
      cranes,
      yards,
      vessels,
      disruptions,
      recommendations,
      layers,
      selectedBerthId,
      selectedCraneId,
      selectedYardId,
      selectedVesselId,
      selectedDisruptionId,
      selectedRecommendationId,
      onSelectBerth,
      onSelectCrane,
      onSelectYard,
      onSelectVessel,
      onSelectAnchorage,
      onSelectDisruption,
      onSelectRecommendation,
      onPointerMissed,
    },
    ref
  ) {
    const controlsRef = useRef<OrbitControlsImpl>(null);

    // Expose camera controls to outer HUD
    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 2, 0);
          controlsRef.current.object.position.set(0, 75, 115);
          controlsRef.current.update();
        }
      },
      zoomIn: () => {
        if (controlsRef.current) {
          const cam = controlsRef.current.object;
          cam.position.multiplyScalar(0.85);
          controlsRef.current.update();
        }
      },
      zoomOut: () => {
        if (controlsRef.current) {
          const cam = controlsRef.current.object;
          cam.position.multiplyScalar(1.15);
          controlsRef.current.update();
        }
      },
      togglePitch: (is25D: boolean) => {
        if (controlsRef.current) {
          const cam = controlsRef.current.object;
          if (is25D) {
            // Isometric 2.5D angle
            cam.position.set(0, 75, 115);
          } else {
            // Top-down overhead tactical map
            cam.position.set(0, 140, 5);
          }
          controlsRef.current.target.set(0, 2, 0);
          controlsRef.current.update();
        }
      },
      flyTo: ([x, y, z]: [number, number, number]) => {
        if (controlsRef.current) {
          controlsRef.current.target.set(x, y, z);
          controlsRef.current.object.position.set(x, y + 45, z + 65);
          controlsRef.current.update();
        }
      },
    }));

    return (
      <div className="w-full h-full relative bg-[#040911]">
        <Canvas
          shadows
          camera={{
            position: [0, 75, 115],
            fov: 42,
            near: 1,
            far: 1200,
          }}
          onPointerMissed={() => onPointerMissed?.()}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15,
          }}
        >
          {/* Atmospheric Environmental Lighting */}
          <ambientLight color="#1a2b42" intensity={1.1} />
          
          <hemisphereLight
            color="#38bdf8"
            groundColor="#061220"
            intensity={0.85}
          />

          {/* Elevated Sun/Moon Key Light */}
          <directionalLight
            position={[100, 140, 90]}
            intensity={2.2}
            color="#f1f5f9"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={10}
            shadow-camera-far={400}
            shadow-camera-left={-120}
            shadow-camera-right={120}
            shadow-camera-top={120}
            shadow-camera-bottom={-120}
            shadow-bias={-0.0005}
          />

          {/* Quayside High-Mast Operations Floodlight */}
          <spotLight
            position={[0, 45, -5]}
            target-position={[0, 2, 10]}
            color="#e0f2fe"
            intensity={3.0}
            angle={0.7}
            penumbra={0.6}
            distance={160}
          />

          {/* 3D Scene Components */}
          <Ocean />

          <PortLandmass />

          <Berths
            berths={berths}
            selectedBerthId={selectedBerthId}
            onSelectBerth={onSelectBerth}
            visible={layers.berths}
          />

          <ContainerYards
            yards={yards}
            selectedYardId={selectedYardId}
            onSelectYard={onSelectYard}
            visible={layers.yards}
          />

          <STSCranes
            cranes={cranes}
            selectedCraneId={selectedCraneId}
            onSelectCrane={onSelectCrane}
            visible={layers.cranes}
          />

          <Vessels
            vessels={vessels}
            selectedVesselId={selectedVesselId}
            onSelectVessel={onSelectVessel}
            visible={layers.vessels}
          />

          <NavigationRoutes
            routesVisible={layers.routes}
            fairwayVisible={layers.fairway}
            anchoragesVisible={layers.anchorages}
            onSelectAnchorage={onSelectAnchorage}
          />

          <DisruptionOverlays
            disruptions={disruptions}
            selectedDisruptionId={selectedDisruptionId}
            onSelectDisruption={onSelectDisruption}
            visible={layers.disruptions}
          />

          <ProposedPlanOverlays
            recommendations={recommendations}
            selectedRecommendationId={selectedRecommendationId}
            onSelectRecommendation={onSelectRecommendation}
            visible={layers.proposedPlan}
          />

          {/* Interactive Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            target={[0, 2, 0]}
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={Math.PI / 2.08}
            minPolarAngle={0.1}
            minDistance={12}
            maxDistance={350}
            panSpeed={1.0}
            rotateSpeed={0.8}
            zoomSpeed={1.1}
          />
        </Canvas>
      </div>
    );
  }
);
