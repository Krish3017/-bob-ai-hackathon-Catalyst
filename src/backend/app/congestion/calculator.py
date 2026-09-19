from datetime import datetime, timezone
from typing import Dict, Any, List
from app.models.schemas import CongestionResponse, CongestionFactor


def calculate_port_congestion(
    vessels: List[Dict[str, Any]],
    berths: List[Dict[str, Any]],
    cranes: List[Dict[str, Any]],
    yards: List[Dict[str, Any]],
    disruptions: List[Dict[str, Any]]
) -> CongestionResponse:
    """
    Computes a transparent rule-based Port Congestion Index (0 to 100).
    Factors:
      1. Waiting Vessel Ratio (w = 0.25)
      2. Berth Saturation (w = 0.25)
      3. Crane Fleet Utilization (w = 0.20)
      4. Yard Capacity Stress (w = 0.15)
      5. Waiting Time Burden (w = 0.15)
      + Active Disruption Severity Add-ons
    """
    active_vessels = [v for v in vessels if v.get("status") != "Completed"]
    total_active_vessels = max(1, len(active_vessels))
    waiting_vessels = [v for v in active_vessels if v.get("status") == "Waiting"]
    num_waiting = len(waiting_vessels)

    # 1. Waiting Ratio Factor
    waiting_ratio = (num_waiting / total_active_vessels) * 100
    score_waiting_ratio = min(100.0, waiting_ratio * 1.5)

    # 2. Waiting Time Burden
    waiting_times = [v.get("expected_waiting_time", 0.0) for v in waiting_vessels]
    avg_waiting_time = sum(waiting_times) / max(1, len(waiting_times)) if waiting_times else 0.0
    # 12 hours waiting represents 100% burden on port queue
    score_waiting_time = min(100.0, (avg_waiting_time / 12.0) * 100.0)

    # 3. Berth Saturation
    total_berths = len(berths)
    occupied_berths = len([b for b in berths if b.get("status") == "Occupied"])
    available_berths = len([b for b in berths if b.get("status") == "Available"])
    operable_berths = max(1, occupied_berths + available_berths)
    berth_utilization_pct = (occupied_berths / operable_berths) * 100.0
    score_berth_sat = berth_utilization_pct

    # 4. Crane Fleet Utilization
    total_cranes = len(cranes)
    busy_cranes = len([c for c in cranes if c.get("status") == "Busy"])
    operable_cranes = len([c for c in cranes if c.get("status") in ["Available", "Busy"]])
    crane_utilization_pct = (busy_cranes / max(1, operable_cranes)) * 100.0
    score_crane_sat = crane_utilization_pct

    # 5. Yard Capacity Stress
    total_capacity = sum(y.get("total_capacity", 0) for y in yards)
    occupied_capacity = sum(y.get("occupied_capacity", 0) for y in yards)
    yard_utilization_pct = (occupied_capacity / max(1, total_capacity)) * 100.0 if total_capacity else 0.0
    score_yard_sat = yard_utilization_pct

    # 6. Disruption Severity Add-ons
    active_disruptions = [d for d in disruptions if d.get("status") == "Active"]
    disruption_penalty = 0.0
    for d in active_disruptions:
        sev = d.get("severity", "").lower()
        if sev == "critical":
            disruption_penalty += 10.0
        elif sev == "high":
            disruption_penalty += 5.0
        elif sev == "medium":
            disruption_penalty += 2.0
        else:
            disruption_penalty += 1.0

    # Base Weighted Score
    w_waiting_ratio = 0.25
    w_berth_sat = 0.25
    w_crane_sat = 0.20
    w_yard_sat = 0.15
    w_waiting_time = 0.15

    base_score = (
        (score_waiting_ratio * w_waiting_ratio) +
        (score_berth_sat * w_berth_sat) +
        (score_crane_sat * w_crane_sat) +
        (score_yard_sat * w_yard_sat) +
        (score_waiting_time * w_waiting_time)
    )

    final_score = round(min(100.0, base_score + disruption_penalty), 1)

    # Classification Level & Tone
    if final_score <= 30.0:
        level = "Low"
        color = "text-emerald-700 bg-emerald-50 border-emerald-200"
        explanation = "Smooth quay and yard operations. Berth throughput is adequate with minimal waiting times."
    elif final_score <= 60.0:
        level = "Moderate"
        color = "text-amber-700 bg-amber-50 border-amber-200"
        explanation = "Normal operational load with queue buildup at anchorage. Berth and crane utilization are balanced."
    elif final_score <= 80.0:
        level = "High"
        color = "text-orange-700 bg-orange-50 border-orange-200"
        explanation = "Quayside bottleneck identified. Waiting vessels exceeding buffer thresholds and crane capacity constrained."
    else:
        level = "Critical"
        color = "text-rose-700 bg-rose-50 border-rose-200"
        explanation = "Severe congestion alert! Disruptions and resource deficits causing cascade delays. 72-hour re-optimization urgently recommended."

    factors = [
        CongestionFactor(
            name="Anchorage Queue Ratio",
            weight=w_waiting_ratio,
            raw_value=round(waiting_ratio, 1),
            score_contribution=round(score_waiting_ratio * w_waiting_ratio, 1),
            description=f"{num_waiting} of {total_active_vessels} active vessels waiting at anchorage"
        ),
        CongestionFactor(
            name="Berth Saturation",
            weight=w_berth_sat,
            raw_value=round(berth_utilization_pct, 1),
            score_contribution=round(score_berth_sat * w_berth_sat, 1),
            description=f"{occupied_berths} of {operable_berths} operable berths currently occupied"
        ),
        CongestionFactor(
            name="Crane Fleet Saturation",
            weight=w_crane_sat,
            raw_value=round(crane_utilization_pct, 1),
            score_contribution=round(score_crane_sat * w_crane_sat, 1),
            description=f"{busy_cranes} of {operable_cranes} operable STS cranes engaged in operations"
        ),
        CongestionFactor(
            name="Yard Capacity Stress",
            weight=w_yard_sat,
            raw_value=round(yard_utilization_pct, 1),
            score_contribution=round(score_yard_sat * w_yard_sat, 1),
            description=f"Overall container stacking utilization at {round(yard_utilization_pct, 1)}%"
        ),
        CongestionFactor(
            name="Average Delay Burden",
            weight=w_waiting_time,
            raw_value=round(avg_waiting_time, 1),
            score_contribution=round(score_waiting_time * w_waiting_time, 1),
            description=f"Average expected queue wait time is {round(avg_waiting_time, 1)} hours"
        ),
        CongestionFactor(
            name="Active Disruption Impact",
            weight=0.0,  # Additive penalty
            raw_value=float(len(active_disruptions)),
            score_contribution=round(disruption_penalty, 1),
            description=f"{len(active_disruptions)} active disruptions injecting +{round(disruption_penalty, 1)} penalty points"
        )
    ]

    return CongestionResponse(
        score=final_score,
        level=level,
        color=color,
        explanation=explanation,
        factors=factors,
        active_disruptions_count=len(active_disruptions),
        waiting_vessels_count=num_waiting,
        avg_waiting_time_hours=round(avg_waiting_time, 1),
        berth_utilization_pct=round(berth_utilization_pct, 1),
        crane_utilization_pct=round(crane_utilization_pct, 1),
        yard_utilization_pct=round(yard_utilization_pct, 1),
        calculated_at=datetime.now(timezone.utc)
    )
