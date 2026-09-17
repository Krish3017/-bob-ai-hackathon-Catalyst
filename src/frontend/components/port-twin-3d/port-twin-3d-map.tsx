"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  PORT_BERTHS,
  PORT_CRANES,
  PORT_YARDS,
  PORT_VESSELS,
  PORT_ROUTES,
  PORT_DISRUPTIONS,
  PORT_OPTIMIZATION_RECOMMENDATIONS,
  PORT_SCENARIO_PRESETS,
  PortTwinBerth,
  PortTwinCrane,
  PortTwinYard,
  PortTwinVessel,
  PortTwinAnchorage,
  PortTwinDisruption,
  PortTwinOptimizationRecommendation,
  PortTwinScenarioPreset,
} from "@/data/port-twin-data";

import { PortScene, PortSceneControlsHandle, LayerVisibility3D } from "./PortScene";
import { PortTwinOverlay } from "../port-twin/port-twin-overlay";
import { PortTwinPopup, InspectedObject } from "../port-twin/port-twin-popup";
import { PortTwinIntelligence, IntelligenceTab } from "../port-twin/port-twin-intelligence";
import { geoToWorld } from "./coords";
import { api } from "@/lib/api";

function interpolateRoutePosition(
  waypoints: [number, number][],
  progress: number
): { coords: [number, number]; heading: number } {
  if (!waypoints || waypoints.length === 0) return { coords: [103.75, 1.25], heading: 0 };
  if (waypoints.length === 1) return { coords: waypoints[0], heading: 0 };

  const distances: number[] = [];
  let totalDistance = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1][0] - waypoints[i][0];
    const dy = waypoints[i + 1][1] - waypoints[i][1];
    const dist = Math.hypot(dx, dy);
    distances.push(dist);
    totalDistance += dist;
  }

  const targetDist = Math.max(0, Math.min(1, progress)) * totalDistance;
  let accumulated = 0;

  for (let i = 0; i < distances.length; i++) {
    if (accumulated + distances[i] >= targetDist || i === distances.length - 1) {
      const segDist = distances[i];
      const segT = segDist > 0 ? (targetDist - accumulated) / segDist : 0;
      const lng = waypoints[i][0] + segT * (waypoints[i + 1][0] - waypoints[i][0]);
      const lat = waypoints[i][1] + segT * (waypoints[i + 1][1] - waypoints[i][1]);

      const dx = waypoints[i + 1][0] - waypoints[i][0];
      const dy = waypoints[i + 1][1] - waypoints[i][1];
      const rad = Math.atan2(dx, dy);
      let deg = (rad * 180) / Math.PI;
      if (deg < 0) deg += 360;

      return { coords: [lng, lat], heading: Math.round(deg) };
    }
    accumulated += distances[i];
  }

  return { coords: waypoints[waypoints.length - 1], heading: 0 };
}

