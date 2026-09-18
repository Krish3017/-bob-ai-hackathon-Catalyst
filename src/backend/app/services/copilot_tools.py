"""
NaviOps Copilot — Read-Only Tool Layer (Phase 2)

Each tool reads from the in-memory port_repo (backed by Supabase PostgreSQL)
through the same data-access path as existing API endpoints.

Rules:
- No writes of any kind.
- No SQL generation or execution.
- No arbitrary code execution.
- No exposure of passwords, hashes, tokens, or internal credentials.
- All tools are explicitly named — unknown tool names are rejected upstream.
- Arguments are validated before execution.
- Empty results are returned as structured JSON, never as errors.
"""
import logging
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.core.database import port_repo
from app.congestion.calculator import calculate_port_congestion
from app.models.schemas import UserResponse

logger = logging.getLogger("naviops.copilot.tools")

# ---------------------------------------------------------------------------
# Allowed tool name registry  (single source of truth for the allowlist)
# ---------------------------------------------------------------------------
ALLOWED_TOOLS = {
    "get_dashboard_summary",
    "get_congestion_status",
    "get_waiting_vessels",
    "get_vessels",
    "get_berths",
    "get_cranes",
    "get_yard_capacity",
    "get_active_disruptions",
    "get_latest_optimization_plan",
    "simulate_scenario",
}

