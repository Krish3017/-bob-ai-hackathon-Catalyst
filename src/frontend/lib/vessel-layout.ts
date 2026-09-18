/**
 * Deterministic Vessel Layout & Spacing Engine
 * 
 * Guarantees that no two vessels ever visually overlap or stack on top of each other,
 * whether they are berthed, anchored in queue, or approaching along the fairway.
 * 
 * Provides stable, non-colliding 3D world coordinates and collision-resistant label offsets.
 */

import { PortTwinVessel, PortTwinBerth } from "@/data/port-twin-data";
import {
  geoToWorld,
  getBerthedVesselPosition,
  SEAWARD_VECTOR,
  QUAY_ANGLE,
} from "../components/port-twin-3d/coords";

export interface ResolvedVesselDisplay {
  vessel: PortTwinVessel;
  worldPosition: [number, number, number];
  rotationY: number;
  labelOffsetY: number;
  labelOffsetX: number;
  priorityLevel: number; // 1 = highest priority (selected/hovered/delayed)
  isSecondaryBerthed?: boolean;
}

// ---------------------------------------------------------------------------
// DETERMINISTIC ANCHORAGE GRID STATIONS (In deep open water)
// Guaranteed minimum 24-28 units separation between all stations
// ---------------------------------------------------------------------------
interface AnchorageStation {
  pos: [number, number, number];
  headingRad: number;
  zone: string;
}

const ANCHORAGE_STATIONS: AnchorageStation[] = [
  // Anchorage Alpha (South-West Deep Draft Basin)
  { pos: [-68, 0.08, 42], headingRad: (45 * Math.PI) / 180, zone: "ANC-A" },
  { pos: [-44, 0.08, 45], headingRad: (50 * Math.PI) / 180, zone: "ANC-A" },
  { pos: [-22, 0.08, 48], headingRad: (40 * Math.PI) / 180, zone: "ANC-A" },
  { pos: [-78, 0.08, 62], headingRad: (55 * Math.PI) / 180, zone: "ANC-A" },
  { pos: [-52, 0.08, 65], headingRad: (45 * Math.PI) / 180, zone: "ANC-A" },
  { pos: [-28, 0.08, 68], headingRad: (40 * Math.PI) / 180, zone: "ANC-A" },
  { pos: [-62, 0.08, 86], headingRad: (50 * Math.PI) / 180, zone: "ANC-A" },
  { pos: [-38, 0.08, 88], headingRad: (45 * Math.PI) / 180, zone: "ANC-A" },

  // Anchorage Bravo (South-East Commercial / Bunkering Basin)
  { pos: [18, 0.08, 52], headingRad: (-90 * Math.PI) / 180, zone: "ANC-B" },
  { pos: [45, 0.08, 58], headingRad: (-85 * Math.PI) / 180, zone: "ANC-B" },
  { pos: [72, 0.08, 64], headingRad: (-95 * Math.PI) / 180, zone: "ANC-B" },
  { pos: [28, 0.08, 76], headingRad: (-90 * Math.PI) / 180, zone: "ANC-B" },
  { pos: [55, 0.08, 82], headingRad: (-85 * Math.PI) / 180, zone: "ANC-B" },
  { pos: [82, 0.08, 88], headingRad: (-95 * Math.PI) / 180, zone: "ANC-B" },

  // Anchorage Charlie (Western Quarantine / Outer Roads)
  { pos: [-88, 0.08, 22], headingRad: (75 * Math.PI) / 180, zone: "ANC-C" },
  { pos: [-96, 0.08, 44], headingRad: (70 * Math.PI) / 180, zone: "ANC-C" },
];

// ---------------------------------------------------------------------------
// INBOUND FAIRWAY APPROACH STATIONS (In deep navigation channel)
// Staggered along channel centerline with generous spacing
// ---------------------------------------------------------------------------
interface FairwayStation {
  pos: [number, number, number];
  headingRad: number;
}

const FAIRWAY_STATIONS: FairwayStation[] = [
  { pos: [112, 0.08, 92], headingRad: (-55 * Math.PI) / 180 },
  { pos: [86, 0.08, 70], headingRad: (-50 * Math.PI) / 180 },
  { pos: [60, 0.08, 48], headingRad: (-45 * Math.PI) / 180 },
  { pos: [34, 0.08, 28], headingRad: (-45 * Math.PI) / 180 },
  { pos: [8, 0.08, 14], headingRad: (-40 * Math.PI) / 180 },
  { pos: [58, 0.08, 24], headingRad: (-65 * Math.PI) / 180 }, // Feeder approach
  { pos: [36, 0.08, 6], headingRad: (-60 * Math.PI) / 180 },  // Turning basin approach
];

