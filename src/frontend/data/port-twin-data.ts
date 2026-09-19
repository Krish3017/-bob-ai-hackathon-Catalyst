/**
 * Live Port Digital Twin — Phase 1 Geographic & Operational Data
 * 
 * Defines the container terminal's geographic layout (GeoJSON),
 * spatial boundaries, and structured operational objects (matching NaviOps schemas).
 */

export interface PortTwinBerth {
    id: string;
    berth_code: string;
    berth_name: string;
    max_vessel_length: number;
    max_draft: number;
    status: "Available" | "Occupied" | "Maintenance";
    current_vessel_name?: string;
    current_vessel_id?: string;
    assigned_cranes: string[];
    bollards_count: number;
    fender_type: string;
    coordinates: [number, number]; // center [lng, lat]
    polygon: [number, number][];
}

export interface PortTwinCrane {
    id: string;
    crane_code: string;
    crane_name: string;
    assigned_berth_code: string;
    capacity_per_hour: number;
    status: "Available" | "Busy" | "Maintenance" | "Failed";
    boom_reach_meters: number;
    rail_gauge_meters: number;
    current_moves_count: number;
    coordinates: [number, number];
}

export interface PortTwinYard {
    id: string;
    yard_code: string;
    yard_name: string;
    cargo_type: string;
    total_capacity_teu: number;
    occupied_capacity_teu: number;
    utilization_pct: number;
    status: "Normal" | "Congested" | "Near Capacity" | "Maintenance";
    stacking_tiers: number;
    rtg_cranes_count: number;
    coordinates: [number, number];
    polygon: [number, number][];
}

export interface PortTwinAnchorage {
    id: string;
    zone_code: string;
    zone_name: string;
    water_depth_meters: number;
    max_capacity: number;
    current_vessels_count: number;
    coordinates: [number, number];
    polygon: [number, number][];
}

// ---------------------------------------------------------------------------
// PHASE 3: OPERATIONAL INTELLIGENCE & SCENARIO TYPES
// ---------------------------------------------------------------------------

export interface PortTwinDisruption {
    id: string;
    incident_code: string;
    disruption_type: "Equipment Failure" | "Berth Maintenance" | "Weather Alert" | "Labor Shortage" | string;
    incident_type: "crane_failure" | "berth_closure" | "vessel_delay" | "weather_alert" | string;
    title: string;
    severity: "Critical" | "High" | "Medium" | "Low";
    affected_resource_type: "crane" | "berth" | "vessel" | "yard" | "port";
    affected_resource_code: string;
    affected_resource_id?: string;
    description: string;
    estimated_risk_usd: number;
    estimated_delay_hours: number;
    at_risk_vessel_names: string[];
    affected_vessel_names: string[];
    affected_berth_codes: string[];
    affected_crane_codes: string[];
    recommended_action: string;
    coordinates: [number, number];
}

export interface PortTwinOptimizationRecommendation {
    id: string;
    vessel_name: string;
    vessel_code: string;
    current_location: string;
    current_berth_code: string | null;
    recommended_berth_code: string;
    proposed_berth_code: string;
    recommended_berth_name: string;
    recommended_cranes: string[];
    assigned_crane_codes: string[];
    scheduled_arrival: string;
    scheduled_departure: string;
    waiting_reduction_hours: number;
    demurrage_savings_usd: number;
    co2_abated_mt: number;
    assignment_rationale: string;
    rationale: string;
    trajectory: [number, number][];
}

export interface PortTwinScenarioPreset {
    id: string;
    title: string;
    description: string;
    affected_resource_type?: "crane" | "berth" | "weather";
    affected_code?: string;
    unavailable_crane_codes: string[];
    unavailable_berth_codes: string[];
    vessel_delay_hours?: Record<string, number>;
    additional_delay_hours?: number;
    expected_delay_increase_hours: number;
    expected_demurrage_delta_usd: number;
    congestion_delta_points: number;
    mitigation_strategy: string;
}

export type VesselOperationalStatus =
    | "Approaching"
    | "Anchored"
    | "Berthed"
    | "Working"
    | "Delayed";

export interface NavigationRoute {
    id: string;
    name: string;
    category: "fairway" | "anchorage" | "berthing";
    color: string;
    speed_knots: number;
    waypoints: [number, number][]; // [lng, lat]
}

export interface PortTwinVessel {
    id: string;
    vessel_code: string;
    vessel_name: string;
    shipping_line: string;
    loa_meters: number;
    beam_meters: number;
    draft_meters: number;
    cargo_teu: number;
    priority: number;
    status: VesselOperationalStatus;
    assigned_berth_code?: string;
    assigned_anchorage_code?: string;
    heading_degrees: number;
    coordinates: [number, number];
    // Phase 2 Operational Metrics
    speed_knots?: number;
    moves_completed?: number;
    moves_total?: number;
    delay_hours?: number;
    route_id?: string;
    route_progress?: number; // 0.0 to 1.0 along waypoints
}

