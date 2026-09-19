export type UserRole = "admin" | "operations" | "viewer";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department?: string;
  created_at?: string;
}

export interface Berth {
  id: string;
  berth_code: string;
  berth_name: string;
  max_vessel_length: number;
  status: "Available" | "Occupied" | "Maintenance" | "Unavailable";
  current_vessel_id?: string | null;
  available_from?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Crane {
  id: string;
  crane_code: string;
  crane_name: string;
  capacity_per_hour: number;
  status: "Available" | "Busy" | "Maintenance" | "Failed";
  current_vessel_id?: string | null;
  assigned_berth_id?: string | null;
  available_from?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vessel {
  id: string;
  vessel_code: string;
  vessel_name: string;
  shipping_line: string;
  cargo_type: string;
  cargo_volume: number;
  vessel_length: number;
  arrival_time?: string | null;
  eta: string;
  etd: string;
  priority: number; // 1 to 4
  status: "Scheduled" | "Arrived" | "Waiting" | "Berthing" | "Loading" | "Unloading" | "Completed" | "Delayed";
  assigned_berth_id?: string | null;
  expected_waiting_time: number;
  created_at?: string;
  updated_at?: string;
}

export interface Yard {
  id: string;
  yard_code: string;
  yard_name: string;
  cargo_type: string;
  total_capacity: number;
  occupied_capacity: number;
  utilization_percentage: number;
  status: "Normal" | "Congested" | "Near Capacity" | "Maintenance";
  updated_at?: string;
}

export interface Disruption {
  id: string;
  disruption_type: string;
  title: string;
  description?: string;
  affected_resource_type: "vessel" | "berth" | "crane" | "yard" | "port";
  affected_resource_id?: string | null;
  severity: "Low" | "Medium" | "High" | "Critical";
  start_time: string;
  end_time?: string | null;
  status: "Active" | "Resolved" | "Mitigated";
  created_at?: string;
}

export interface CongestionFactor {
  name: string;
  weight: number;
  raw_value: number;
  score_contribution: number;
  description: string;
}

export interface CongestionData {
  score: number;
  level: "Low" | "Moderate" | "High" | "Critical";
  color: string;
  explanation: string;
  factors: CongestionFactor[];
  active_disruptions_count: number;
  waiting_vessels_count: number;
  avg_waiting_time_hours: number;
  berth_utilization_pct: number;
  crane_utilization_pct: number;
  yard_utilization_pct: number;
  calculated_at: string;
}

export interface DashboardSummary {
  congestion: CongestionData;
  metrics: Record<string, any>;
  active_vessels_count: number;
  total_berths: number;
  occupied_berths: number;
  available_berths: number;
  total_cranes: number;
  operational_cranes: number;
  failed_cranes: number;
  total_yard_capacity: number;
  total_occupied_yard: number;
  overall_yard_utilization: number;
  active_disruptions: Disruption[];
}

export interface ScheduleItem {
  id: string;
  optimization_run_id: string;
  vessel_id: string;
  vessel_code: string;
  vessel_name: string;
  berth_id: string;
  berth_code: string;
  berth_name: string;
  planned_start: string;
  planned_end: string;
  duration_hours: number;
  waiting_time: number;
  assigned_cranes: string[];
  assignment_reason: string;
  status: string;
}

export interface OptimizationRun {
  id: string;
  planning_horizon_start: string;
  planning_horizon_end: string;
  objective_value: number;
  total_waiting_time: number;
  total_delay: number;
  status: string;
  applied: boolean;
  schedules: ScheduleItem[];
  metrics: {
    vessels_scheduled: number;
    avg_waiting_hours: number;
    berth_occupancy_ratio: number;
    crane_utilization_ratio: number;
    delay_reduction_pct: number;
    demurrage_cost_usd?: number;
    demurrage_saved_usd?: number;
    co2_emissions_mt?: number;
    co2_abated_mt?: number;
  };
  created_at: string;
}

export interface SimulateOptimizationRequest {
  scenario_name?: string;
  unavailable_berth_ids?: string[];
  unavailable_crane_ids?: string[];
  unavailable_yard_ids?: string[];
  vessel_delay_hours?: Record<string, number>;
}

export interface SimulationResponse {
  scenario_name: string;
  baseline_metrics: Record<string, any>;
  simulated_metrics: Record<string, any>;
  deltas: {
    waiting_time_delta_hours: number;
    demurrage_delta_usd: number;
    co2_delta_mt: number;
    congestion_score_delta: number;
  };
  simulated_schedules: ScheduleItem[];
  summary: string;
}

export interface SentinelAlertItem {
  id: string;
  disruption_title: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  affected_resource: string;
  at_risk_vessels: string[];
  estimated_risk_usd: number;
  recommended_action: string;
}

export interface SentinelAlertResponse {
  has_threat: boolean;
  active_alerts: SentinelAlertItem[];
  total_risk_exposure_usd: number;
  total_at_risk_vessels: number;
  recommended_action: string;
  runbook_plan_ready: boolean;
}

export interface PortTwinApiBerth extends Berth {
  current_vessel_name?: string | null;
  assigned_cranes?: string[];
}

export interface PortTwinApiCrane extends Crane {
  assigned_berth_code?: string | null;
}

export interface PortTwinApiVessel extends Vessel {
  assigned_berth_code?: string | null;
}

export interface PortTwinApiResponse {
  vessels: PortTwinApiVessel[];
  berths: PortTwinApiBerth[];
  cranes: PortTwinApiCrane[];
  yards: Yard[];
  disruptions: Disruption[];
  server_time: string;
}

