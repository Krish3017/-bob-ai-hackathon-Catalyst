import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.database import port_repo
from app.core.auth import get_current_user, require_role
from app.models.schemas import CraneCreate, CraneUpdate, CraneResponse, UserResponse

router = APIRouter(prefix="/api/cranes", tags=["Cranes"])


@router.get("", response_model=List[CraneResponse])
def get_all_cranes(current_user: UserResponse = Depends(get_current_user)):
    """List all quay STS cranes and operational statuses"""
    cranes = list(port_repo.cranes.values())
    cranes.sort(key=lambda c: c.get("crane_code", ""))
    return [CraneResponse(**c) for c in cranes]


@router.get("/{crane_id}", response_model=CraneResponse)
def get_crane(
    crane_id: str,
    current_user: UserResponse = Depends(get_current_user)
):
    """Retrieve single crane status"""
    if crane_id not in port_repo.cranes:
        raise HTTPException(status_code=404, detail="Crane not found")
    return CraneResponse(**port_repo.cranes[crane_id])


@router.post("", response_model=CraneResponse, status_code=status.HTTP_201_CREATED)
def create_crane(
    payload: CraneCreate,
    current_user: UserResponse = Depends(require_role(["admin", "operations"]))
):
    """Add new crane equipment (Operations & Admin)"""
    new_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    crane_data = payload.model_dump()
    crane_data.update({
        "id": new_id,
        "created_at": now,
        "updated_at": now
    })
    port_repo.cranes[new_id] = crane_data
    return CraneResponse(**crane_data)


@router.put("/{crane_id}", response_model=CraneResponse)
def update_crane(
    crane_id: str,
    payload: CraneUpdate,
    current_user: UserResponse = Depends(require_role(["admin", "operations"]))
):
    """Update crane status (Available, Busy, Maintenance, Failed) or allocation"""
    if crane_id not in port_repo.cranes:
        raise HTTPException(status_code=404, detail="Crane not found")

    crane = port_repo.cranes[crane_id]
    update_data = payload.model_dump(exclude_unset=True)
    update_data["updated_at"] = datetime.now(timezone.utc)
    crane.update(update_data)
    port_repo.cranes[crane_id] = crane
    return CraneResponse(**crane)


@router.delete("/{crane_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crane(
    crane_id: str,
    current_user: UserResponse = Depends(require_role(["admin"]))
):
    """Delete a crane (Admin only)"""
    if crane_id not in port_repo.cranes:
        raise HTTPException(status_code=404, detail="Crane not found")
    del port_repo.cranes[crane_id]
    return None