# ---------------------------------------------------------------------------
# Groq tool definitions  (sent to the LLM as the tools= parameter)
# ---------------------------------------------------------------------------
TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "get_dashboard_summary",
            "description": (
                "Retrieve the current high-level NaviOps port operations summary. "
                "Returns the congestion score, severity level, key KPIs (active vessels, "
                "berth/crane/yard utilization rates, estimated delay hours), and the count "
                "of active disruptions. Use this when the user asks about overall port status, "
                "KPIs, or a general operational overview."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_congestion_status",
            "description": (
                "Retrieve the current Port Congestion Index with full factor breakdown. "
                "Returns the numeric score (0–100), severity level (Low/Moderate/High/Critical), "
                "and the six contributing factors: anchorage queue ratio, berth saturation, "
                "crane fleet saturation, yard capacity stress, average delay burden, and active "
                "disruption penalty. Use this when the user asks why congestion is high, what is "
                "causing delays, or requests a congestion explanation."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_waiting_vessels",
            "description": (
                "Retrieve vessels currently waiting at anchorage (status='Waiting'). "
                "Returns vessel name, shipping line, cargo type, cargo volume, vessel length, "
                "priority tier, expected waiting time in hours, and ETA. Results are sorted by "
                "longest waiting time first. Use this when the user asks which vessels are "
                "waiting, which are delayed, or which should be prioritized."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of vessels to return (1–100). Default is 100.",
                        "minimum": 1,
                        "maximum": 100,
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_vessels",
            "description": (
                "Retrieve the full operational vessel list with status and scheduling details. "
                "Returns name, shipping line, cargo type, cargo volume, vessel length, priority, "
                "status, ETA, ETD, expected waiting time, and assigned berth (if any). "
                "Supports optional status filter. Use this when the user asks about all vessels, "
                "inbound vessels, or vessel details."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "status_filter": {
                        "type": "string",
                        "description": (
                            "Optional status to filter by. One of: "
                            "Scheduled, Arrived, Waiting, Berthing, Loading, Unloading, Completed, Delayed"
                        ),
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of vessels to return (1–100). Default is 100.",
                        "minimum": 1,
                        "maximum": 100,
                    },
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_berths",
            "description": (
                "Retrieve current berth status and availability. Returns berth code, name, "
                "maximum vessel length, status (Available/Occupied/Maintenance/Unavailable), "
                "and next available time. Use this when the user asks about berth availability, "
                "which berths are occupied, or which berths could accept a specific vessel."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_cranes",
            "description": (
                "Retrieve current crane status and assignments. Returns crane code, name, "
                "rated capacity (moves/hour), operational status (Available/Busy/Maintenance/Failed), "
                "assigned berth, and availability time. Use this when the user asks about crane "
                "availability, failures, throughput capacity, or quay crane operations."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_yard_capacity",
            "description": (
                "Retrieve yard zone capacity and utilization figures. Returns yard code, name, "
                "cargo type, total capacity (TEU/units), occupied capacity, utilization percentage, "
                "remaining capacity, and status. Use this when the user asks about yard congestion, "
                "storage capacity, or container stacking utilization."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_active_disruptions",
            "description": (
                "Retrieve all currently active operational disruptions. Returns disruption type, "
                "title, description, affected resource type and code, severity level "
                "(Low/Medium/High/Critical), start time, expected end time, and status. "
                "Use this when the user asks about current incidents, equipment failures, "
                "weather restrictions, or anything impacting port operations."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_latest_optimization_plan",
            "description": (
                "Retrieve the most recently generated 72-hour CP-SAT optimization plan. "
                "Returns the solver status, objective value, total waiting time, total delay, "
                "whether the plan has been applied, and a schedule summary (vessel assignments, "
                "berth codes, planned times, crane assignments, waiting times, and assignment rationale). "
                "Use this when the user asks about the optimization plan, vessel scheduling, "
                "berth assignments, or schedule rationale."
            ),
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "simulate_scenario",
            "description": (
                "Run an operational What-If simulation (Port Digital Twin) without modifying live data. "
                "Simulates the impact of unavailable berths, offline cranes, or vessel arrival delays on "
                "cumulative waiting time, financial demurrage cost ($), and the Port Congestion Index. "
                "Use this when the user asks 'What if Berth 1 is closed?', 'What happens if Crane 2 breaks down?', "
                "or asks to simulate an operational scenario."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "scenario_name": {
                        "type": "string",
                        "description": "Short descriptive name of the simulation scenario."
                    },
                    "unavailable_berth_codes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of berth codes to simulate as unavailable (e.g. ['B-01', 'B-02'])."
                    },
                    "unavailable_crane_codes": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of crane codes to simulate as failed (e.g. ['CR-01', 'CR-02'])."
                    }
                },
                "required": []
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Internal helper: safe ISO timestamp
# ---------------------------------------------------------------------------
def _iso(dt: Any) -> Optional[str]:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.isoformat()
    return str(dt)


# ---------------------------------------------------------------------------
# Tool executor
# ---------------------------------------------------------------------------
def execute_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    current_user: UserResponse,
) -> Dict[str, Any]:
    """
    Validate, authorize, and execute a named read-only Copilot tool.

    Returns a JSON-serializable dict. Never raises — errors are returned as
    structured tool results so Groq can explain them to the user.
    """
    start = time.monotonic()

    # --- Allowlist check ---
    if tool_name not in ALLOWED_TOOLS:
        logger.warning(
            "Copilot tool rejected (not in allowlist): %s | user=%s",
            tool_name, current_user.email,
        )
        return {
            "status": "error",
            "error": f"Tool '{tool_name}' is not available.",
            "result_count": 0,
        }

    # --- RBAC: all authenticated roles may read operational data ---
    # (No admin-only tools in this read-only phase)

    try:
        result = _dispatch(tool_name, arguments)
        duration_ms = round((time.monotonic() - start) * 1000)
        logger.info(
            "Copilot tool executed: %s | user=%s | role=%s | duration_ms=%d | result_count=%s",
            tool_name,
            current_user.email,
            current_user.role,
            duration_ms,
            result.get("result_count", "?"),
        )
        return result
    except Exception as exc:
        duration_ms = round((time.monotonic() - start) * 1000)
        logger.error(
            "Copilot tool error: %s | user=%s | error_type=%s | duration_ms=%d",
            tool_name,
            current_user.email,
            type(exc).__name__,
            duration_ms,
        )
        return {
            "status": "error",
            "error": "The requested data is temporarily unavailable. Please try again.",
            "result_count": 0,
        }


def _dispatch(tool_name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """Route to the correct tool implementation."""
    if tool_name == "get_dashboard_summary":
        return _get_dashboard_summary()
    if tool_name == "get_congestion_status":
        return _get_congestion_status()
    if tool_name == "get_waiting_vessels":
        limit = _safe_int(args.get("limit"), default=100, min_val=1, max_val=100)
        return _get_waiting_vessels(limit=limit)
    if tool_name == "get_vessels":
        limit = _safe_int(args.get("limit"), default=100, min_val=1, max_val=100)
        status_filter = _safe_str(args.get("status_filter"))
        return _get_vessels(status_filter=status_filter, limit=limit)
    if tool_name == "get_berths":
        return _get_berths()
    if tool_name == "get_cranes":
        return _get_cranes()
    if tool_name == "get_yard_capacity":
        return _get_yard_capacity()
    if tool_name == "get_active_disruptions":
        return _get_active_disruptions()
    if tool_name == "get_latest_optimization_plan":
        return _get_latest_optimization_plan()
    if tool_name == "simulate_scenario":
        return _simulate_scenario(args)
    # Unreachable — allowlist catches unknowns before dispatch
    raise ValueError(f"Unhandled tool: {tool_name}")


# ---------------------------------------------------------------------------
# Argument sanitizers
# ---------------------------------------------------------------------------
def _safe_int(val: Any, default: int, min_val: int, max_val: int) -> int:
    try:
        v = int(val)
        return max(min_val, min(max_val, v))
    except (TypeError, ValueError):
        return default


def _safe_str(val: Any) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    return s if s else None


# ---------------------------------------------------------------------------
# Tool implementations
# ---------------------------------------------------------------------------

def _get_dashboard_summary() -> Dict[str, Any]:
    vessels = list(port_repo.vessels.values())
    berths = list(port_repo.berths.values())
    cranes = list(port_repo.cranes.values())
    yards = list(port_repo.yards.values())
    disruptions = list(port_repo.disruptions.values())

    congestion = calculate_port_congestion(vessels, berths, cranes, yards, disruptions)

    active_vessels = [v for v in vessels if v.get("status") != "Completed"]
    waiting_vessels = [v for v in active_vessels if v.get("status") == "Waiting"]
    occupied_berths = len([b for b in berths if b.get("status") == "Occupied"])
    total_berths = len(berths)
    busy_cranes = len([c for c in cranes if c.get("status") == "Busy"])
    total_cranes = len(cranes)
    total_yard_cap = sum(y.get("total_capacity", 0) for y in yards)
    total_yard_occ = sum(y.get("occupied_capacity", 0) for y in yards)
    active_disruptions = [d for d in disruptions if d.get("status") == "Active"]

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(congestion.calculated_at),
        "result_count": 1,
        "congestion_score": congestion.score,
        "congestion_level": congestion.level,
        "congestion_explanation": congestion.explanation,
        "active_vessels": len(active_vessels),
        "waiting_vessels_at_anchorage": len(waiting_vessels),
        "berths_occupied": occupied_berths,
        "berths_total": total_berths,
        "berths_available": len([b for b in berths if b.get("status") == "Available"]),
        "cranes_busy": busy_cranes,
        "cranes_total": total_cranes,
        "cranes_failed_or_maintenance": len([c for c in cranes if c.get("status") in ("Failed", "Maintenance")]),
        "yard_utilization_pct": round((total_yard_occ / max(1, total_yard_cap)) * 100, 1),
        "active_disruptions_count": len(active_disruptions),
        "estimated_total_delay_hours": round(sum(v.get("expected_waiting_time", 0.0) for v in waiting_vessels), 1),
    }


def _get_congestion_status() -> Dict[str, Any]:
    vessels = list(port_repo.vessels.values())
    berths = list(port_repo.berths.values())
    cranes = list(port_repo.cranes.values())
    yards = list(port_repo.yards.values())
    disruptions = list(port_repo.disruptions.values())

    congestion = calculate_port_congestion(vessels, berths, cranes, yards, disruptions)

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(congestion.calculated_at),
        "result_count": 1,
        "score": congestion.score,
        "level": congestion.level,
        "explanation": congestion.explanation,
        "waiting_vessels_count": congestion.waiting_vessels_count,
        "avg_waiting_time_hours": congestion.avg_waiting_time_hours,
        "berth_utilization_pct": congestion.berth_utilization_pct,
        "crane_utilization_pct": congestion.crane_utilization_pct,
        "yard_utilization_pct": congestion.yard_utilization_pct,
        "active_disruptions_count": congestion.active_disruptions_count,
        "factors": [
            {
                "name": f.name,
                "weight": f.weight,
                "raw_value": f.raw_value,
                "score_contribution": f.score_contribution,
                "description": f.description,
            }
            for f in congestion.factors
        ],
    }


def _get_waiting_vessels(limit: int = 100) -> Dict[str, Any]:
    all_vessels = list(port_repo.vessels.values())
    waiting = [v for v in all_vessels if v.get("status") == "Waiting"]
    waiting.sort(key=lambda v: float(v.get("expected_waiting_time", 0.0)), reverse=True)
    waiting = waiting[:limit]

    result = []
    for v in waiting:
        result.append({
            "vessel_name": v.get("vessel_name"),
            "vessel_code": v.get("vessel_code"),
            "shipping_line": v.get("shipping_line"),
            "cargo_type": v.get("cargo_type"),
            "cargo_volume_teu": v.get("cargo_volume"),
            "vessel_length_m": v.get("vessel_length"),
            "priority": v.get("priority"),
            "status": v.get("status"),
            "expected_waiting_time_hours": v.get("expected_waiting_time", 0.0),
            "eta": _iso(v.get("eta")),
            "etd": _iso(v.get("etd")),
        })

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(datetime.now(timezone.utc)),
        "result_count": len(result),
        "vessels": result,
    }


_VALID_VESSEL_STATUSES = {
    "scheduled", "arrived", "waiting", "berthing",
    "loading", "unloading", "completed", "delayed",
}


def _get_vessels(status_filter: Optional[str] = None, limit: int = 100) -> Dict[str, Any]:
    all_vessels = list(port_repo.vessels.values())

    if status_filter:
        sf = status_filter.strip().lower()
        if sf not in _VALID_VESSEL_STATUSES:
            return {
                "status": "error",
                "error": f"Invalid status filter '{status_filter}'. Valid values: Scheduled, Arrived, Waiting, Berthing, Loading, Unloading, Completed, Delayed.",
                "result_count": 0,
                "vessels": [],
            }
        all_vessels = [v for v in all_vessels if v.get("status", "").lower() == sf]

    # Sort by ETA
    all_vessels.sort(key=lambda v: str(v.get("eta", "")))
    all_vessels = all_vessels[:limit]

    # Resolve berth code for assigned berths
    berth_lookup = {b["id"]: b.get("berth_code", "—") for b in port_repo.berths.values()}

    result = []
    for v in all_vessels:
        assigned_berth_id = v.get("assigned_berth_id")
        result.append({
            "vessel_name": v.get("vessel_name"),
            "vessel_code": v.get("vessel_code"),
            "shipping_line": v.get("shipping_line"),
            "cargo_type": v.get("cargo_type"),
            "cargo_volume_teu": v.get("cargo_volume"),
            "vessel_length_m": v.get("vessel_length"),
            "priority": v.get("priority"),
            "status": v.get("status"),
            "assigned_berth": berth_lookup.get(assigned_berth_id) if assigned_berth_id else None,
            "expected_waiting_time_hours": v.get("expected_waiting_time", 0.0),
            "eta": _iso(v.get("eta")),
            "etd": _iso(v.get("etd")),
        })

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(datetime.now(timezone.utc)),
        "result_count": len(result),
        "vessels": result,
    }


def _get_berths() -> Dict[str, Any]:
    berths = list(port_repo.berths.values())
    berths.sort(key=lambda b: b.get("berth_code", ""))

    # Resolve vessel names for occupied berths
    vessel_lookup = {v["id"]: v.get("vessel_name", "Unknown") for v in port_repo.vessels.values()}

    result = []
    for b in berths:
        cvid = b.get("current_vessel_id")
        result.append({
            "berth_code": b.get("berth_code"),
            "berth_name": b.get("berth_name"),
            "max_vessel_length_m": b.get("max_vessel_length"),
            "status": b.get("status"),
            "current_vessel": vessel_lookup.get(cvid) if cvid else None,
            "available_from": _iso(b.get("available_from")),
        })

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(datetime.now(timezone.utc)),
        "result_count": len(result),
        "berths": result,
    }


def _get_cranes() -> Dict[str, Any]:
    cranes = list(port_repo.cranes.values())
    cranes.sort(key=lambda c: c.get("crane_code", ""))

    # Resolve berth codes
    berth_lookup = {b["id"]: b.get("berth_code", "—") for b in port_repo.berths.values()}

    result = []
    for c in cranes:
        abid = c.get("assigned_berth_id")
        result.append({
            "crane_code": c.get("crane_code"),
            "crane_name": c.get("crane_name"),
            "capacity_moves_per_hour": c.get("capacity_per_hour"),
            "status": c.get("status"),
            "assigned_berth": berth_lookup.get(abid) if abid else None,
            "available_from": _iso(c.get("available_from")),
        })

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(datetime.now(timezone.utc)),
        "result_count": len(result),
        "cranes": result,
    }