// ---------------------------------------------------------------------------
// PORT CENTER & BOUNDS
// ---------------------------------------------------------------------------
export const PORT_CENTER: [number, number] = [103.754, 1.255]; // [lng, lat]
export const PORT_BOUNDS: [[number, number], [number, number]] = [
    [103.715, 1.225], // South-West
    [103.785, 1.278], // North-East
];

// ---------------------------------------------------------------------------
// OPERATIONAL OBJECTS (Matching NaviOps Schemas)
// ---------------------------------------------------------------------------

export const PORT_BERTHS: PortTwinBerth[] = [
    {
        id: "b0000001-0000-0000-0000-000000000001",
        berth_code: "B-01",
        berth_name: "North Deepwater Quay",
        max_vessel_length: 420,
        max_draft: 16.5,
        status: "Occupied",
        current_vessel_name: "Ever Given",
        current_vessel_id: "v0000001",
        assigned_cranes: ["CR-01", "CR-02"],
        bollards_count: 28,
        fender_type: "Super Cone SCN-1400",
        coordinates: [103.7465, 1.2568],
        polygon: [
            [103.7442, 1.2576],
            [103.7485, 1.2562],
            [103.7488, 1.2568],
            [103.7445, 1.2582],
        ],
    },
    {
        id: "b0000002-0000-0000-0000-000000000002",
        berth_code: "B-02",
        berth_name: "Central Terminal Quay",
        max_vessel_length: 380,
        max_draft: 15.5,
        status: "Available",
        assigned_cranes: ["CR-03", "CR-04"],
        bollards_count: 24,
        fender_type: "Arch Fender ANP-1000",
        coordinates: [103.7505, 1.2555],
        polygon: [
            [103.7487, 1.2561],
            [103.7525, 1.2549],
            [103.7528, 1.2555],
            [103.7490, 1.2567],
        ],
    },
    {
        id: "b0000003-0000-0000-0000-000000000003",
        berth_code: "B-03",
        berth_name: "South Container Berth",
        max_vessel_length: 350,
        max_draft: 15.0,
        status: "Occupied",
        current_vessel_name: "MSC Isabella",
        current_vessel_id: "v0000003",
        assigned_cranes: ["CR-05", "CR-06"],
        bollards_count: 22,
        fender_type: "Cell Fender CY-1250",
        coordinates: [103.7545, 1.2543],
        polygon: [
            [103.7527, 1.2548],
            [103.7562, 1.2537],
            [103.7565, 1.2543],
            [103.7530, 1.2554],
        ],
    },
    {
        id: "b0000004-0000-0000-0000-000000000004",
        berth_code: "B-04",
        berth_name: "East Express Quay",
        max_vessel_length: 320,
        max_draft: 14.5,
        status: "Available",
        assigned_cranes: ["CR-07", "CR-08"],
        bollards_count: 20,
        fender_type: "Cell Fender CY-1150",
        coordinates: [103.7580, 1.2531],
        polygon: [
            [103.7564, 1.2536],
            [103.7597, 1.2526],
            [103.7600, 1.2532],
            [103.7567, 1.2542],
        ],
    },
    {
        id: "b0000005-0000-0000-0000-000000000005",
        berth_code: "B-05",
        berth_name: "Feeder & Coastal Basin",
        max_vessel_length: 280,
        max_draft: 13.0,
        status: "Maintenance",
        assigned_cranes: ["CR-09", "CR-10"],
        bollards_count: 18,
        fender_type: "Cylindrical Fender CYL-800",
        coordinates: [103.7615, 1.2520],
        polygon: [
            [103.7599, 1.2525],
            [103.7630, 1.2515],
            [103.7633, 1.2521],
            [103.7602, 1.2531],
        ],
    },
];

