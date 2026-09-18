from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr


# -----------------------------------------------------------------------------
# User & Authentication Schemas (RBAC)
# -----------------------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(..., description="Role: 'admin', 'operations', or 'viewer'")
    department: Optional[str] = "Port Operations"


class UserResponse(UserBase):
    id: str
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, description="User password")


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    department: Optional[str] = "Port Operations"


class UserRoleUpdate(BaseModel):
    role: str = Field(..., description="Role must be 'admin', 'operations', or 'viewer'")


class AdminUpdatePasswordRequest(BaseModel):
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")


class AdminCreateUserRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field(..., min_length=1)
    department: Optional[str] = "Port Operations"
    role: str = Field("viewer", description="Role: 'admin', 'operations', or 'viewer'")


class AuthResponse(BaseModel):
    token: str
    user: UserResponse



# -----------------------------------------------------------------------------
# Berth Schemas
# -----------------------------------------------------------------------------
class BerthBase(BaseModel):
    berth_code: str
    berth_name: str
    max_vessel_length: float
    status: str = "Available"
    current_vessel_id: Optional[str] = None
    available_from: Optional[datetime] = None


class BerthCreate(BerthBase):
    pass


class BerthUpdate(BaseModel):
    berth_name: Optional[str] = None
    max_vessel_length: Optional[float] = None
    status: Optional[str] = None
    current_vessel_id: Optional[str] = None
    available_from: Optional[datetime] = None


class BerthResponse(BerthBase):
    id: str
    created_at: datetime
    updated_at: datetime


# -----------------------------------------------------------------------------
# Crane Schemas
# -----------------------------------------------------------------------------
class CraneBase(BaseModel):
    crane_code: str
    crane_name: str
    capacity_per_hour: int = 35
    status: str = "Available"
    current_vessel_id: Optional[str] = None
    assigned_berth_id: Optional[str] = None
    available_from: Optional[datetime] = None


class CraneCreate(CraneBase):
    pass


class CraneUpdate(BaseModel):
    crane_name: Optional[str] = None
    capacity_per_hour: Optional[int] = None
    status: Optional[str] = None
    current_vessel_id: Optional[str] = None
    assigned_berth_id: Optional[str] = None
    available_from: Optional[datetime] = None


class CraneResponse(CraneBase):
    id: str
    created_at: datetime
    updated_at: datetime


# -----------------------------------------------------------------------------
# Vessel Schemas
# -----------------------------------------------------------------------------
class VesselBase(BaseModel):
    vessel_code: str
    vessel_name: str
    shipping_line: str
    cargo_type: str = "Container"
    cargo_volume: int
    vessel_length: float
    arrival_time: Optional[datetime] = None
    eta: datetime
    etd: datetime
    priority: int = 2
    status: str = "Scheduled"
    assigned_berth_id: Optional[str] = None
    expected_waiting_time: float = 0.0


class VesselCreate(VesselBase):
    pass


class VesselUpdate(BaseModel):
    vessel_name: Optional[str] = None
    shipping_line: Optional[str] = None
    cargo_type: Optional[str] = None
    cargo_volume: Optional[int] = None
    vessel_length: Optional[float] = None
    arrival_time: Optional[datetime] = None
    eta: Optional[datetime] = None
    etd: Optional[datetime] = None
    priority: Optional[int] = None
    status: Optional[str] = None
    assigned_berth_id: Optional[str] = None
    expected_waiting_time: Optional[float] = None


class VesselResponse(VesselBase):
    id: str
    created_at: datetime
    updated_at: datetime


# -----------------------------------------------------------------------------
# Yard Schemas
# -----------------------------------------------------------------------------
class YardBase(BaseModel):
    yard_code: str
    yard_name: str
    cargo_type: str
    total_capacity: int
    occupied_capacity: int = 0
    status: str = "Normal"


class YardCreate(YardBase):
    pass


class YardUpdate(BaseModel):
    yard_name: Optional[str] = None
    occupied_capacity: Optional[int] = None
    status: Optional[str] = None


class YardResponse(YardBase):
    id: str
    utilization_percentage: float
    updated_at: datetime


# -----------------------------------------------------------------------------
# Disruption Schemas
# -----------------------------------------------------------------------------
class DisruptionBase(BaseModel):
    disruption_type: str
    title: str
    description: Optional[str] = None
    affected_resource_type: str
    affected_resource_id: Optional[str] = None
    severity: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: str = "Active"


class DisruptionCreate(DisruptionBase):
    pass


class DisruptionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    affected_resource_type: Optional[str] = None
    affected_resource_id: Optional[str] = None
    severity: Optional[str] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None


class DisruptionResponse(DisruptionBase):
    id: str
    created_at: datetime


# -----------------------------------------------------------------------------
# Congestion Schemas
# -----------------------------------------------------------------------------
class CongestionFactor(BaseModel):
    name: str
    weight: float
    raw_value: float
    score_contribution: float
    description: str