def _get_yard_capacity() -> Dict[str, Any]:
    yards = list(port_repo.yards.values())
    yards.sort(key=lambda y: y.get("yard_code", ""))

    result = []
    for y in yards:
        total = y.get("total_capacity", 0)
        occupied = y.get("occupied_capacity", 0)
        remaining = max(0, total - occupied)
        util = round((occupied / max(1, total)) * 100.0, 1)
        result.append({
            "yard_code": y.get("yard_code"),
            "yard_name": y.get("yard_name"),
            "cargo_type": y.get("cargo_type"),
            "total_capacity": total,
            "occupied_capacity": occupied,
            "remaining_capacity": remaining,
            "utilization_pct": util,
            "status": y.get("status"),
            "last_updated": _iso(y.get("updated_at")),
        })

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(datetime.now(timezone.utc)),
        "result_count": len(result),
        "yards": result,
    }


def _get_active_disruptions() -> Dict[str, Any]:
    all_disruptions = list(port_repo.disruptions.values())
    active = [d for d in all_disruptions if d.get("status") == "Active"]
    active.sort(key=lambda d: str(d.get("start_time", "")))

    # Resolve resource names for affected resources
    resource_lookup: Dict[str, str] = {}
    for b in port_repo.berths.values():
        resource_lookup[b["id"]] = b.get("berth_code", b.get("berth_name", "Berth"))
    for c in port_repo.cranes.values():
        resource_lookup[c["id"]] = c.get("crane_code", c.get("crane_name", "Crane"))
    for v in port_repo.vessels.values():
        resource_lookup[v["id"]] = v.get("vessel_name", "Vessel")

    result = []
    for d in active:
        arid = d.get("affected_resource_id")
        result.append({
            "title": d.get("title"),
            "disruption_type": d.get("disruption_type"),
            "description": d.get("description"),
            "affected_resource_type": d.get("affected_resource_type"),
            "affected_resource": resource_lookup.get(arid) if arid else "Port-Wide",
            "severity": d.get("severity"),
            "status": d.get("status"),
            "start_time": _iso(d.get("start_time")),
            "expected_end_time": _iso(d.get("end_time")),
        })

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(datetime.now(timezone.utc)),
        "result_count": len(result),
        "disruptions": result,
    }


