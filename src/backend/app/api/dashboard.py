from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.core.database import port_repo
from app.core.auth import get_current_user, require_role
from app.congestion.calculator import calculate_port_congestion
from app.models.schemas import DashboardSummaryResponse, CongestionResponse, DisruptionResponse, UserResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard & Analytics"])


@router.get("/congestion", response_model=CongestionResponse)
def get_congestion_score(current_user: UserResponse = Depends(get_current_user)):
    """Calculate and return real-time Port Congestion Index (0-100) with explainable factors"""
    return calculate_port_congestion(
        vessels=list(port_repo.vessels.values()),
        berths=list(port_repo.berths.values()),
        cranes=list(port_repo.cranes.values()),
        yards=list(port_repo.yards.values()),
        disruptions=list(port_repo.disruptions.values())
    )


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(current_user: UserResponse = Depends(get_current_user)):
    """Comprehensive port overview metrics and KPI aggregations"""
    vessels = list(port_repo.vessels.values())
    berths = list(port_repo.berths.values())
    cranes = list(port_repo.cranes.values())
    yards = list(port_repo.yards.values())
    disruptions = list(port_repo.disruptions.values())

    congestion = calculate_port_congestion(vessels, berths, cranes, yards, disruptions)

    active_vessels = [v for v in vessels if v.get("status") != "Completed"]
    waiting_vessels = [v for v in active_vessels if v.get("status") == "Waiting"]
    berthing_vessels = [v for v in active_vessels if v.get("status") in ["Berthing", "Loading", "Unloading"]]

    total_berths = len(berths)
    occupied_berths = len([b for b in berths if b.get("status") == "Occupied"])
    available_berths = len([b for b in berths if b.get("status") == "Available"])

    total_cranes = len(cranes)
    busy_cranes = len([c for c in cranes if c.get("status") == "Busy"])
    avail_cranes = len([c for c in cranes if c.get("status") == "Available"])
    failed_cranes = len([c for c in cranes if c.get("status") == "Failed"])
    maint_cranes = len([c for c in cranes if c.get("status") == "Maintenance"])

    total_yard_cap = sum(y.get("total_capacity") or 0 for y in yards)
    total_yard_occ = sum(y.get("occupied_capacity") or 0 for y in yards)
    overall_yard_util = round((total_yard_occ / max(1, total_yard_cap)) * 100.0, 1)

    active_disruptions = [DisruptionResponse(**d) for d in disruptions if d.get("status") == "Active"]

    metrics = {
        "active_vessels_total": len(active_vessels),
        "waiting_at_anchorage": len(waiting_vessels),
        "alongside_berths": len(berthing_vessels),
        "berth_utilization_rate": round((occupied_berths / max(1, total_berths)) * 100.0, 1),
        "crane_utilization_rate": round((busy_cranes / max(1, total_cranes - failed_cranes - maint_cranes)) * 100.0, 1) if (total_cranes - failed_cranes - maint_cranes) > 0 else 0.0,
        "yard_utilization_rate": overall_yard_util,
        "estimated_total_delay_hours": round(sum((v.get("expected_waiting_time") or 0.0) for v in waiting_vessels), 1),
        "vessels_inbound_24h": len([v for v in active_vessels if v.get("status") in ["Scheduled", "Delayed"]])
    }

    return DashboardSummaryResponse(
        congestion=congestion,
        metrics=metrics,
        active_vessels_count=len(active_vessels),
        total_berths=total_berths,
        occupied_berths=occupied_berths,
        available_berths=available_berths,
        total_cranes=total_cranes,
        operational_cranes=avail_cranes + busy_cranes,
        failed_cranes=failed_cranes + maint_cranes,
        total_yard_capacity=total_yard_cap,
        total_occupied_yard=total_yard_occ,
        overall_yard_utilization=overall_yard_util,
        active_disruptions=active_disruptions
    )


@router.post("/reset-demo", response_model=Dict[str, Any])
def reset_demo_data(current_user: UserResponse = Depends(require_role(["admin", "operations"]))):
    """Reset operational database back to pristine initial synthetic state"""
    port_repo.reset_all_data()
    return {"status": "success", "message": "Demo data restored to initial state."}
