import asyncio
import copy
import json
from datetime import date, timedelta
from pathlib import Path
import math
import pytest
from pydantic import ValidationError
from backend.contracts import ClimateQuery, Farm, Observation, Priorities, Scenario
from backend.providers.power import parse_power, validate_power
from backend.providers.simulation import simulate
from backend.providers.service import get_climate
from backend.science.climate import hargreaves, radiation_mj, summarize
from backend.science.rotation import (
    analyze_rotations,
    calendar_weather,
    dominates,
    normalized_weights,
    season_metrics,
)

FIXTURE = Path(__file__).resolve().parents[1] / "fixtures/power_anuradhapura_2024.json"


@pytest.fixture
def payload():
    return json.loads(FIXTURE.read_text())


@pytest.fixture
def query():
    return ClimateQuery(
        latitude=8.3114,
        longitude=80.4037,
        start="2024-01-01",
        end="2024-12-31",
        mode="simulation",
    )


@pytest.fixture
def farm(query):
    return Farm(latitude=query.latitude, longitude=query.longitude)


def test_parse_actual_nasa_response_and_leap_year(payload):
    validate_power(payload)
    rows = parse_power(payload)
    assert len(rows) == 366
    assert rows[0].date == date(2024, 1, 1)
    assert rows[-1].date == date(2024, 12, 31)
    assert rows[0].temperature == 25.19
    assert rows[0].precipitation == 20.32
    assert rows[0].solar == 9.59  # MJ/m²/day in actual AG response
    assert rows[59].date == date(2024, 2, 29)


def test_missing_sentinel_is_not_zero(payload):
    payload["properties"]["parameter"]["T2M"]["20240101"] = -999
    del payload["properties"]["parameter"]["PRECTOTCORR"]["20240102"]
    rows = parse_power(payload)
    assert rows[0].temperature is None
    assert rows[1].precipitation is None
    assert rows[2].temperature is not None


def test_absent_whole_day_is_retained(payload):
    for series in payload["properties"]["parameter"].values():
        series.pop("20240229", None)
    rows = parse_power(payload)
    assert len(rows) == 366 and rows[59].temperature is None


def test_solar_energy_unit_conversion(payload):
    payload["parameters"]["ALLSKY_SFC_SW_DWN"]["units"] = "kW-hr/m^2/day"
    payload["properties"]["parameter"]["ALLSKY_SFC_SW_DWN"]["20240101"] = 5
    validate_power(payload)
    assert parse_power(payload)[0].solar == 18


def test_unknown_units_rejected(payload):
    payload["parameters"]["T2M"]["units"] = "K"
    with pytest.raises(ValueError, match="units"):
        validate_power(payload)


def test_fao56_independent_example_8():
    # FAO-56 Ch.3 Example 8: Sept 3, 20°S = 32.2 MJ/m²/day.
    assert radiation_mj(-20, 246) == pytest.approx(32.2, abs=0.05)


def test_hargreaves_dimensional_conversion():
    expected = 0.0023 * (25 + 17.8) * math.sqrt(10) * (0.408 * 32.1939958751)
    assert hargreaves(25, 20, 30, -20, 246) == pytest.approx(expected)
    assert hargreaves(25, None, 30, 8, 1) is None
    assert hargreaves(25, 30, 20, 8, 1) is None


@pytest.mark.parametrize("latitude,day", [(85, 355), (-85, 172), (0, 80), (85, 172)])
def test_radiation_finite_at_extreme_latitudes(latitude, day):
    assert math.isfinite(radiation_mj(latitude, day))
    assert radiation_mj(latitude, day) >= 0


def test_partial_and_missing_month_totals_withheld(query):
    rows = simulate(query)
    rows[1].precipitation = None
    months = summarize(rows[:35], query.latitude)["monthly"]
    assert months[0]["precipitation"] is None
    assert months[0]["temperature"] is not None
    assert months[1]["precipitation"] is None
    assert months[1]["coverage"] < 0.2


def test_missing_rain_breaks_dry_spell():
    rows = [
        Observation(
            date=date(2024, 1, 1) + timedelta(days=i), temperature=25, precipitation=v
        )
        for i, v in enumerate([0, 0, None, 0, 0, 0])
    ]
    result = summarize(rows, 8)["summary"]
    assert result["longest_dry_spell"] == 3
    assert result["precipitation"] is None


def test_simulation_deterministic_and_coordinate_dependent(query):
    assert simulate(query) == simulate(query)
    assert simulate(query) != simulate(query.model_copy(update={"latitude": -20}))


@pytest.mark.parametrize(
    "patch",
    [
        {"latitude": 91},
        {"longitude": 181},
        {"latitude": float("nan")},
        {"start": "2024-04-01", "end": "2024-01-01"},
        {"start": "1979-01-01"},
        {"start": "2000-01-01", "end": "2010-01-01"},
    ],
)
def test_invalid_geography_and_dates(query, patch):
    with pytest.raises(ValidationError):
        ClimateQuery(**{**query.model_dump(), **patch})


def test_priority_normalization_and_zero_rejection():
    assert normalized_weights(Priorities(water=100, diversity=0, suitability=0)) == {
        "water": 1,
        "diversity": 0,
        "suitability": 0,
    }
    assert sum(normalized_weights(Priorities()).values()) == pytest.approx(1)
    with pytest.raises(ValidationError):
        Priorities(water=0, diversity=0, suitability=0)