def _get_latest_optimization_plan() -> Dict[str, Any]:
    if not port_repo.optimization_runs:
        return {
            "status": "ok",
            "source": "naviops_live",
            "data_timestamp": _iso(datetime.now(timezone.utc)),
            "result_count": 0,
            "message": "No optimization plan has been generated yet. Use the Optimization page to run the CP-SAT solver.",
            "plan": None,
        }

    runs = list(port_repo.optimization_runs.values())
    runs.sort(key=lambda r: str(r.get("created_at", "")), reverse=True)
    latest = runs[0]

    # Build compact schedule summary (no raw IDs exposed unnecessarily)
    vessel_lookup = {v["id"]: v.get("vessel_name", "Unknown") for v in port_repo.vessels.values()}
    berth_lookup = {b["id"]: b.get("berth_code", "—") for b in port_repo.berths.values()}

    schedules_summary = []
    raw_schedules = latest.get("schedules", [])
    # Schedules may be ScheduleItemResponse objects or dicts depending on path
    for s in raw_schedules:
        if hasattr(s, "model_dump"):
            sd = s.model_dump()
        else:
            sd = dict(s)

        v_name = sd.get("vessel_name") or vessel_lookup.get(sd.get("vessel_id", ""), "Unknown")
        b_code = sd.get("berth_code") or berth_lookup.get(sd.get("berth_id", ""), "—")
        schedules_summary.append({
            "vessel_name": v_name,
            "berth_code": b_code,
            "planned_start": _iso(sd.get("planned_start")),
            "planned_end": _iso(sd.get("planned_end")),
            "duration_hours": sd.get("duration_hours"),
            "waiting_time_hours": sd.get("waiting_time"),
            "assigned_cranes": sd.get("assigned_cranes", []),
            "assignment_reason": sd.get("assignment_reason"),
        })

    metrics = latest.get("metrics") or {}

    return {
        "status": "ok",
        "source": "naviops_live",
        "data_timestamp": _iso(latest.get("created_at")),
        "result_count": len(schedules_summary),
        "plan": {
            "solver_status": latest.get("status"),
            "applied": latest.get("applied", False),
            "objective_value": latest.get("objective_value"),
            "total_waiting_time_hours": latest.get("total_waiting_time"),
            "total_delay_hours": latest.get("total_delay"),
            "planning_horizon_start": _iso(latest.get("planning_horizon_start")),
            "planning_horizon_end": _iso(latest.get("planning_horizon_end")),
            "metrics": {
                "vessels_scheduled": metrics.get("vessels_scheduled"),
                "avg_waiting_hours": metrics.get("avg_waiting_hours"),
                "berth_occupancy_ratio": metrics.get("berth_occupancy_ratio"),
                "crane_utilization_ratio": metrics.get("crane_utilization_ratio"),
                "delay_reduction_pct": metrics.get("delay_reduction_pct"),
            },
            "schedule": schedules_summary,
        },
    }


