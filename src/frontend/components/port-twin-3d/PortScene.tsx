"use client";

import React, { useRef, forwardRef, useImperativeHandle } from "react";
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

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        if (controlsRef.current) {
          controlsRef.current.target.set(2, 0, 5);
          controlsRef.current.object.position.set(0, 85, 80);
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
            cam.position.set(0, 85, 80);
          } else {
            cam.position.set(2, 140, 6);
          }
          controlsRef.current.target.set(2, 0, 5);
          controlsRef.current.update();
        }
      },
      flyTo: ([x, y, z]: [number, number, number]) => {
        if (controlsRef.current) {
          controlsRef.current.target.set(x, y, z);
          controlsRef.current.object.position.set(x, y + 38, z + 48);
          controlsRef.current.update();
        }
      },
    }));

    return (
      <div className="w-full h-full relative bg-[#dbeafe]">
        <Canvas
          shadows
          camera={{
            position: [0, 85, 80],
            fov: 38,
            near: 1,
            far: 1400,
          }}
          onPointerMissed={() => onPointerMissed?.()}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.05,
          }}
        >
          {/* Bright Daytime Environmental GIS Lighting */}
          <ambientLight color="#f8fafc" intensity={1.35} />
          
          <hemisphereLight
            color="#bae6fd"
            groundColor="#e2e8f0"
            intensity={0.9}
          />

          {/* Elevated Sun Key Light */}
          <directionalLight
            position={[80, 130, 70]}
            intensity={2.3}
            color="#ffffff"
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-near={10}
            shadow-camera-far={350}
            shadow-camera-left={-110}
            shadow-camera-right={110}
            shadow-camera-top={110}
            shadow-camera-bottom={-110}
            shadow-bias={-0.0003}
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

          {/* Clean Interactive Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            target={[2, 0, 5]}
            enableDamping
            dampingFactor={0.08}
            maxPolarAngle={Math.PI / 2.15}
            minPolarAngle={0.08}
            minDistance={10}
            maxDistance={320}
            panSpeed={0.9}
            rotateSpeed={0.7}
            zoomSpeed={1.0}
          />
        </Canvas>
      </div>
    );
  }
);
