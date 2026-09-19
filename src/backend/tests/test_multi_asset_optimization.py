import pytest
from app.core.database import port_repo
from app.optimization.optimizer import PortOptimizer, run_whatif_simulation
from app.services.copilot_tools import _simulate_scenario, _normalize_crane_code, _normalize_berth_code, _normalize_yard_code


def test_asset_normalization():
    assert _normalize_crane_code("CR 03") == "CR-03"
    assert _normalize_crane_code("cr03") == "CR-03"
    assert _normalize_crane_code("crane 3") == "CR-03"
    assert _normalize_crane_code("CR-03") == "CR-03"

    assert _normalize_berth_code("B 01") == "B-01"
    assert _normalize_berth_code("b01") == "B-01"
    assert _normalize_berth_code("berth 1") == "B-01"
    assert _normalize_berth_code("B-01") == "B-01"

    assert _normalize_yard_code("YZ 01") == "YZ-01"
    assert _normalize_yard_code("yz01") == "YZ-01"
    assert _normalize_yard_code("Y-01") == "YZ-01"
    assert _normalize_yard_code("yard 1") == "YZ-01"


def test_crane_failure_actual_optimization_calculations():
    # Test CR-01 and CR-02 (berth B-01 cranes)
    res = _simulate_scenario({"unavailable_crane_codes": ["CR 01", "CR 02"]})
    assert res["status"] == "ok"
    deltas = res["simulation"]["deltas"]
    # Throughput reduced on B-01, waiting time and demurrage must increase
    assert deltas["waiting_time_delta_hours"] > 0
    assert deltas["demurrage_delta_usd"] > 0
    assert deltas["co2_delta_mt"] > 0
    assert deltas["congestion_score_delta"] > 0


def test_berth_outage_actual_optimization_calculations():
    res = _simulate_scenario({"unavailable_berth_codes": ["B 01"]})
    assert res["status"] == "ok"
    deltas = res["simulation"]["deltas"]
    # Berth B-01 unavailable forces mega-vessels to queue on B-02
    assert deltas["waiting_time_delta_hours"] > 0
    assert deltas["demurrage_delta_usd"] > 0
    assert deltas["co2_delta_mt"] > 0
    assert deltas["congestion_score_delta"] > 0


def test_yard_zone_simulation():
    res = _simulate_scenario({"unavailable_yard_codes": ["YZ 01"]})
    assert res["status"] == "ok"
    deltas = res["simulation"]["deltas"]
    assert deltas["congestion_score_delta"] > 0
    assert len(res["simulation"]["simulated_unavailable_yards"]) == 1