class CongestionResponse(BaseModel):
    score: float
    level: str  # Low, Moderate, High, Critical
    color: str
    explanation: str
    factors: List[CongestionFactor]
    active_disruptions_count: int
    waiting_vessels_count: int
    avg_waiting_time_hours: float
    berth_utilization_pct: float
    crane_utilization_pct: float
    yard_utilization_pct: float
    calculated_at: datetime


# -----------------------------------------------------------------------------
# Dashboard Summary Schema
# -----------------------------------------------------------------------------
class DashboardSummaryResponse(BaseModel):
    congestion: CongestionResponse
    metrics: Dict[str, Any]
    active_vessels_count: int
    total_berths: int
    occupied_berths: int
    available_berths: int
    total_cranes: int
    operational_cranes: int
    failed_cranes: int
    total_yard_capacity: int
    total_occupied_yard: int
    overall_yard_utilization: float
    active_disruptions: List[DisruptionResponse]


# -----------------------------------------------------------------------------
# Schedule & Optimization Schemas
# -----------------------------------------------------------------------------
class ScheduleItemResponse(BaseModel):
    id: str
    optimization_run_id: str
    vessel_id: str
    vessel_code: str
    vessel_name: str
    berth_id: str
    berth_code: str
    berth_name: str
    planned_start: datetime
    planned_end: datetime
    duration_hours: float
    waiting_time: float
    assigned_cranes: List[str]
    assignment_reason: str
    status: str


class OptimizationRunResponse(BaseModel):
    id: str
    planning_horizon_start: datetime
    planning_horizon_end: datetime
    objective_value: float
    total_waiting_time: float
    total_delay: float
    status: str
    applied: bool
    schedules: List[ScheduleItemResponse]
    metrics: Dict[str, Any]
    created_at: datetime


class ApplyScheduleRequest(BaseModel):
    run_id: str


# -----------------------------------------------------------------------------
# What-If Simulation Schemas (Digital Twin Sandbox)
# -----------------------------------------------------------------------------
class SimulateOptimizationRequest(BaseModel):
    scenario_name: Optional[str] = "What-If Simulation"
    unavailable_berth_ids: Optional[List[str]] = Field(default_factory=list)
    unavailable_crane_ids: Optional[List[str]] = Field(default_factory=list)
    vessel_delay_hours: Optional[Dict[str, float]] = Field(default_factory=dict)


class SimulationResponse(BaseModel):
    scenario_name: str
    baseline_metrics: Dict[str, Any]
    simulated_metrics: Dict[str, Any]
    deltas: Dict[str, Any]
    simulated_schedules: List[ScheduleItemResponse]
    summary: str


# -----------------------------------------------------------------------------
# Proactive Disruption Sentinel Schemas
# -----------------------------------------------------------------------------
class SentinelAlertItem(BaseModel):
    id: str
    disruption_title: str
    severity: str
    affected_resource: str
    at_risk_vessels: List[str]
    estimated_risk_usd: float
    recommended_action: str


class SentinelAlertResponse(BaseModel):
    has_threat: bool
    active_alerts: List[SentinelAlertItem]
    total_risk_exposure_usd: float
    total_at_risk_vessels: int
    recommended_action: str
    runbook_plan_ready: bool



# -----------------------------------------------------------------------------
# Copilot Chat Schemas
# -----------------------------------------------------------------------------
class CopilotMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str


class CopilotChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User's message to the Copilot")
    history: Optional[List[CopilotMessage]] = Field(default=None, description="Prior conversation turns for this session (deprecated: DB is now the source of truth)")
    session_id: Optional[str] = Field(default=None, description="Optional client-side session identifier")
    conversation_id: Optional[str] = Field(default=None, description="Persistent conversation UUID; omit to create a new conversation")


class CopilotChatResponse(BaseModel):
    reply: str
    session_id: Optional[str] = None
    conversation_id: Optional[str] = None
    model: str
    role_context: str
    tools_used: Optional[List[str]] = Field(default=None, description="Internal tool names that were called during this request")


class CopilotActionResponse(BaseModel):
    """Response from a confirmed Copilot action execution."""
    action: str
    status: str  # "success" | "error" | "permission_denied"
    message: str
    result: Optional[Dict[str, Any]] = None


# -----------------------------------------------------------------------------
# Copilot Conversation Persistence Schemas
# -----------------------------------------------------------------------------

class ConversationSummary(BaseModel):
    """Lightweight conversation entry for list views."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime


class MessageResponse(BaseModel):
    """A single persisted message in a conversation."""
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime


class ConversationDetail(BaseModel):
    """Full conversation with messages."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse]


class ConversationCreateRequest(BaseModel):
    title: Optional[str] = Field(default=None, max_length=200, description="Optional title; defaults to 'New conversation'")


class ConversationTitleUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