export const PORT_CRANES: PortTwinCrane[] = [
    {
        id: "c0000001",
        crane_code: "CR-01",
        crane_name: "STS Super-Post-Panamax 01",
        assigned_berth_code: "B-01",
        capacity_per_hour: 40,
        status: "Busy",
        boom_reach_meters: 65,
        rail_gauge_meters: 30,
        current_moves_count: 482,
        coordinates: [103.7455, 1.2573],
    },
    {
        id: "c0000002",
        crane_code: "CR-02",
        crane_name: "STS Super-Post-Panamax 02",
        assigned_berth_code: "B-01",
        capacity_per_hour: 38,
        status: "Busy",
        boom_reach_meters: 65,
        rail_gauge_meters: 30,
        current_moves_count: 512,
        coordinates: [103.7472, 1.2567],
    },
    {
        id: "c0000003",
        crane_code: "CR-03",
        crane_name: "STS Post-Panamax 03",
        assigned_berth_code: "B-02",
        capacity_per_hour: 36,
        status: "Available",
        boom_reach_meters: 60,
        rail_gauge_meters: 30,
        current_moves_count: 0,
        coordinates: [103.7498, 1.2559],
    },
    {
        id: "c0000004",
        crane_code: "CR-04",
        crane_name: "STS Post-Panamax 04",
        assigned_berth_code: "B-02",
        capacity_per_hour: 36,
        status: "Available",
        boom_reach_meters: 60,
        rail_gauge_meters: 30,
        current_moves_count: 0,
        coordinates: [103.7515, 1.2553],
    },
    {
        id: "c0000005",
        crane_code: "CR-05",
        crane_name: "STS Panamax Gantry 05",
        assigned_berth_code: "B-03",
        capacity_per_hour: 35,
        status: "Busy",
        boom_reach_meters: 55,
        rail_gauge_meters: 30,
        current_moves_count: 367,
        coordinates: [103.7538, 1.2546],
    },
    {
        id: "c0000006",
        crane_code: "CR-06",
        crane_name: "STS Panamax Gantry 06",
        assigned_berth_code: "B-03",
        capacity_per_hour: 35,
        status: "Busy",
        boom_reach_meters: 55,
        rail_gauge_meters: 30,
        current_moves_count: 389,
        coordinates: [103.7552, 1.2541],
    },
    {
        id: "c0000007",
        crane_code: "CR-07",
        crane_name: "STS Panamax Gantry 07",
        assigned_berth_code: "B-04",
        capacity_per_hour: 32,
        status: "Available",
        boom_reach_meters: 52,
        rail_gauge_meters: 28,
        current_moves_count: 0,
        coordinates: [103.7575, 1.2534],
    },
    {
        id: "c0000008",
        crane_code: "CR-08",
        crane_name: "STS Panamax Gantry 08",
        assigned_berth_code: "B-04",
        capacity_per_hour: 32,
        status: "Available",
        boom_reach_meters: 52,
        rail_gauge_meters: 28,
        current_moves_count: 0,
        coordinates: [103.7588, 1.2529],
    },
    {
        id: "c0000009",
        crane_code: "CR-09",
        crane_name: "STS Feeder Crane 09",
        assigned_berth_code: "B-05",
        capacity_per_hour: 30,
        status: "Maintenance",
        boom_reach_meters: 45,
        rail_gauge_meters: 25,
        current_moves_count: 0,
        coordinates: [103.7608, 1.2523],
    },
    {
        id: "c0000010",
        crane_code: "CR-10",
        crane_name: "STS Feeder Crane 10",
        assigned_berth_code: "B-05",
        capacity_per_hour: 30,
        status: "Failed",
        boom_reach_meters: 45,
        rail_gauge_meters: 25,
        current_moves_count: 0,
        coordinates: [103.7622, 1.2518],
    },
];

export const PORT_YARDS: PortTwinYard[] = [
    {
        id: "y0000001",
        yard_code: "Y-01",
        yard_name: "Block A - Import Dry",
        cargo_type: "Dry Standard",
        total_capacity_teu: 12000,
        occupied_capacity_teu: 8640,
        utilization_pct: 72.0,
        status: "Normal",
        stacking_tiers: 5,
        rtg_cranes_count: 4,
        coordinates: [103.7485, 1.2625],
        polygon: [
            [103.7460, 1.2610],
            [103.7510, 1.2595],
            [103.7522, 1.2635],
            [103.7472, 1.2650],
        ],
    },
    {
        id: "y0000002",
        yard_code: "Y-02",
        yard_name: "Block B - Export Dry",
        cargo_type: "Dry Standard",
        total_capacity_teu: 10000,
        occupied_capacity_teu: 7900,
        utilization_pct: 79.0,
        status: "Normal",
        stacking_tiers: 5,
        rtg_cranes_count: 4,
        coordinates: [103.7540, 1.2608],
        polygon: [
            [103.7518, 1.2592],
            [103.7562, 1.2578],
            [103.7574, 1.2618],
            [103.7530, 1.2632],
        ],
    },
    {
        id: "y0000003",
        yard_code: "Y-03",
        yard_name: "Block C - Reefer Complex",
        cargo_type: "Refrigerated / Reefer",
        total_capacity_teu: 6000,
        occupied_capacity_teu: 5340,
        utilization_pct: 89.0,
        status: "Near Capacity",
        stacking_tiers: 4,
        rtg_cranes_count: 3,
        coordinates: [103.7592, 1.2591],
        polygon: [
            [103.7570, 1.2575],
            [103.7614, 1.2561],
            [103.7626, 1.2601],
            [103.7582, 1.2615],
        ],
    },
    {
        id: "y0000004",
        yard_code: "Y-04",
        yard_name: "Block D - Transshipment Core",
        cargo_type: "Transshipment",
        total_capacity_teu: 14000,
        occupied_capacity_teu: 9100,
        utilization_pct: 65.0,
        status: "Normal",
        stacking_tiers: 6,
        rtg_cranes_count: 6,
        coordinates: [103.7645, 1.2575],
        polygon: [
            [103.7622, 1.2558],
            [103.7668, 1.2543],
            [103.7680, 1.2583],
            [103.7634, 1.2598],
        ],
    },
    {
        id: "y0000005",
        yard_code: "Y-05",
        yard_name: "Block E - Empty & Intermodal",
        cargo_type: "Empty / Rail Buffer",
        total_capacity_teu: 8000,
        occupied_capacity_teu: 4400,
        utilization_pct: 55.0,
        status: "Normal",
        stacking_tiers: 6,
        rtg_cranes_count: 3,
        coordinates: [103.7698, 1.2558],
        polygon: [
            [103.7675, 1.2541],
            [103.7720, 1.2526],
            [103.7732, 1.2566],
            [103.7687, 1.2581],
        ],
    },
];

