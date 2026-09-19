/**
 * Port Twin Data Adapter
 * 
 * Maps live backend database records (from /api/port-twin) to the typed 3D objects
 * consumed by the React Three Fiber digital twin components.
 * 
 * Separates dynamic operational data (database source of truth) from static
 * physical port geometry (GIS coordinates, polygons, quay walls, rail alignments).
 */

import {
  PortTwinBerth,
  PortTwinCrane,
  PortTwinYard,
  PortTwinVessel,
  PortTwinDisruption,
  VesselOperationalStatus,
} from "@/data/port-twin-data";

import {
  PortTwinApiResponse,
  PortTwinApiBerth,
  PortTwinApiCrane,
  PortTwinApiVessel,
  Yard as ApiYard,
  Disruption as ApiDisruption,
} from "@/types";

// ---------------------------------------------------------------------------
// STATIC PHYSICAL PORT GEOMETRY LOOKUP TABLES
// (Physical port infrastructure does not change; its operational status does)
// ---------------------------------------------------------------------------

interface BerthGeometry {
  coordinates: [number, number];
  polygon: [number, number][];
  max_draft: number;
  bollards_count: number;
  fender_type: string;
}

const BERTH_GEOMETRIES: Record<string, BerthGeometry> = {
  "B-01": {
    coordinates: [103.7465, 1.2568],
    polygon: [
      [103.7442, 1.2576],
      [103.7485, 1.2562],
      [103.7488, 1.2568],
      [103.7445, 1.2582],
    ],
    max_draft: 16.5,
    bollards_count: 28,
    fender_type: "Super Cone SCN-1400",
  },
  "B-02": {
    coordinates: [103.7505, 1.2555],
    polygon: [
      [103.7487, 1.2561],
      [103.7525, 1.2549],
      [103.7528, 1.2555],
      [103.7490, 1.2567],
    ],
    max_draft: 15.5,
    bollards_count: 24,
    fender_type: "Arch Fender ANP-1000",
  },
  "B-03": {
    coordinates: [103.7545, 1.2543],
    polygon: [
      [103.7527, 1.2548],
      [103.7562, 1.2537],
      [103.7565, 1.2543],
      [103.7530, 1.2554],
    ],
    max_draft: 15.0,
    bollards_count: 22,
    fender_type: "Cell Fender CY-1250",
  },
  "B-04": {
    coordinates: [103.7580, 1.2531],
    polygon: [
      [103.7564, 1.2536],
      [103.7597, 1.2526],
      [103.7600, 1.2532],
      [103.7567, 1.2542],
    ],
    max_draft: 14.5,
    bollards_count: 20,
    fender_type: "Cell Fender CY-1150",
  },
  "B-05": {
    coordinates: [103.7615, 1.2520],
    polygon: [
      [103.7599, 1.2525],
      [103.7632, 1.2514],
      [103.7635, 1.2520],
      [103.7602, 1.2531],
    ],
    max_draft: 13.5,
    bollards_count: 18,
    fender_type: "Pneumatic 2.5x5.5m",
  },
};

interface CraneGeometry {
  coordinates: [number, number];
  default_berth: string;
  boom_reach_meters: number;
  rail_gauge_meters: number;
}

const CRANE_GEOMETRIES: Record<string, CraneGeometry> = {
  "CR-01": { coordinates: [103.7448, 1.2574], default_berth: "B-01", boom_reach_meters: 65, rail_gauge_meters: 35 },
  "CR-02": { coordinates: [103.7462, 1.2570], default_berth: "B-01", boom_reach_meters: 65, rail_gauge_meters: 35 },
  "CR-03": { coordinates: [103.7495, 1.2559], default_berth: "B-02", boom_reach_meters: 60, rail_gauge_meters: 32 },
  "CR-04": { coordinates: [103.7510, 1.2554], default_berth: "B-02", boom_reach_meters: 60, rail_gauge_meters: 32 },
  "CR-05": { coordinates: [103.7538, 1.2546], default_berth: "B-03", boom_reach_meters: 55, rail_gauge_meters: 30 },
  "CR-06": { coordinates: [103.7552, 1.2541], default_berth: "B-03", boom_reach_meters: 55, rail_gauge_meters: 30 },
  "CR-07": { coordinates: [103.7575, 1.2534], default_berth: "B-04", boom_reach_meters: 52, rail_gauge_meters: 28 },
  "CR-08": { coordinates: [103.7588, 1.2529], default_berth: "B-04", boom_reach_meters: 52, rail_gauge_meters: 28 },
  "CR-09": { coordinates: [103.7608, 1.2523], default_berth: "B-05", boom_reach_meters: 45, rail_gauge_meters: 25 },
  "CR-10": { coordinates: [103.7622, 1.2518], default_berth: "B-05", boom_reach_meters: 45, rail_gauge_meters: 25 },
};