def test_water_bucket_mass_balance_and_stress_direction(query, farm):
    weather, _ = calendar_weather(simulate(query), Scenario())
    normal = season_metrics("maize", 1, farm, weather, Scenario())
    dry = season_metrics("maize", 1, farm, weather, Scenario(rainfall_factor=0.2))
    wet = season_metrics("maize", 1, farm, weather, Scenario(rainfall_factor=2))
    assert dry["deficit_mm"] >= normal["deficit_mm"] >= wet["deficit_mm"]
    assert all(
        0 <= point["storage_mm"] <= farm.available_water_mm for point in dry["trace"]
    )
    assert normal["demand_mm"] >= normal["deficit_mm"] >= 0
    # Recover final storage with an independently unrolled conservation law.
    storage = farm.available_water_mm * 0.5
    total_input = total_output = 0
    for i in range(110):
        day = date(2026, 4, 1) + timedelta(days=i)
        r = weather[day.strftime("%m-%d")]
        incoming = r["precipitation"] + farm.irrigation_mm / 110
        need = (
            hargreaves(
                r["temperature"],
                r["minimum"],
                r["maximum"],
                farm.latitude,
                day.timetuple().tm_yday,
            )
            * 0.9
        )
        overflow = max(0, storage + incoming - farm.available_water_mm)
        actual = min(need, min(farm.available_water_mm, storage + incoming))
        storage = storage + incoming - overflow - actual
        total_input += incoming
        total_output += overflow + actual
    assert farm.available_water_mm * 0.5 + total_input - total_output == pytest.approx(
        storage
    )


def test_missing_replay_days_rejected(query, farm):
    rows = simulate(query)
    rows[0].temperature = None
    weather, _ = calendar_weather(rows, Scenario())
    with pytest.raises(ValueError, match="Complete daily"):
        season_metrics("rice", 0, farm, weather, Scenario())


def test_constraints_and_three_distinct_computed_strategies(query, farm):
    farm.equipment = "standard"
    result = analyze_rotations(farm, simulate(query), Scenario())
    assert len(result["rotations"]) == 3
    assert len({tuple(r["sequence"]) for r in result["rotations"]}) == 3
    assert not result["rotations"][0]["feasible"]
    assert all(
        "rice" not in r["sequence"] and r["feasible"] for r in result["rotations"][1:]
    )
    for r in result["rotations"]:
        assert r["score"] == pytest.approx(sum(r["contributions"].values()), abs=0.01)
        assert 0 <= r["score"] <= 100
        assert len(r["stress"]) == 4 and len(r["sensitivity"]) == 4


def test_irrigation_volume_conversion(query, farm):
    r = analyze_rotations(farm, simulate(query), Scenario())["rotations"][0]
    assert r["irrigation_volume_m3"] == 80 * 12 * 10 * 4


def test_custom_alternatives_recomputed(query, farm):
    seq = [["cowpea"] * 4, ["sorghum"] * 4]
    r = analyze_rotations(farm, simulate(query), Scenario(), seq)
    assert r["rotations"][1]["sequence"] == seq[0]
    assert r["rotations"][1]["water_demand_mm"] != r["rotations"][2]["water_demand_mm"]
    with pytest.raises(ValueError, match="Unknown crop"):
        analyze_rotations(
            farm, simulate(query), Scenario(), [["bogus"] * 4, ["rice"] * 4]
        )


def test_family_repeat_penalty_and_legumes(query, farm):
    r = analyze_rotations(
        farm,
        simulate(query),
        Scenario(),
        [["rice"] * 4, ["rice", "cowpea", "maize", "groundnut"]],
    )
    assert r["rotations"][1]["family_breaks"] == 0
    assert (
        r["rotations"][2]["family_breaks"] == 3
    )  # Previous rice → first rice repeats.
    assert r["rotations"][2]["legume_seasons"] == 2
    assert (
        r["rotations"][2]["metrics"]["diversity"]
        > r["rotations"][1]["metrics"]["diversity"]
    )


def test_dry_wet_select_actual_complete_years(farm):
    rows = []
    for year, p in [(2023, 1), (2024, 4), (2025, 2)]:
        d = date(year, 1, 1)
        while d.year == year:
            rows.append(
                Observation(
                    date=d, temperature=25, minimum=20, maximum=30, precipitation=p
                )
            )
            d += timedelta(days=1)
    assert calendar_weather(rows, Scenario(kind="dry"))[1] == 2023
    assert calendar_weather(rows, Scenario(kind="wet"))[1] == 2024
    with pytest.raises(ValueError, match="at least two"):
        calendar_weather(rows[:365], Scenario(kind="dry"))


def test_pareto_definition():
    a = {"metrics": {"water": 90, "diversity": 60, "suitability": 80}}
    b = {"metrics": {"water": 85, "diversity": 60, "suitability": 70}}
    c = {"metrics": {"water": 95, "diversity": 50, "suitability": 80}}
    assert dominates(a, b)
    assert not dominates(a, a)
    assert not dominates(a, c) and not dominates(c, a)


def test_genuine_fixture_mode_and_no_wrong_location_fallback(query):
    rows, p = asyncio.run(get_climate(query.model_copy(update={"mode": "cached"})))
    assert p["mode"] == "cached" and p["classification"] == "gridded estimate"
    assert len(rows) == 366 and len(p["sha256"]) == 64
    _, p = asyncio.run(
        get_climate(query.model_copy(update={"mode": "cached", "latitude": 9}))
    )
    assert p["mode"] == "simulation" and p["warning"]