export const PORT_ANCHORAGES: PortTwinAnchorage[] = [
    {
        id: "a0000001",
        zone_code: "ANC-A",
        zone_name: "Anchorage Alpha (Deep-Draft)",
        water_depth_meters: 22.0,
        max_capacity: 8,
        current_vessels_count: 4,
        coordinates: [103.733, 1.242],
        polygon: [
            [103.722, 1.235],
            [103.744, 1.235],
            [103.744, 1.249],
            [103.722, 1.249],
        ],
    },
    {
        id: "a0000002",
        zone_code: "ANC-B",
        zone_name: "Anchorage Bravo (Bunkering)",
        water_depth_meters: 18.5,
        max_capacity: 6,
        current_vessels_count: 2,
        coordinates: [103.762, 1.238],
        polygon: [
            [103.752, 1.232],
            [103.772, 1.232],
            [103.772, 1.244],
            [103.752, 1.244],
        ],
    },
    {
        id: "a0000003",
        zone_code: "ANC-C",
        zone_name: "Anchorage Charlie (Quarantine / Hazmat)",
        water_depth_meters: 17.0,
        max_capacity: 4,
        current_vessels_count: 1,
        coordinates: [103.728, 1.256],
        polygon: [
            [103.720, 1.251],
            [103.736, 1.251],
            [103.736, 1.261],
            [103.720, 1.261],
        ],
    },
];

export const PORT_ROUTES: NavigationRoute[] = [
    {
        id: "route-fairway-inbound",
        name: "Primary Inbound Fairway -> Turning Basin",
        category: "fairway",
        color: "#38bdf8",
        speed_knots: 11.8,
        waypoints: [
            [103.7820, 1.2330],
            [103.7740, 1.2370],
            [103.7660, 1.2420],
            [103.7570, 1.2475],
            [103.7490, 1.2510],
            [103.7470, 1.2540],
            [103.7505, 1.2555],
        ],
    },
    {
        id: "route-anchorage-alpha",
        name: "Fairway Diversion -> Anchorage Alpha",
        category: "anchorage",
        color: "#2dd4bf",
        speed_knots: 8.5,
        waypoints: [
            [103.7660, 1.2420],
            [103.7540, 1.2440],
            [103.7420, 1.2435],
            [103.7340, 1.2430],
        ],
    },
    {
        id: "route-feeder-inbound",
        name: "Coastal Feeder Approach -> Basin B-05",
        category: "berthing",
        color: "#a855f7",
        speed_knots: 9.4,
        waypoints: [
            [103.7780, 1.2400],
            [103.7710, 1.2450],
            [103.7650, 1.2490],
            [103.7615, 1.2520],
        ],
    },
];

