from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Header, Depends
from pydantic import BaseModel

from app.core.database import port_repo
from app.core.auth import decode_access_token
from app.models.schemas import (
    BerthResponse,
    CraneResponse,
    VesselResponse,
    YardResponse,
    DisruptionResponse,
    UserResponse
)

router = APIRouter(prefix="/api/port-twin", tags=["Port Digital Twin"])


class PortTwinBerthItem(BerthResponse):
    current_vessel_name: Optional[str] = None
    assigned_cranes: List[str] = []


class PortTwinCraneItem(CraneResponse):
    assigned_berth_code: Optional[str] = None


class PortTwinVesselItem(VesselResponse):
    assigned_berth_code: Optional[str] = None


class PortTwinDataResponse(BaseModel):
    vessels: List[PortTwinVesselItem]
    berths: List[PortTwinBerthItem]
    cranes: List[PortTwinCraneItem]
    yards: List[YardResponse]
    disruptions: List[DisruptionResponse]
    server_time: datetime


def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[UserResponse]:
    """
    Validates token if provided, but does not block requests without token.
    Enables smooth real-time viewing of the digital twin with database persistence.
    """
    if not authorization:
        return None
    try:
        parts = authorization.strip().split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            payload = decode_access_token(parts[1])
            if payload and "sub" in payload:
                user_dict = port_repo.users.get(payload["sub"])
                if user_dict:
                    return UserResponse(**user_dict)
    except Exception:
        pass
    return None


@router.get("", response_model=PortTwinDataResponse)
def get_port_twin_data(current_user: Optional[UserResponse] = Depends(get_optional_current_user)):
    """
    Single consolidated operational telemetry endpoint for the 3D Port Digital Twin.
    Supplies live vessels, berths, cranes, yards, and disruptions sourced directly from the database repository.
    """
    now = datetime.now(timezone.utc)

    # 1. Fetch raw rows from database tables
    raw_berths = list(port_repo.berths.values())
    raw_cranes = list(port_repo.cranes.values())
    raw_vessels = list(port_repo.vessels.values())
    raw_yards = list(port_repo.yards.values())
    raw_disruptions = list(port_repo.disruptions.values())

    # Build fast lookup indexes
    berth_code_by_id: Dict[str, str] = {b["id"]: b.get("berth_code", "") for b in raw_berths}
    vessel_name_by_id: Dict[str, str] = {v["id"]: v.get("vessel_name", "") for v in raw_vessels}

    # Group assigned cranes by berth_id
    cranes_by_berth_id: Dict[str, List[str]] = {}
    for c in raw_cranes:
        b_id = c.get("assigned_berth_id")
        if b_id:
            cranes_by_berth_id.setdefault(b_id, []).append(c.get("crane_code", ""))

    # 2. Enrich Berths
    enriched_berths: List[PortTwinBerthItem] = []
    for b in raw_berths:
        v_id = b.get("current_vessel_id")
        v_name = vessel_name_by_id.get(v_id) if v_id else None
        assigned_cranes = sorted(cranes_by_berth_id.get(b["id"], []))
        enriched_berths.append(
            PortTwinBerthItem(
                **b,
                current_vessel_name=v_name,
                assigned_cranes=assigned_cranes
            )
        )
    enriched_berths.sort(key=lambda b: b.berth_code)

    # 3. Enrich Cranes
    enriched_cranes: List[PortTwinCraneItem] = []
    for c in raw_cranes:
        b_id = c.get("assigned_berth_id")
        b_code = berth_code_by_id.get(b_id) if b_id else None
        enriched_cranes.append(
            PortTwinCraneItem(
                **c,
                assigned_berth_code=b_code
            )
        )
    enriched_cranes.sort(key=lambda c: c.crane_code)

    # 4. Enrich Vessels
    enriched_vessels: List[PortTwinVesselItem] = []
    for v in raw_vessels:
        b_id = v.get("assigned_berth_id")
        b_code = berth_code_by_id.get(b_id) if b_id else None
        enriched_vessels.append(
            PortTwinVesselItem(
                **v,
                assigned_berth_code=b_code
            )
        )
    # Sort: active / working first, then by ETA
    enriched_vessels.sort(key=lambda v: (0 if v.status in ["Working", "Loading", "Unloading", "Berthing"] else 1, str(v.eta)))

    # 5. Yards with guaranteed utilization percentage
    processed_yards: List[YardResponse] = []
    for y in raw_yards:
        y_data = dict(y)
        if "utilization_percentage" not in y_data or y_data["utilization_percentage"] is None:
            tot = max(1, y_data.get("total_capacity", 1))
            occ = y_data.get("occupied_capacity", 0)
            y_data["utilization_percentage"] = round((occ / tot) * 100.0, 2)
        processed_yards.append(YardResponse(**y_data))
    processed_yards.sort(key=lambda y: y.yard_code)

    # 6. Disruptions
    processed_disruptions: List[DisruptionResponse] = [
        DisruptionResponse(**d) for d in raw_disruptions if d.get("status") == "Active"
    ]
    processed_disruptions.sort(key=lambda d: str(d.start_time or ""), reverse=True)

    return PortTwinDataResponse(
        vessels=enriched_vessels,
        berths=enriched_berths,
        cranes=enriched_cranes,
        yards=processed_yards,
        disruptions=processed_disruptions,
        server_time=now
    )
