from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.core.database import port_repo
from app.core.auth import get_current_user, require_role
from app.models.schemas import YardUpdate, YardResponse, UserResponse

router = APIRouter(prefix="/api/yards", tags=["Yards"])


@router.get("", response_model=List[YardResponse])
def get_all_yards(current_user: UserResponse = Depends(get_current_user)):
    """List all yard storage zones and container capacity metrics"""
    yards = list(port_repo.yards.values())
    yards.sort(key=lambda y: y.get("yard_code", ""))
    return [YardResponse(**y) for y in yards]


@router.put("/{yard_id}", response_model=YardResponse)
def update_yard(
    yard_id: str,
    payload: YardUpdate,
    current_user: UserResponse = Depends(require_role(["admin", "operations"]))
):
    """Update yard occupied capacity or congestion status (Operations & Admin)"""
    if yard_id not in port_repo.yards:
        raise HTTPException(status_code=404, detail="Yard zone not found")

    yard = port_repo.yards[yard_id]
    update_data = payload.model_dump(exclude_unset=True)

    if "occupied_capacity" in update_data:
        occ = update_data["occupied_capacity"]
        total = yard.get("total_capacity", 1)
        yard["occupied_capacity"] = occ
        yard["utilization_percentage"] = round((occ / total) * 100.0, 2)
        if yard["utilization_percentage"] >= 90:
            yard["status"] = "Congested"
        elif yard["utilization_percentage"] >= 80:
            yard["status"] = "Near Capacity"
        else:
            yard["status"] = "Normal"

    if "yard_name" in update_data:
        yard["yard_name"] = update_data["yard_name"]
    if "status" in update_data:
        yard["status"] = update_data["status"]

    yard["updated_at"] = datetime.now(timezone.utc)
    port_repo.yards[yard_id] = yard
    return YardResponse(**yard)