export const PORT_VESSELS: PortTwinVessel[] = [
    {
        id: "v0000001",
        vessel_code: "V-01",
        vessel_name: "Ever Given",
        shipping_line: "Evergreen Marine",
        loa_meters: 400.0,
        beam_meters: 59.0,
        draft_meters: 15.8,
        cargo_teu: 20124,
        priority: 1,
        status: "Working",
        assigned_berth_code: "B-01",
        heading_degrees: 110,
        coordinates: [103.7465, 1.2568],
        speed_knots: 0,
        moves_completed: 1480,
        moves_total: 2100,
    },
    {
        id: "v0000003",
        vessel_code: "V-03",
        vessel_name: "MSC Isabella",
        shipping_line: "Mediterranean Shipping Co.",
        loa_meters: 366.0,
        beam_meters: 51.0,
        draft_meters: 14.8,
        cargo_teu: 14500,
        priority: 2,
        status: "Working",
        assigned_berth_code: "B-03",
        heading_degrees: 110,
        coordinates: [103.7545, 1.2543],
        speed_knots: 0,
        moves_completed: 820,
        moves_total: 1650,
    },
    {
        id: "v0000002",
        vessel_code: "V-02",
        vessel_name: "Maersk Mc-Kinney",
        shipping_line: "Maersk Line",
        loa_meters: 399.0,
        beam_meters: 59.0,
        draft_meters: 16.0,
        cargo_teu: 18270,
        priority: 1,
        status: "Anchored",
        assigned_anchorage_code: "ANC-A",
        heading_degrees: 45,
        coordinates: [103.731, 1.243],
        speed_knots: 0,
    },
    {
        id: "v0000004",
        vessel_code: "V-04",
        vessel_name: "CMA CGM Palais",
        shipping_line: "CMA CGM",
        loa_meters: 336.0,
        beam_meters: 48.0,
        draft_meters: 14.2,
        cargo_teu: 13800,
        priority: 2,
        status: "Delayed",
        assigned_anchorage_code: "ANC-A",
        heading_degrees: 40,
        coordinates: [103.738, 1.240],
        speed_knots: 0,
        delay_hours: 5.5,
    },
    {
        id: "v0000005",
        vessel_code: "V-05",
        vessel_name: "COSCO Universe",
        shipping_line: "COSCO Shipping",
        loa_meters: 300.0,
        beam_meters: 42.0,
        draft_meters: 13.5,
        cargo_teu: 10000,
        priority: 3,
        status: "Anchored",
        assigned_anchorage_code: "ANC-B",
        heading_degrees: 270,
        coordinates: [103.763, 1.237],
        speed_knots: 0,
    },
    {
        id: "v0000006",
        vessel_code: "V-06",
        vessel_name: "Hapag-Lloyd Al Jmeliyah",
        shipping_line: "Hapag-Lloyd",
        loa_meters: 368.0,
        beam_meters: 51.0,
        draft_meters: 15.2,
        cargo_teu: 15000,
        priority: 2,
        status: "Approaching",
        heading_degrees: 305,
        coordinates: [103.7740, 1.2370],
        speed_knots: 11.8,
        route_id: "route-fairway-inbound",
        route_progress: 0.2,
    },
    {
        id: "v0000007",
        vessel_code: "V-07",
        vessel_name: "ONE Apus",
        shipping_line: "Ocean Network Express",
        loa_meters: 310.0,
        beam_meters: 45.0,
        draft_meters: 13.8,
        cargo_teu: 14000,
        priority: 2,
        status: "Approaching",
        heading_degrees: 315,
        coordinates: [103.7710, 1.2450],
        speed_knots: 9.4,
        route_id: "route-feeder-inbound",
        route_progress: 0.35,
    },
];

// ---------------------------------------------------------------------------
// PHASE 3: OPERATIONAL DISRUPTIONS & INCIDENT LOCATIONS
// ---------------------------------------------------------------------------

export const PORT_DISRUPTIONS: PortTwinDisruption[] = [
    {
        id: "disp-01",
        incident_code: "INC-CR10-FAIL",
        disruption_type: "Equipment Failure",
        incident_type: "crane_failure",
        title: "STS Crane CR-10 Hoist Motor Failure",
        severity: "Critical",
        affected_resource_type: "crane",
        affected_resource_code: "CR-10",
        affected_resource_id: "c0000010",
        description: "Main hoist variable frequency drive tripped on electrical overload. Feeder Basin handling rate degraded by 50%.",
        estimated_risk_usd: 45000,
        estimated_delay_hours: 6.5,
        at_risk_vessel_names: ["ONE Apus", "MSC Oscar"],
        affected_vessel_names: ["ONE Apus", "MSC Oscar"],
        affected_berth_codes: ["B-05"],
        affected_crane_codes: ["CR-10"],
        recommended_action: "Divert inbound coastal feeder ONE Apus to Berth B-04 or deploy auxiliary mobile harbor crane.",
        coordinates: [103.7622, 1.2518],
    },
    {
        id: "disp-02",
        incident_code: "INC-B05-MAINT",
        disruption_type: "Berth Maintenance",
        incident_type: "berth_closure",
        title: "Berth B-05 Super Cone Fender Replacement",
        severity: "High",
        affected_resource_type: "berth",
        affected_resource_code: "B-05",
        affected_resource_id: "b0000005-0000-0000-0000-000000000005",
        description: "Scheduled maritime civil engineering repair on bollards #12–16. Berth closed to heavy draft vessels until 22:00 UTC.",
        estimated_risk_usd: 25000,
        estimated_delay_hours: 4.0,
        at_risk_vessel_names: ["ONE Apus", "COSCO Universe"],
        affected_vessel_names: ["ONE Apus", "COSCO Universe"],
        affected_berth_codes: ["B-05"],
        affected_crane_codes: ["CR-09", "CR-10"],
        recommended_action: "Shift feeder berthing window +4 hours via CP-SAT scheduler to prevent anchorage pileup.",
        coordinates: [103.7615, 1.2520],
    },
    {
        id: "disp-03",
        incident_code: "INC-FAIRWAY-FOG",
        disruption_type: "Weather Alert",
        incident_type: "weather_alert",
        title: "Heavy Outer Fairway Fog & 6kt Speed Restriction",
        severity: "Medium",
        affected_resource_type: "port",
        affected_resource_code: "FAIRWAY",
        description: "Marine meteorological station reports visibility under 0.4 nautical miles. Port Captain enforced 6-knot speed ceiling.",
        estimated_risk_usd: 12000,
        estimated_delay_hours: 2.5,
        at_risk_vessel_names: ["Hapag-Lloyd Al Jmeliyah", "COSCO Universe"],
        affected_vessel_names: ["Hapag-Lloyd Al Jmeliyah", "COSCO Universe"],
        affected_berth_codes: [],
        affected_crane_codes: [],
        recommended_action: "Activate automated pilot radar separation protocol with 1,500m longitudinal headway buffers.",
        coordinates: [103.7740, 1.2370],
    },
];

