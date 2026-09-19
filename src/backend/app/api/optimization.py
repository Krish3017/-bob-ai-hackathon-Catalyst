from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict, Any
from app.core.database import port_repo
from app.core.auth import get_current_user, require_role
from app.optimization.optimizer import PortOptimizer, run_whatif_simulation
from app.models.schemas import (
    OptimizationRunResponse,
    ScheduleItemResponse,
    ApplyScheduleRequest,
    UserResponse,
    SimulateOptimizationRequest,
    SimulationResponse
)

router = APIRouter(prefix="/api/optimization", tags=["Optimization Engine"])


def _execute_and_store_optimization() -> Dict[str, Any]:
    """
    Shared helper: instantiate the CP-SAT optimizer, solve, persist results,
    and return the run record dict. Called by both POST /run and the frontend
    preload path. Extracted to eliminate code duplication.
    """
    optimizer = PortOptimizer(
        vessels=list(port_repo.vessels.values()),
        berths=list(port_repo.berths.values()),
        cranes=list(port_repo.cranes.values()),
        disruptions=list(port_repo.disruptions.values()),
        horizon_hours=72
    )
    run_result = optimizer.solve()
    run_id = run_result["id"]

    port_repo.optimization_runs[run_id] = run_result

    schedules_data = []
    for item in run_result["schedules"]:
        item_dict = item.model_dump()
        dict.__setitem__(port_repo.schedules, item.id, item_dict)
        schedules_data.append(item_dict)
    port_repo.persist_items_batch("schedules", schedules_data)

    return run_result


@router.post("/run", response_model=OptimizationRunResponse, status_code=status.HTTP_201_CREATED)
def trigger_optimization_run(
    current_user: UserResponse = Depends(require_role(["admin", "operations"]))
):
    """
    Execute Google OR-Tools CP-SAT optimization engine for next 72 hours.
    Calculates non-overlapping berth assignments, crane allocations, and minimizes delays.
    """
    run_result = _execute_and_store_optimization()
    return OptimizationRunResponse(**run_result)


@router.get("/runs", response_model=List[OptimizationRunResponse])
def list_optimization_runs(current_user: UserResponse = Depends(get_current_user)):
    """List historical optimization runs and objective metrics"""
    runs = list(port_repo.optimization_runs.values())
    runs.sort(key=lambda r: str(r.get("created_at", "")), reverse=True)
    return [OptimizationRunResponse(**r) for r in runs]


@router.get("/runs/latest", response_model=OptimizationRunResponse)
def get_latest_optimization_run(current_user: UserResponse = Depends(get_current_user)):
    """
    Retrieve the most recent optimization plan.
    Returns 404 if no runs exist — use POST /run to generate one.
    (Side-effect-free: GET endpoints must not mutate state or trigger computation.)
    """
    if not port_repo.optimization_runs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No optimization runs found. POST to /api/optimization/run to generate a plan."
        )
    runs = list(port_repo.optimization_runs.values())
    runs.sort(key=lambda r: str(r.get("created_at", "")), reverse=True)
    return OptimizationRunResponse(**runs[0])


@router.get("/runs/{run_id}", response_model=OptimizationRunResponse)
def get_optimization_run(
    run_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve specific optimization run details"""
    if run_id not in port_repo.optimization_runs:
        raise HTTPException(status_code=404, detail="Optimization run not found")
    return OptimizationRunResponse(**port_repo.optimization_runs[run_id])


@router.get("/schedule/{run_id}", response_model=List[ScheduleItemResponse])
def get_run_schedule(
    run_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve 72-hour schedule items for a given optimization run"""
    if run_id not in port_repo.optimization_runs:
        raise HTTPException(status_code=404, detail="Optimization run not found")
    return port_repo.optimization_runs[run_id]["schedules"]


@router.post("/apply", response_model=Dict[str, Any])
def apply_optimization_schedule(
    req: ApplyScheduleRequest,
    current_user: UserResponse = Depends(require_role(["admin"]))
):
    """
    Approve & Apply recommended 72-hour schedule (Port Manager / Admin only).
    Updates assigned berths on affected vessels and persists state.
    """
    if req.run_id not in port_repo.optimization_runs:
        raise HTTPException(status_code=404, detail="Optimization run not found")

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    run_record = dict(port_repo.optimization_runs[req.run_id])
    schedules = run_record.get("schedules", [])

    applied_count = 0
    for sched in schedules:
        v_id = sched.vessel_id if hasattr(sched, "vessel_id") else sched.get("vessel_id")
        b_id = sched.berth_id if hasattr(sched, "berth_id") else sched.get("berth_id")
        w_time = sched.waiting_time if hasattr(sched, "waiting_time") else sched.get("waiting_time", 0.0)

        if v_id and v_id in port_repo.vessels:
            vessel = dict(port_repo.vessels[v_id])
            vessel["assigned_berth_id"] = b_id
            vessel["expected_waiting_time"] = float(w_time)
            vessel["updated_at"] = now
            port_repo.vessels[v_id] = vessel
            applied_count += 1

    run_record["applied"] = True
    run_record["applied_by"] = current_user.id
    port_repo.optimization_runs[req.run_id] = run_record

    return {
        "status": "success",
        "message": f"Successfully applied schedule plan to {applied_count} vessels.",
        "run_id": req.run_id
    }


@router.post("/simulate", response_model=SimulationResponse)
def simulate_optimization(
    req: SimulateOptimizationRequest,
    current_user: UserResponse = Depends(get_current_user)
):
    """
    What-If Scenario Sandbox (Port Digital Twin).
    Simulates operational conditions (disabled berths/cranes, vessel delays)
    and computes the counterfactual 72-hour CP-SAT schedule and deltas
    without mutating live port state.
    """
    sim_data = run_whatif_simulation(
        scenario_name=req.scenario_name or "Custom What-If Scenario",
        unavailable_berth_ids=req.unavailable_berth_ids or [],
        unavailable_crane_ids=req.unavailable_crane_ids or [],
        vessel_delay_hours=req.vessel_delay_hours or {},
    )
    return SimulationResponse(
        simulation_id=sim_data.get("simulation_id"),
        scenario_name=sim_data["scenario_name"],
        baseline_metrics=sim_data["baseline_metrics"],
        simulated_metrics=sim_data["simulated_metrics"],
        deltas=sim_data["deltas"],
        simulated_schedules=sim_data["simulated_schedules"],
        summary=sim_data["summary"],
        bottlenecks=sim_data.get("bottlenecks"),
        recommendations=sim_data.get("recommendations"),
    )