def _simulate_scenario(args: Dict[str, Any]) -> Dict[str, Any]:
    """Run counterfactual What-If optimization simulation."""
    from app.optimization.optimizer import PortOptimizer

    scenario_name = str(args.get("scenario_name") or "What-If Simulation")
    raw_berths = args.get("unavailable_berth_codes") or []
    raw_cranes = args.get("unavailable_crane_codes") or []

    unavail_berth_codes = [str(c).upper().strip() for c in raw_berths if c]
    unavail_crane_codes = [str(c).upper().strip() for c in raw_cranes if c]

    # Resolve IDs
    unavail_berth_ids = [
        b["id"] for b in port_repo.berths.values()
        if b.get("berth_code", "").upper() in unavail_berth_codes
    ]
    unavail_crane_ids = [
        c["id"] for c in port_repo.cranes.values()
        if c.get("crane_code", "").upper() in unavail_crane_codes
    ]

    # Baseline
    baseline_opt = PortOptimizer(
        vessels=list(port_repo.vessels.values()),
        berths=list(port_repo.berths.values()),
        cranes=list(port_repo.cranes.values()),
        disruptions=list(port_repo.disruptions.values()),
        horizon_hours=72
    )
    base_run = baseline_opt.solve()
    base_wait = float(base_run.get("total_waiting_time", 0.0))
    base_demurrage = float(base_run.get("metrics", {}).get("demurrage_cost_usd", 0.0))

    # Simulated
    sim_opt = PortOptimizer(
        vessels=list(port_repo.vessels.values()),
        berths=list(port_repo.berths.values()),
        cranes=list(port_repo.cranes.values()),
        disruptions=list(port_repo.disruptions.values()),
        horizon_hours=72,
        simulation_overrides={
            "unavailable_berth_ids": unavail_berth_ids,
            "unavailable_crane_ids": unavail_crane_ids
        }
    )
    sim_run = sim_opt.solve()
    sim_wait = float(sim_run.get("total_waiting_time", 0.0))
    sim_demurrage = float(sim_run.get("metrics", {}).get("demurrage_cost_usd", 0.0))

    wait_delta = round(sim_wait - base_wait, 1)
    demurrage_delta = round(sim_demurrage - base_demurrage, 2)

    return {
        "status": "ok",
        "source": "naviops_simulator",
        "data_timestamp": _iso(datetime.now(timezone.utc)),
        "result_count": 1,
        "simulation": {
            "scenario_name": scenario_name,
            "simulated_unavailable_berths": unavail_berth_codes,
            "simulated_unavailable_cranes": unavail_crane_codes,
            "baseline_waiting_hours": base_wait,
            "simulated_waiting_hours": sim_wait,
            "waiting_time_delta_hours": wait_delta,
            "demurrage_delta_usd": demurrage_delta,
            "summary": (
                f"Simulating scenario '{scenario_name}' causes a {wait_delta:+.1f}h shift "
                f"in vessel waiting time with ${demurrage_delta:+,.0f} demurrage exposure delta."
            )
        }
    }