interface YardGeometry {
  coordinates: [number, number];
  polygon: [number, number][];
  stacking_tiers: number;
  rtg_cranes_count: number;
}

const YARD_GEOMETRIES: Record<string, YardGeometry> = {
  "Y-01": {
    coordinates: [103.7485, 1.2625],
    polygon: [
      [103.7460, 1.2610],
      [103.7510, 1.2595],
      [103.7522, 1.2635],
      [103.7472, 1.2650],
    ],
    stacking_tiers: 5,
    rtg_cranes_count: 4,
  },
  "Y-02": {
    coordinates: [103.7540, 1.2608],
    polygon: [
      [103.7518, 1.2592],
      [103.7562, 1.2578],
      [103.7574, 1.2618],
      [103.7530, 1.2632],
    ],
    stacking_tiers: 5,
    rtg_cranes_count: 4,
  },
  "Y-03": {
    coordinates: [103.7592, 1.2591],
    polygon: [
      [103.7570, 1.2575],
      [103.7614, 1.2560],
      [103.7626, 1.2600],
      [103.7582, 1.2615],
    ],
    stacking_tiers: 4,
    rtg_cranes_count: 3,
  },
  "Y-04": {
    coordinates: [103.7645, 1.2574],
    polygon: [
      [103.7622, 1.2558],
      [103.7668, 1.2543],
      [103.7680, 1.2583],
      [103.7634, 1.2598],
    ],
    stacking_tiers: 5,
    rtg_cranes_count: 4,
  },
  "Y-05": {
    coordinates: [103.7698, 1.2558],
    polygon: [
      [103.7675, 1.2541],
      [103.7720, 1.2526],
      [103.7732, 1.2566],
      [103.7687, 1.2581],
    ],
    stacking_tiers: 6,
    rtg_cranes_count: 3,
  },
};

// Anchorage and fairway coordinate slots for vessels (Spacious non-overlapping distribution)
const ANCHORAGE_SLOTS: Array<{ coords: [number, number]; heading: number; zone: string }> = [
  // Anchorage Alpha (Deep water south-west)
  { coords: [103.726, 1.242], heading: 45, zone: "ANC-A" },
  { coords: [103.733, 1.238], heading: 40, zone: "ANC-A" },
  { coords: [103.740, 1.244], heading: 50, zone: "ANC-A" },
  { coords: [103.728, 1.247], heading: 45, zone: "ANC-A" },
  { coords: [103.736, 1.246], heading: 55, zone: "ANC-A" },
  { coords: [103.742, 1.239], heading: 35, zone: "ANC-A" },

  // Anchorage Bravo (Bunkering south-east)
  { coords: [103.755, 1.236], heading: 270, zone: "ANC-B" },
  { coords: [103.762, 1.235], heading: 265, zone: "ANC-B" },
  { coords: [103.769, 1.238], heading: 275, zone: "ANC-B" },
  { coords: [103.758, 1.241], heading: 270, zone: "ANC-B" },
  { coords: [103.766, 1.242], heading: 260, zone: "ANC-B" },

  // Anchorage Charlie (West roadstead)
  { coords: [103.723, 1.254], heading: 85, zone: "ANC-C" },
  { coords: [103.730, 1.257], heading: 90, zone: "ANC-C" },
  { coords: [103.734, 1.253], heading: 80, zone: "ANC-C" },
];

const FAIRWAY_SLOTS: Array<{ coords: [number, number]; heading: number }> = [
  { coords: [103.7840, 1.2310], heading: 300 },
  { coords: [103.7780, 1.2350], heading: 305 },
  { coords: [103.7730, 1.2390], heading: 310 },
  { coords: [103.7680, 1.2440], heading: 315 },
  { coords: [103.7630, 1.2480], heading: 310 },
  { coords: [103.7710, 1.2450], heading: 315 },
  { coords: [103.7760, 1.2410], heading: 305 },
];

// ---------------------------------------------------------------------------
// DATA ADAPTER FUNCTIONS
// ---------------------------------------------------------------------------

/**
 * Normalizes yard code from backend (e.g. YZ-01 or Y-01) to Y-01 format.
 */
function normalizeYardCode(rawCode: string): string {
  if (!rawCode) return "Y-01";
  const num = rawCode.replace(/\D/g, "");
  return `Y-${num.padStart(2, "0")}`;
}

/**
 * Adapts database berths into PortTwinBerth visual objects.
 */