export function PortTwin3DMap() {
  const sceneControlsRef = useRef<PortSceneControlsHandle>(null);

  // Inspection Selection State
  const [selectedObject, setSelectedObject] = useState<InspectedObject | null>(null);
  const [is25DPitch, setIs25DPitch] = useState(true);

  // Simulation State
  const [isPlaying, setIsPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 5>(1);
  const [vessels, setVessels] = useState<PortTwinVessel[]>(PORT_VESSELS);
  const [simSeconds, setSimSeconds] = useState(14 * 3600 + 30 * 60);

  // Dynamic Assets (Supports scenario failure injection)
  const [cranes, setCranes] = useState<PortTwinCrane[]>(PORT_CRANES);
  const [berths, setBerths] = useState<PortTwinBerth[]>(PORT_BERTHS);
  const [yards, setYards] = useState<PortTwinYard[]>(PORT_YARDS);
  const [disruptions, setDisruptions] = useState<PortTwinDisruption[]>(PORT_DISRUPTIONS);
  const [recommendations, setRecommendations] = useState<PortTwinOptimizationRecommendation[]>(
    PORT_OPTIMIZATION_RECOMMENDATIONS
  );

  // Scenario and Intelligence State
  const [intelligenceTab, setIntelligenceTab] = useState<IntelligenceTab>("disruptions");
  const [selectedDisruption, setSelectedDisruption] = useState<PortTwinDisruption | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] =
    useState<PortTwinOptimizationRecommendation | null>(null);
  const [showProposedPlan, setShowProposedPlan] = useState(true);
  const [activeScenario, setActiveScenario] = useState<PortTwinScenarioPreset | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationDeltas, setSimulationDeltas] = useState<{
    delay_hours: number;
    demurrage_usd: number;
    congestion_points: number;
  } | null>(null);

  // Layer Visibility
  const [layers, setLayers] = useState<LayerVisibility3D>({
    vessels: true,
    berths: true,
    cranes: true,
    yards: true,
    fairway: true,
    anchorages: true,
    routes: true,
    disruptions: true,
    proposedPlan: true,
  });

  const activeTransitCount = vessels.filter((v) => v.status === "Approaching").length;

  // Stats Telemetry
  const stats = {
    totalVessels: vessels.length,
    berthedVessels: vessels.filter((v) => v.status === "Berthed" || v.status === "Working").length,
    waitingVessels: vessels.filter((v) => v.status === "Anchored" || v.status === "Delayed").length,
    activeBerths: berths.filter((b) => b.status === "Occupied").length,
    totalBerths: berths.length,
    operationalCranes: cranes.filter((c) => c.status !== "Failed" && c.status !== "Maintenance").length,
    totalCranes: cranes.length,
    avgYardUtilization: Math.round(
      PORT_YARDS.reduce((acc, y) => acc + y.utilization_pct, 0) / PORT_YARDS.length
    ),
  };

  const formatSimClock = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600) % 24;
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = Math.floor(totalSec % 60);
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")} UTC`;
  };

  // Simulation Ticker Loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSimSeconds((prev) => prev + 1 * simSpeed);

      setVessels((prev) =>
        prev.map((v) => {
          if (!v.route_id) return v;
          const route = PORT_ROUTES.find((r) => r.id === v.route_id);
          if (!route) return v;

          const speedFactor = (v.speed_knots || 10) * 0.0003 * simSpeed;
          let nextProgress = (v.route_progress || 0) + speedFactor;
          if (nextProgress > 1.0) nextProgress = 0.0;

          const { coords, heading } = interpolateRoutePosition(route.waypoints, nextProgress);
          return {
            ...v,
            route_progress: nextProgress,
            coordinates: coords,
            heading_degrees: heading,
          };
        })
      );
    }, 60);

    return () => clearInterval(interval);
  }, [isPlaying, simSpeed]);

  // Object Selection Handlers
  const handleSelectBerth = useCallback((b: PortTwinBerth) => {
    setSelectedObject({ type: "berth", data: b });
    const worldPos = geoToWorld(b.coordinates, 0.4);
    sceneControlsRef.current?.flyTo(worldPos);
  }, []);

  const handleSelectCrane = useCallback((c: PortTwinCrane) => {
    setSelectedObject({ type: "crane", data: c });
    const worldPos = geoToWorld(c.coordinates, 0.4);
    sceneControlsRef.current?.flyTo(worldPos);
  }, []);

  const handleSelectYard = useCallback((y: PortTwinYard) => {
    setSelectedObject({ type: "yard", data: y });
    const worldPos = geoToWorld(y.coordinates, 0.4);
    sceneControlsRef.current?.flyTo(worldPos);
  }, []);

  const handleSelectVessel = useCallback((v: PortTwinVessel) => {
    setSelectedObject({ type: "vessel", data: v });
    const worldPos = geoToWorld(v.coordinates, 0.1);
    sceneControlsRef.current?.flyTo(worldPos);
  }, []);

  const handleSelectAnchorage = useCallback((anc: PortTwinAnchorage) => {
    setSelectedObject({ type: "anchorage", data: anc });
    const worldPos = geoToWorld(anc.coordinates, 0.05);
    sceneControlsRef.current?.flyTo(worldPos);
  }, []);

  const handleSelectDisruption = useCallback((d: PortTwinDisruption) => {
    setSelectedDisruption(d);
    setSelectedObject({ type: "disruption", data: d });
    const worldPos = geoToWorld(d.coordinates, 0.4);
    sceneControlsRef.current?.flyTo(worldPos);
  }, []);

  const handleSelectRecommendation = useCallback(
    (rec: PortTwinOptimizationRecommendation) => {
      setSelectedRecommendation(rec);
      setSelectedObject({ type: "recommendation", data: rec });
      const berth = berths.find((b) => b.berth_code === rec.proposed_berth_code);
      if (berth) {
        const worldPos = geoToWorld(berth.coordinates, 0.4);
        sceneControlsRef.current?.flyTo(worldPos);
      }
    },
    [berths]
  );

  // Scenario Activation Handlers
  const handleActivateScenario = useCallback(
    async (preset: PortTwinScenarioPreset) => {
      setActiveScenario(preset);
      setIsSimulating(true);

      try {
        const res = await api.simulateOptimization({
          scenario_name: preset.title,
          unavailable_crane_ids: preset.unavailable_crane_codes,
          unavailable_berth_ids: preset.unavailable_berth_codes,
          vessel_delay_hours: preset.vessel_delay_hours,
        });

        if (res && res.deltas) {
          setSimulationDeltas({
            delay_hours: res.deltas.waiting_time_delta_hours ?? preset.expected_delay_increase_hours,
            demurrage_usd: res.deltas.demurrage_delta_usd ?? preset.expected_demurrage_delta_usd,
            congestion_points: res.deltas.congestion_score_delta ?? preset.congestion_delta_points,
          });
        } else {
          throw new Error("No deltas");
        }
      } catch {
        setSimulationDeltas({
          delay_hours: preset.expected_delay_increase_hours,
          demurrage_usd: preset.expected_demurrage_delta_usd,
          congestion_points: preset.congestion_delta_points,
        });
      } finally {
        setIsSimulating(false);
      }

      // Apply crane failure state
      if (preset.unavailable_crane_codes.length > 0) {
        setCranes((prev) =>
          prev.map((c) =>
            preset.unavailable_crane_codes.includes(c.crane_code)
              ? { ...c, status: "Failed" }
              : c
          )
        );
        const targetCrane = cranes.find((c) => preset.unavailable_crane_codes.includes(c.crane_code));
        if (targetCrane) {
          const worldPos = geoToWorld(targetCrane.coordinates, 0.4);
          sceneControlsRef.current?.flyTo(worldPos);
        }
      }

      // Apply berth maintenance state
      if (preset.unavailable_berth_codes.length > 0) {
        setBerths((prev) =>
          prev.map((b) =>
            preset.unavailable_berth_codes.includes(b.berth_code)
              ? { ...b, status: "Maintenance" }
              : b
          )
        );
      }
    },
    [cranes]
  );

  const handleClearScenario = useCallback(() => {
    setActiveScenario(null);
    setSimulationDeltas(null);
    setCranes(PORT_CRANES);
    setBerths(PORT_BERTHS);
  }, []);

  const handleToggleLayer = useCallback((layerKey: keyof LayerVisibility3D) => {
    setLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  }, []);

  const handleResetSimulation = () => {
    setVessels(PORT_VESSELS);
    setSimSeconds(14 * 3600 + 30 * 60);
    handleClearScenario();
  };

  const handleTogglePitch = () => {
    const next = !is25DPitch;
    setIs25DPitch(next);
    sceneControlsRef.current?.togglePitch(next);
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* 1. CLEAN PORT DIGITAL TWIN MAP VIEWPORT */}
      <div className="relative w-full h-[640px] bg-[#dbeafe] overflow-hidden select-none rounded-2xl border border-slate-200 shadow-sm">
        {/* Three.js R3F Light GIS Scene */}
        <PortScene
          ref={sceneControlsRef}
          berths={berths}
          cranes={cranes}
          yards={yards}
          vessels={vessels}
          disruptions={disruptions}
          recommendations={recommendations}
          layers={layers}
          selectedBerthId={selectedObject?.type === "berth" ? selectedObject.data.id : null}
          selectedCraneId={selectedObject?.type === "crane" ? selectedObject.data.id : null}
          selectedYardId={selectedObject?.type === "yard" ? selectedObject.data.id : null}
          selectedVesselId={selectedObject?.type === "vessel" ? selectedObject.data.id : null}
          selectedDisruptionId={selectedDisruption?.id || null}
          selectedRecommendationId={selectedRecommendation?.id || null}
          onSelectBerth={handleSelectBerth}
          onSelectCrane={handleSelectCrane}
          onSelectYard={handleSelectYard}
          onSelectVessel={handleSelectVessel}
          onSelectAnchorage={handleSelectAnchorage}
          onSelectDisruption={handleSelectDisruption}
          onSelectRecommendation={handleSelectRecommendation}
          onPointerMissed={() => setSelectedObject(null)}
        />

        {/* COMPACT MAP OVERLAY HUD (Clean Light GIS Controls) */}
        <PortTwinOverlay
          layers={layers as any}
          onToggleLayer={handleToggleLayer as any}
          onZoomIn={() => sceneControlsRef.current?.zoomIn()}
          onZoomOut={() => sceneControlsRef.current?.zoomOut()}
          onResetView={() => sceneControlsRef.current?.resetCamera()}
          onTogglePitch={handleTogglePitch}
          is25DPitch={is25DPitch}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          simSpeed={simSpeed}
          onChangeSpeed={(s) => setSimSpeed(s)}
          onResetSimulation={handleResetSimulation}
          simClock={formatSimClock(simSeconds)}
          activeTransitCount={activeTransitCount}
          stats={stats}
        />

        {/* OBJECT INSPECTION DETAIL POPUP */}
        <PortTwinPopup
          selection={selectedObject}
          onClose={() => setSelectedObject(null)}
          onSelectObject={(obj) => setSelectedObject(obj)}
        />

        {/* Subtle Map Corner Datum Coordinate Tag */}
        <div className="absolute top-3 right-4 pointer-events-none hidden lg:flex items-center gap-2 rounded-md bg-white/95 border border-slate-200 px-2.5 py-1 text-[10px] font-mono text-slate-600 shadow-sm z-10 backdrop-blur-sm">
          <span className="text-blue-600 font-bold">GIS 2.5D</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700">LAT 01°15.3'N</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-700">LON 103°45.2'E</span>
        </div>
      </div>

      {/* 2. OPERATIONAL INTELLIGENCE & SCENARIO STUDIO (MOVED OUTSIDE & BELOW THE MAP) */}
      <PortTwinIntelligence
        activeTab={intelligenceTab}
        onChangeTab={(t) => setIntelligenceTab(t)}
        disruptions={disruptions}
        selectedDisruptionId={selectedDisruption?.id || null}
        onSelectDisruption={handleSelectDisruption}
        recommendations={recommendations}
        selectedRecommendationId={selectedRecommendation?.id || null}
        onSelectRecommendation={handleSelectRecommendation}
        showProposedPlan={showProposedPlan}
        onToggleProposedPlan={() => {
          const next = !showProposedPlan;
          setShowProposedPlan(next);
          handleToggleLayer("proposedPlan");
        }}
        scenarioPresets={PORT_SCENARIO_PRESETS}
        activeScenario={activeScenario}
        onActivateScenario={handleActivateScenario}
        onClearScenario={handleClearScenario}
        isSimulating={isSimulating}
        simulationDeltas={simulationDeltas}
      />
    </div>
  );
}