// ---------------------------------------------------------------------------
// PHASE 3: OR-TOOLS CP-SAT RECOMMENDED BERTHING ASSIGNMENTS
// ---------------------------------------------------------------------------

export const PORT_OPTIMIZATION_RECOMMENDATIONS: PortTwinOptimizationRecommendation[] = [
    {
        id: "opt-rec-01",
        vessel_name: "Maersk Mc-Kinney",
        vessel_code: "V-02",
        current_location: "Anchorage Alpha (Deep-Draft)",
        current_berth_code: null,
        recommended_berth_code: "B-01",
        proposed_berth_code: "B-01",
        recommended_berth_name: "North Deepwater Quay",
        recommended_cranes: ["CR-01", "CR-02"],
        assigned_crane_codes: ["CR-01", "CR-02"],
        scheduled_arrival: "Today 16:30 UTC",
        scheduled_departure: "Tomorrow 08:30 UTC",
        waiting_reduction_hours: 18.5,
        demurrage_savings_usd: 23125,
        co2_abated_mt: 6.5,
        assignment_rationale: "Seamless hot-swap berthing immediately following Ever Given departure. Maximizes 420m berth length and 40 moves/hr crane rate.",
        rationale: "Seamless hot-swap berthing immediately following Ever Given departure. Maximizes 420m berth length and 40 moves/hr crane rate.",
        trajectory: [
            [103.731, 1.243], // Anchorage Alpha
            [103.7465, 1.2568], // Berth B-01
        ],
    },
    {
        id: "opt-rec-02",
        vessel_name: "CMA CGM Palais",
        vessel_code: "V-04",
        current_location: "Anchorage Alpha (Delayed)",
        current_berth_code: null,
        recommended_berth_code: "B-02",
        proposed_berth_code: "B-02",
        recommended_berth_name: "Central Terminal Quay",
        recommended_cranes: ["CR-03", "CR-04"],
        assigned_crane_codes: ["CR-03", "CR-04"],
        scheduled_arrival: "Today 15:00 UTC",
        scheduled_departure: "Tomorrow 04:00 UTC",
        waiting_reduction_hours: 14.0,
        demurrage_savings_usd: 17500,
        co2_abated_mt: 4.9,
        assignment_rationale: "Immediate dispatch into unoccupied Berth B-02. Eliminates 5.5h anchorage delay penalty and restores liner turnaround schedule.",
        rationale: "Immediate dispatch into unoccupied Berth B-02. Eliminates 5.5h anchorage delay penalty and restores liner turnaround schedule.",
        trajectory: [
            [103.738, 1.240], // Anchorage Alpha
            [103.7505, 1.2555], // Berth B-02
        ],
    },
    {
        id: "opt-rec-03",
        vessel_name: "Hapag-Lloyd Al Jmeliyah",
        vessel_code: "V-06",
        current_location: "Fairway Inbound (In Transit)",
        current_berth_code: null,
        recommended_berth_code: "B-04",
        proposed_berth_code: "B-04",
        recommended_berth_name: "East Express Quay",
        recommended_cranes: ["CR-07", "CR-08"],
        assigned_crane_codes: ["CR-07", "CR-08"],
        scheduled_arrival: "Today 17:00 UTC",
        scheduled_departure: "Tomorrow 07:00 UTC",
        waiting_reduction_hours: 8.5,
        demurrage_savings_usd: 10625,
        co2_abated_mt: 3.0,
        assignment_rationale: "Just-In-Time (JIT) direct harbor fairway berthing. Bypasses anchorage wait entirely, preserving auxiliary engine bunker fuel.",
        rationale: "Just-In-Time (JIT) direct harbor fairway berthing. Bypasses anchorage wait entirely, preserving auxiliary engine bunker fuel.",
        trajectory: [
            [103.7740, 1.2370], // Fairway
            [103.7580, 1.2531], // Berth B-04
        ],
    },
];