export function adaptBerths(apiBerths: PortTwinApiBerth[]): PortTwinBerth[] {
  return apiBerths.map((b) => {
    const geo = BERTH_GEOMETRIES[b.berth_code] || BERTH_GEOMETRIES["B-01"];
    return {
      id: b.id,
      berth_code: b.berth_code,
      berth_name: b.berth_name,
      max_vessel_length: b.max_vessel_length,
      max_draft: geo.max_draft,
      status: (b.status === "Occupied" || b.status === "Maintenance" ? b.status : "Available") as any,
      current_vessel_name: b.current_vessel_name || undefined,
      current_vessel_id: b.current_vessel_id || undefined,
      assigned_cranes: b.assigned_cranes || [],
      bollards_count: geo.bollards_count,
      fender_type: geo.fender_type,
      coordinates: geo.coordinates,
      polygon: geo.polygon,
    };
  });
}

/**
 * Adapts database cranes into PortTwinCrane visual objects.
 */
export function adaptCranes(apiCranes: PortTwinApiCrane[]): PortTwinCrane[] {
  return apiCranes.map((c) => {
    const geo = CRANE_GEOMETRIES[c.crane_code] || CRANE_GEOMETRIES["CR-01"];
    const status = (c.status || "Available") as PortTwinCrane["status"];
    const moves = status === "Busy" ? Math.round(c.capacity_per_hour * 8.5) : 0;

    return {
      id: c.id,
      crane_code: c.crane_code,
      crane_name: c.crane_name,
      assigned_berth_code: c.assigned_berth_code || geo.default_berth,
      capacity_per_hour: c.capacity_per_hour,
      status,
      boom_reach_meters: geo.boom_reach_meters,
      rail_gauge_meters: geo.rail_gauge_meters,
      current_moves_count: moves,
      coordinates: geo.coordinates,
    };
  });
}

/**
 * Adapts database container yards into PortTwinYard visual objects.
 */
export function adaptYards(apiYards: ApiYard[]): PortTwinYard[] {
  return apiYards.map((y) => {
    const normCode = normalizeYardCode(y.yard_code);
    const geo = YARD_GEOMETRIES[normCode] || YARD_GEOMETRIES["Y-01"];
    const util = typeof y.utilization_percentage === "number"
      ? Math.round(y.utilization_percentage * 10) / 10
      : Math.round((y.occupied_capacity / Math.max(1, y.total_capacity)) * 1000) / 10;

    return {
      id: y.id,
      yard_code: normCode,
      yard_name: y.yard_name,
      cargo_type: y.cargo_type,
      total_capacity_teu: y.total_capacity,
      occupied_capacity_teu: y.occupied_capacity,
      utilization_pct: util,
      status: (y.status || "Normal") as PortTwinYard["status"],
      stacking_tiers: geo.stacking_tiers,
      rtg_cranes_count: geo.rtg_cranes_count,
      coordinates: geo.coordinates,
      polygon: geo.polygon,
    };
  });
}

/**
 * Adapts database vessels into PortTwinVessel visual objects with dynamic
 * operational coordinates based on berthing/anchorage assignments.
 */
export function adaptVessels(
  apiVessels: PortTwinApiVessel[],
  adaptedBerths: PortTwinBerth[]
): PortTwinVessel[] {
  let anchorageIndex = 0;
  let fairwayIndex = 0;

  return apiVessels.map((v) => {
    // Determine mapped operational status
    const rawStatus = (v.status || "Scheduled").toLowerCase();
    let status: VesselOperationalStatus = "Scheduled" as any;
    let coords: [number, number] = [103.7740, 1.2370];
    let heading = 110;
    let assignedBerthCode: string | undefined = v.assigned_berth_code || undefined;
    let assignedAnchorageCode: string | undefined = undefined;
    let movesCompleted = 0;
    let movesTotal = 0;
    let delayHours: number | undefined = undefined;

    // Check if vessel is moored at a berth
    if (
      rawStatus === "loading" ||
      rawStatus === "unloading" ||
      rawStatus === "working" ||
      rawStatus === "berthing" ||
      rawStatus === "berthed"
    ) {
      status = rawStatus === "berthing" ? "Berthed" : "Working";
      // Find corresponding berth coordinates
      const berth = adaptedBerths.find(
        (b) => b.id === v.assigned_berth_id || b.berth_code === assignedBerthCode
      );
      if (berth) {
        coords = berth.coordinates;
        assignedBerthCode = berth.berth_code;
      }
      heading = 110;
      movesTotal = Math.round(v.cargo_volume * 1.4);
      movesCompleted = rawStatus === "unloading" ? Math.round(movesTotal * 0.75) : Math.round(movesTotal * 0.45);
    } else if (rawStatus === "waiting" || rawStatus === "delayed" || rawStatus === "arrived" || rawStatus === "anchored") {
      status = rawStatus === "delayed" ? "Delayed" : "Anchored";
      const slot = ANCHORAGE_SLOTS[anchorageIndex % ANCHORAGE_SLOTS.length];
      coords = slot.coords;
      heading = slot.heading;
      assignedAnchorageCode = slot.zone;
      anchorageIndex++;
      if (v.expected_waiting_time > 0) {
        delayHours = v.expected_waiting_time;
      }
    } else {
      // Scheduled / Approaching
      status = "Approaching";
      const slot = FAIRWAY_SLOTS[fairwayIndex % FAIRWAY_SLOTS.length];
      coords = slot.coords;
      heading = slot.heading;
      fairwayIndex++;
    }

    return {
      id: v.id,
      vessel_code: v.vessel_code,
      vessel_name: v.vessel_name,
      shipping_line: v.shipping_line,
      loa_meters: v.vessel_length,
      beam_meters: Math.round(v.vessel_length * 0.14 * 10) / 10,
      draft_meters: Math.round((12.0 + v.vessel_length / 100) * 10) / 10,
      cargo_teu: v.cargo_volume * 10,
      priority: v.priority || 2,
      status,
      assigned_berth_code: assignedBerthCode,
      assigned_anchorage_code: assignedAnchorageCode,
      heading_degrees: heading,
      coordinates: coords,
      speed_knots: status === "Approaching" ? 11.5 : 0,
      moves_completed: movesCompleted,
      moves_total: movesTotal,
      delay_hours: delayHours,
    };
  });
}

