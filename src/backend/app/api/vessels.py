import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.database import port_repo
from app.core.auth import get_current_user, require_role
from app.models.schemas import VesselCreate, VesselUpdate, VesselResponse, UserResponse

router = APIRouter(prefix="/api/vessels", tags=["Vessels"])


@router.get("", response_model=List[VesselResponse])
def get_all_vessels(
    status: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user)
):
    """List all vessels with optional status filter"""
    vessels = list(port_repo.vessels.values())
    if status:
        vessels = [v for v in vessels if v.get("status", "").lower() == status.lower()]
    # Sort by ETA
    vessels.sort(key=lambda v: str(v.get("eta", "")))
    return [VesselResponse(**v) for v in vessels]


@router.get("/{vessel_id}", response_model=VesselResponse)
def get_vessel(
    vessel_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve single vessel details"""
    if vessel_id not in port_repo.vessels:
        raise HTTPException(status_code=404, detail="Vessel not found")
    return VesselResponse(**port_repo.vessels[vessel_id])


@router.post("", response_model=VesselResponse, status_code=status.HTTP_201_CREATED)
def create_vessel(
    payload: VesselCreate,
    current_user: UserResponse = Depends(require_role(["admin", "operations"]))
):
    """Register incoming or scheduled vessel (Operations & Admin)"""
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    vessel_data = payload.model_dump()
    vessel_data.update({
        "id": new_id,
        "created_at": now,
        "updated_at": now
    })
    port_repo.vessels[new_id] = vessel_data
    return VesselResponse(**vessel_data)


@router.put("/{vessel_id}", response_model=VesselResponse)
def update_vessel(
    vessel_id: str,
    payload: VesselUpdate,
    current_user: UserResponse = Depends(require_role(["admin", "operations"]))
):
    """Update vessel operational status, ETA/ETD, or berth assignment"""
    if vessel_id not in port_repo.vessels:
        raise HTTPException(status_code=404, detail="Vessel not found")

    vessel = port_repo.vessels[vessel_id]
    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    vessel.update(update_data)
    port_repo.vessels[vessel_id] = vessel
    return VesselResponse(**vessel)


@router.delete("/{vessel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vessel(
    vessel_id: str,
    current_user: UserResponse = Depends(require_role(["admin"]))
):
    """Delete a vessel record (Admin only), releasing any berth or crane occupied by it"""
    if vessel_id not in port_repo.vessels:
        raise HTTPException(status_code=404, detail="Vessel not found")

    # Release any berths occupied by this vessel
    for b in list(port_repo.berths.values()):
        if b.get("current_vessel_id") == vessel_id:
            b["current_vessel_id"] = None
            if b.get("status") == "Occupied":
                b["status"] = "Available"
            port_repo.berths[b["id"]] = b

    # Release any cranes working this vessel
    for c in list(port_repo.cranes.values()):
        if c.get("current_vessel_id") == vessel_id:
            c["current_vessel_id"] = None
            if c.get("status") == "Busy":
                c["status"] = "Available"
            port_repo.cranes[c["id"]] = c

    del port_repo.vessels[vessel_id]
    return None