// ---------------------------------------------------------------------------
// PHASE 3: WHAT-IF SCENARIO PRESETS
// ---------------------------------------------------------------------------

export const PORT_SCENARIO_PRESETS: PortTwinScenarioPreset[] = [
    {
        id: "scen-crane-failure",
        title: "Simulate STS Crane CR-03 Outage",
        description: "Simulate electrical hoist failure on Berth B-02's primary gantry crane.",
        affected_resource_type: "crane",
        affected_code: "CR-03",
        unavailable_crane_codes: ["CR-03"],
        unavailable_berth_codes: [],
        vessel_delay_hours: { v0000004: 3.5 },
        additional_delay_hours: 3.5,
        expected_delay_increase_hours: 7.0,
        expected_demurrage_delta_usd: 8750,
        congestion_delta_points: 4.5,
        mitigation_strategy: "Reallocate Crane CR-04 to dual-trolley mode and shift CMA CGM Palais departure window +3.5h.",
    },
    {
        id: "scen-berth-closure",
        title: "Simulate Berth B-02 Emergency Closure",
        description: "Simulate sudden berth water draft siltation and structural bollard inspection.",
        affected_resource_type: "berth",
        affected_code: "B-02",
        unavailable_crane_codes: ["CR-03", "CR-04"],
        unavailable_berth_codes: ["B-02"],
        vessel_delay_hours: { v0000004: 8.0, v0000006: 4.0 },
        additional_delay_hours: 8.0,
        expected_delay_increase_hours: 16.5,
        expected_demurrage_delta_usd: 20625,
        congestion_delta_points: 12.0,
        mitigation_strategy: "Divert CMA CGM Palais to Berth B-04 once empty; queue Hapag-Lloyd in Anchorage Bravo.",
    },
    {
        id: "scen-squall-wind",
        title: "Simulate Squall Gust Advisory (38 kts)",
        description: "Simulate gale-force squall winds exceeding the 20 m/s STS crane safe operational threshold.",
        affected_resource_type: "weather",
        affected_code: "TERMINAL_WIDE",
        unavailable_crane_codes: ["CR-01", "CR-02", "CR-05", "CR-06"],
        unavailable_berth_codes: [],
        vessel_delay_hours: { v0000001: 4.0, v0000003: 4.0 },
        additional_delay_hours: 6.0,
        expected_delay_increase_hours: 24.0,
        expected_demurrage_delta_usd: 30000,
        congestion_delta_points: 18.5,
        mitigation_strategy: "Secure all crane booms in 45° storm-lock position and notify liners of force-majeure berth hold.",
    },
];

// ---------------------------------------------------------------------------
// GEOJSON FEATURE COLLECTIONS
// ---------------------------------------------------------------------------

/**
 * Terminal landmass polygon (reclaimed coastal peninsula)
 */
export const TERMINAL_LANDMASS_GEOJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "NaviOps Container Terminal Island" },
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [103.7410, 1.2588],
                        [103.7435, 1.2580],
                        [103.7635, 1.2512],
                        [103.7660, 1.2505],
                        [103.7740, 1.2530],
                        [103.7780, 1.2590],
                        [103.7760, 1.2680],
                        [103.7680, 1.2720],
                        [103.7500, 1.2730],
                        [103.7420, 1.2670],
                        [103.7410, 1.2588],
                    ],
                ],
            },
        },
    ],
};

/**
 * Quayside Apron & Crane Rails (2.5D concrete quay boundary)
 */
export const QUAYSIDE_APRON_GEOJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "Quay Crane Rail & Apron Corridor" },
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [103.7438, 1.2584],
                        [103.7635, 1.2515],
                        [103.7645, 1.2540],
                        [103.7448, 1.2608],
                        [103.7438, 1.2584],
                    ],
                ],
            },
        },
    ],
};

/**
 * Approach Fairway Channel & Turning Basin (dredged deep navigational channel)
 */