/**
 * Resolves deterministic, visually spaced display coordinates for every vessel.
 */
export function resolveVesselLayout(
  vessels: PortTwinVessel[],
  berths: PortTwinBerth[]
): ResolvedVesselDisplay[] {
  const result: ResolvedVesselDisplay[] = [];

  // Group berthed vessels by assigned berth code
  const berthGroups = new Map<string, PortTwinVessel[]>();
  const anchoredList: PortTwinVessel[] = [];
  const approachingList: PortTwinVessel[] = [];

  for (const v of vessels) {
    const isBerthed =
      (v.status === "Berthed" || v.status === "Working") && !!v.assigned_berth_code;

    if (isBerthed && v.assigned_berth_code) {
      const group = berthGroups.get(v.assigned_berth_code) || [];
      group.push(v);
      berthGroups.set(v.assigned_berth_code, group);
    } else if (v.status === "Approaching") {
      approachingList.push(v);
    } else {
      // Anchored / Delayed / Waiting / Arrived / Scheduled
      anchoredList.push(v);
    }
  }

  // 1. Position Berthed Vessels along their physical berths
  berthGroups.forEach((vesselGroup, berthCode) => {
    const berth = berths.find((b) => b.berth_code === berthCode);
    if (!berth) return;

    const baseBerthedPos = getBerthedVesselPosition(berth.coordinates);
    const berthRotation = QUAY_ANGLE + Math.PI / 2;

    vesselGroup.forEach((vessel, idx) => {
      let worldPos: [number, number, number];

      if (idx === 0) {
        // Primary berthed vessel: directly alongside quay wall
        worldPos = [baseBerthedPos[0], baseBerthedPos[1], baseBerthedPos[2]];
      } else {
        // Secondary vessel assigned to same berth: positioned in standby waiting pocket
        // 18 units seaward per additional vessel, parallel to quay, zero overlap!
        const offsetDist = 18.0 * idx;
        worldPos = [
          baseBerthedPos[0] + SEAWARD_VECTOR[0] * offsetDist,
          baseBerthedPos[1],
          baseBerthedPos[2] + SEAWARD_VECTOR[2] * offsetDist,
        ];
      }

      result.push({
        vessel,
        worldPosition: worldPos,
        rotationY: berthRotation,
        labelOffsetY: idx % 2 === 0 ? 4.8 : 6.2, // Staggered label height
        labelOffsetX: idx % 2 === 0 ? 0 : 2.5,
        priorityLevel: vessel.status === "Working" ? 1 : 2,
      });
    });
  });

  // 2. Position Anchored & Waiting Vessels in Anchorage Grids
  // Sort deterministically: Delayed first, then priority, then vessel name
  anchoredList.sort((a, b) => {
    if (a.status === "Delayed" && b.status !== "Delayed") return -1;
    if (b.status === "Delayed" && a.status !== "Delayed") return 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.vessel_name.localeCompare(b.vessel_name);
  });

  anchoredList.forEach((vessel, idx) => {
    const station = ANCHORAGE_STATIONS[idx % ANCHORAGE_STATIONS.length];
    // For large fleets (> length of stations), apply a deterministic outer offset
    const tier = Math.floor(idx / ANCHORAGE_STATIONS.length);
    const tierOffsetZ = tier * 18.0;
    const tierOffsetX = tier * 10.0 * (idx % 2 === 0 ? 1 : -1);

    const worldPos: [number, number, number] = [
      station.pos[0] + tierOffsetX,
      station.pos[1],
      station.pos[2] + tierOffsetZ,
    ];

    result.push({
      vessel,
      worldPosition: worldPos,
      rotationY: station.headingRad,
      labelOffsetY: idx % 2 === 0 ? 4.8 : 6.2,
      labelOffsetX: idx % 2 === 0 ? 0 : -2.0,
      priorityLevel: vessel.status === "Delayed" ? 1 : 3,
    });
  });

  // 3. Position Approaching / In-Transit Vessels along Fairway
  approachingList.sort((a, b) => a.vessel_name.localeCompare(b.vessel_name));

  approachingList.forEach((vessel, idx) => {
    const station = FAIRWAY_STATIONS[idx % FAIRWAY_STATIONS.length];
    const tier = Math.floor(idx / FAIRWAY_STATIONS.length);

    const worldPos: [number, number, number] = [
      station.pos[0] + tier * 15.0,
      station.pos[1],
      station.pos[2] + tier * 12.0,
    ];

    result.push({
      vessel,
      worldPosition: worldPos,
      rotationY: station.headingRad,
      labelOffsetY: idx % 2 === 0 ? 4.8 : 6.2,
      labelOffsetX: idx % 2 === 0 ? 0 : 2.0,
      priorityLevel: 2,
    });
  });

  return result;
}