/**
 * Adapts database disruptions into PortTwinDisruption visual overlays.
 */
export function adaptDisruptions(
  apiDisruptions: ApiDisruption[],
  adaptedBerths: PortTwinBerth[],
  adaptedCranes: PortTwinCrane[]
): PortTwinDisruption[] {
  return apiDisruptions.map((d) => {
    let coords: [number, number] = [103.7545, 1.2543];
    let affectedCode = "PORT";

    if (d.affected_resource_type === "crane") {
      const targetCrane = adaptedCranes.find((c) => c.id === d.affected_resource_id || c.crane_code === d.affected_resource_id);
      if (targetCrane) {
        coords = targetCrane.coordinates;
        affectedCode = targetCrane.crane_code;
      } else if (adaptedCranes.length > 0) {
        coords = adaptedCranes[0].coordinates;
        affectedCode = adaptedCranes[0].crane_code;
      }
    } else if (d.affected_resource_type === "berth") {
      const targetBerth = adaptedBerths.find((b) => b.id === d.affected_resource_id || b.berth_code === d.affected_resource_id);
      if (targetBerth) {
        coords = targetBerth.coordinates;
        affectedCode = targetBerth.berth_code;
      } else if (adaptedBerths.length > 0) {
        coords = adaptedBerths[0].coordinates;
        affectedCode = adaptedBerths[0].berth_code;
      }
    } else {
      // Port / Fairway
      coords = [103.7660, 1.2420];
      affectedCode = "FAIRWAY";
    }

    return {
      id: d.id,
      incident_code: `INC-${affectedCode}`,
      disruption_type: d.disruption_type,
      incident_type: d.affected_resource_type === "crane" ? "crane_failure" : d.affected_resource_type === "berth" ? "berth_closure" : "weather_alert",
      title: d.title,
      severity: (d.severity || "Medium") as any,
      affected_resource_type: d.affected_resource_type,
      affected_resource_code: affectedCode,
      affected_resource_id: d.affected_resource_id || undefined,
      description: d.description || "",
      estimated_risk_usd: d.severity === "Critical" ? 55000 : d.severity === "High" ? 35000 : 15000,
      estimated_delay_hours: d.severity === "Critical" ? 6.5 : d.severity === "High" ? 4.0 : 2.0,
      at_risk_vessel_names: [],
      affected_vessel_names: [],
      affected_berth_codes: [affectedCode.startsWith("B-") ? affectedCode : ""],
      affected_crane_codes: [affectedCode.startsWith("CR-") ? affectedCode : ""],
      recommended_action: "Execute dynamic schedule hot-swap via NaviOps CP-SAT Optimizer.",
      coordinates: coords,
    };
  });
}

/**
 * Master adapter: transforms full API response into typed Port Twin scene collections.
 */
export function adaptPortTwinData(response: PortTwinApiResponse) {
  const berths = adaptBerths(response.berths || []);
  const cranes = adaptCranes(response.cranes || []);
  const yards = adaptYards(response.yards || []);
  const vessels = adaptVessels(response.vessels || [], berths);
  const disruptions = adaptDisruptions(response.disruptions || [], berths, cranes);

  return {
    berths,
    cranes,
    yards,
    vessels,
    disruptions,
  };
}
