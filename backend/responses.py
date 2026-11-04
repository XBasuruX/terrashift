"""Explicit response schemas, also exposed in /docs and /openapi.json."""

from typing import Literal
from pydantic import BaseModel, Field
from .contracts import Farm, Observation, Priorities, Scenario


class Provenance(BaseModel):
    requested_mode: Literal["live", "cached", "simulation"]
    mode: Literal["live", "cached", "simulation"]
    source: str
    classification: str
    latitude: float
    longitude: float
    start: str
    end: str
    time_standard: str
    resolution: str
    request_url: str
    retrieved_at: str | None
    sha256: str
    warning: str | None
    missing_values: int


class Monthly(BaseModel):
    month: str
    temperature: float | None
    precipitation: float | None
    eto: float | None
    coverage: float
    valid_days: int
    expected_days: int


class ClimateSummary(BaseModel):
    temperature: float | None
    precipitation: float | None
    heat_days: int
    frost_days: int
    longest_dry_spell: int
    coverage: float


class Anomaly(BaseModel):
    month: str
    departure: float | None


class ClimateResponse(BaseModel):
    monthly: list[Monthly]
    summary: ClimateSummary
    anomalies: list[Anomaly]
    anomaly_note: str
    daily: list[Observation]
    provenance: Provenance


class TracePoint(BaseModel):
    day: int
    storage_mm: float
    deficit_mm: float


class SeasonResult(BaseModel):
    crop: str
    slot: int
    start_month: int
    days: int
    demand_mm: float
    rainfall_mm: float
    deficit_mm: float
    overflow_mm: float
    heat_days: int
    frost_days: int
    suitability: float
    feasible: bool
    warnings: list[str]
    trace: list[TracePoint]


class StressResult(BaseModel):
    scenario: str
    score: float
    deficit_mm: float


class SensitivityPoint(BaseModel):
    delta: float
    score: float


class Criteria(BaseModel):
    water: float = Field(ge=0, le=100)
    diversity: float = Field(ge=0, le=100)
    suitability: float = Field(ge=0, le=100)


class RotationResult(BaseModel):
    id: str
    name: str
    sequence: list[str]
    score: float = Field(ge=0, le=100)
    metrics: Criteria
    contributions: Criteria
    feasible: bool
    pareto: bool
    water_demand_mm: float
    water_deficit_mm: float
    irrigation_volume_m3: float
    legume_seasons: int
    family_breaks: int
    seasons: list[SeasonResult]
    warnings: list[str]
    stress: list[StressResult]
    robust_score: float
    sensitivity: list[SensitivityPoint]


class FrontierPoint(Criteria):
    sequence: list[str]
    score: float


class AnalysisResponse(BaseModel):
    rotations: list[RotationResult]
    weights: Priorities
    candidate_count: int
    frontier: list[FrontierPoint]
    frontier_total: int
    replay_year: int | None
    scenario: Scenario
    model: str
    assumptions: list[str]
    provenance: Provenance
    farm: Farm