export const FAIRWAY_CHANNEL_GEOJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
        // Main Inbound/Outbound Fairway
        {
            type: "Feature",
            properties: { name: "Main Approach Fairway (Draft: 17.5m)", type: "fairway" },
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [103.7760, 1.2310],
                        [103.7820, 1.2330],
                        [103.7620, 1.2480],
                        [103.7520, 1.2510],
                        [103.7460, 1.2530],
                        [103.7440, 1.2510],
                        [103.7500, 1.2480],
                        [103.7760, 1.2310],
                    ],
                ],
            },
        },
        // Turning Basin (650m diameter maneuvering area)
        {
            type: "Feature",
            properties: { name: "Harbor Turning Basin (Diameter: 650m)", type: "turning_basin" },
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [103.7470, 1.2555],
                        [103.7495, 1.2540],
                        [103.7515, 1.2515],
                        [103.7505, 1.2485],
                        [103.7480, 1.2470],
                        [103.7445, 1.2480],
                        [103.7425, 1.2505],
                        [103.7430, 1.2535],
                        [103.7450, 1.2552],
                        [103.7470, 1.2555],
                    ],
                ],
            },
        },
    ],
};

/**
 * Fairway Centerline & Navigational Buoys
 */
export const FAIRWAY_NAV_GEOJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: [
        // Centerline dashed guide
        {
            type: "Feature",
            properties: { name: "Fairway Navigational Axis" },
            geometry: {
                type: "LineString",
                coordinates: [
                    [103.7790, 1.2320],
                    [103.7690, 1.2405],
                    [103.7590, 1.2485],
                    [103.7470, 1.2515],
                ],
            },
        },
        // Navigational Lateral Buoy Markers (Port = Red, Starboard = Green)
        {
            type: "Feature",
            properties: { buoy_id: "NB-01", name: "Fairway Starboard Buoy 1", color: "#10b981" },
            geometry: { type: "Point", coordinates: [103.7755, 1.2335] },
        },
        {
            type: "Feature",
            properties: { buoy_id: "NB-02", name: "Fairway Port Buoy 2", color: "#ef4444" },
            geometry: { type: "Point", coordinates: [103.7795, 1.2305] },
        },
        {
            type: "Feature",
            properties: { buoy_id: "NB-03", name: "Fairway Starboard Buoy 3", color: "#10b981" },
            geometry: { type: "Point", coordinates: [103.7645, 1.2455] },
        },
        {
            type: "Feature",
            properties: { buoy_id: "NB-04", name: "Fairway Port Buoy 4", color: "#ef4444" },
            geometry: { type: "Point", coordinates: [103.7685, 1.2425] },
        },
        {
            type: "Feature",
            properties: { buoy_id: "NB-05", name: "Turning Basin Entry Starboard", color: "#10b981" },
            geometry: { type: "Point", coordinates: [103.7535, 1.2505] },
        },
        {
            type: "Feature",
            properties: { buoy_id: "NB-06", name: "Turning Basin Entry Port", color: "#ef4444" },
            geometry: { type: "Point", coordinates: [103.7565, 1.2475] },
        },
    ],
};

/**
 * Berths polygon GeoJSON
 */
export const BERTHS_GEOJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: PORT_BERTHS.map((b) => ({
        type: "Feature",
        properties: {
            id: b.id,
            code: b.berth_code,
            name: b.berth_name,
            status: b.status,
            max_length: b.max_vessel_length,
            max_draft: b.max_draft,
            current_vessel: b.current_vessel_name || "None",
            cranes: b.assigned_cranes.join(", "),
        },
        geometry: {
            type: "Polygon",
            coordinates: [b.polygon.concat([b.polygon[0]])],
        },
    })),
};

/**
 * Yard Blocks polygon GeoJSON (for 2.5D extrusion)
 */
export const YARDS_GEOJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: PORT_YARDS.map((y) => ({
        type: "Feature",
        properties: {
            id: y.id,
            code: y.yard_code,
            name: y.yard_name,
            cargo_type: y.cargo_type,
            capacity: y.total_capacity_teu,
            occupied: y.occupied_capacity_teu,
            utilization: y.utilization_pct,
            status: y.status,
            height: 12 + (y.stacking_tiers * 3), // For 2.5D extrusion height
        },
        geometry: {
            type: "Polygon",
            coordinates: [y.polygon.concat([y.polygon[0]])],
        },
    })),
};

/**
 * Anchorage Zones GeoJSON
 */
export const ANCHORAGES_GEOJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: PORT_ANCHORAGES.map((a) => ({
        type: "Feature",
        properties: {
            id: a.id,
            code: a.zone_code,
            name: a.zone_name,
            depth: a.water_depth_meters,
            capacity: a.max_capacity,
            current_count: a.current_vessels_count,
        },
        geometry: {
            type: "Polygon",
            coordinates: [a.polygon.concat([a.polygon[0]])],
        },
    })),
};

/**
 * Predefined Maritime Navigation Routes GeoJSON
 */
export const ROUTES_GEOJSON: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: PORT_ROUTES.map((r) => ({
        type: "Feature",
        properties: {
            route_id: r.id,
            name: r.name,
            category: r.category,
            color: r.color,
            speed_knots: r.speed_knots,
        },
        geometry: {
            type: "LineString",
            coordinates: r.waypoints,
        },
    })),
};