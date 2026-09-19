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
import { HoveredAsset } from "../port-twin/port-twin-tooltip";

export interface PortSceneControlsHandle {
  resetCamera: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  togglePitch: (is25D: boolean) => void;
  flyTo: (coords: [number, number, number]) => void;
  panUp: () => void;
  panDown: () => void;
  panLeft: () => void;
  panRight: () => void;
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
  onHoverAsset?: (asset: HoveredAsset | null) => void;
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
      onHoverAsset,
    },
    ref
  ) {
    const controlsRef = useRef<OrbitControlsImpl>(null);

    const panDirection = (dir: "up" | "down" | "left" | "right") => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const cam = controls.object;
      const target = controls.target;

      // Camera view direction projected on the horizontal XZ plane
      const forward = new THREE.Vector3().subVectors(target, cam.position);
      forward.y = 0;
      if (forward.lengthSq() < 0.0001) {
        forward.set(0, 0, -1);
      } else {
        forward.normalize();
      }

      // Camera right vector = forward x (0, 1, 0)
      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const PAN_STEP = 12;
      const moveVec = new THREE.Vector3();

      if (dir === "up") {
        moveVec.addScaledVector(forward, PAN_STEP);
      } else if (dir === "down") {
        moveVec.addScaledVector(forward, -PAN_STEP);
      } else if (dir === "left") {
        moveVec.addScaledVector(right, -PAN_STEP);
      } else if (dir === "right") {
        moveVec.addScaledVector(right, PAN_STEP);
      }

      // Constrain target within port operational zone [-85, 85]
      const newTargetX = Math.max(-85, Math.min(85, target.x + moveVec.x));
      const newTargetZ = Math.max(-85, Math.min(85, target.z + moveVec.z));
      const actualDx = newTargetX - target.x;
      const actualDz = newTargetZ - target.z;

      target.x = newTargetX;
      target.z = newTargetZ;
      cam.position.x += actualDx;
      cam.position.z += actualDz;
      controls.update();
    };

    const zoom = (factor: number) => {
      if (!controlsRef.current) return;
      const controls = controlsRef.current;
      const cam = controls.object;
      const target = controls.target;

      const offset = new THREE.Vector3().subVectors(cam.position, target);
      const currentDist = offset.length();
      const newDist = Math.max(15, Math.min(260, currentDist * factor));
      offset.setLength(newDist);

      cam.position.copy(target).add(offset);
      controls.update();
    };

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        if (controlsRef.current) {
          controlsRef.current.target.set(2, 0, 5);
          controlsRef.current.object.position.set(0, 85, 80);
          controlsRef.current.update();
        }
      },
      zoomIn: () => zoom(0.82),
      zoomOut: () => zoom(1.22),
      panUp: () => panDirection("up"),
      panDown: () => panDirection("down"),
      panLeft: () => panDirection("left"),
      panRight: () => panDirection("right"),
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

    // Keyboard Arrow Key panning listener
    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) {
          return;
        }

        if (e.key === "ArrowUp") {
          e.preventDefault();
          panDirection("up");
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          panDirection("down");
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          panDirection("left");
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          panDirection("right");
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
      <div className="w-full h-full relative bg-[#dbeafe] cursor-grab active:cursor-grabbing select-none">
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
            onHoverBerth={(b, x, y) =>
              onHoverAsset?.(b && x !== undefined && y !== undefined ? { type: "berth", data: b, x, y } : null)
            }
            visible={layers.berths}
          />

          <ContainerYards
            yards={yards}
            selectedYardId={selectedYardId}
            onSelectYard={onSelectYard}
            onHoverYard={(y, x, ym) =>
              onHoverAsset?.(y && x !== undefined && ym !== undefined ? { type: "yard", data: y, x, y: ym } : null)
            }
            visible={layers.yards}
          />

          <STSCranes
            cranes={cranes}
            selectedCraneId={selectedCraneId}
            onSelectCrane={onSelectCrane}
            onHoverCrane={(c, x, y) =>
              onHoverAsset?.(c && x !== undefined && y !== undefined ? { type: "crane", data: c, x, y } : null)
            }
            visible={layers.cranes}
          />

          <Vessels
            vessels={vessels}
            berths={berths}
            selectedVesselId={selectedVesselId}
            onSelectVessel={onSelectVessel}
            onHoverVessel={(v, x, y) =>
              onHoverAsset?.(v && x !== undefined && y !== undefined ? { type: "vessel", data: v, x, y } : null)
            }
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

          {/* Clean Interactive Map Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            target={[2, 0, 5]}
            enableDamping
            dampingFactor={0.08}
            screenSpacePanning={false}
            mouseButtons={{
              LEFT: THREE.MOUSE.PAN,
              MIDDLE: THREE.MOUSE.DOLLY,
              RIGHT: THREE.MOUSE.ROTATE,
            }}
            touches={{
              ONE: THREE.TOUCH.PAN,
              TWO: THREE.TOUCH.DOLLY_PAN,
            }}
            enableRotate={true}
            rotateSpeed={0.8}
            maxPolarAngle={Math.PI / 2.05}
            minPolarAngle={0.05}
            minDistance={12}
            maxDistance={280}
            panSpeed={1.0}
            zoomSpeed={1.0}
          />
        </Canvas>
      </div>
    );
  }
);
