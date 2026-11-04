from datetime import date
from typing import Literal
from pydantic import BaseModel, Field, model_validator


class Location(BaseModel):
    latitude: float = Field(ge=-85, le=85, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)


class ClimateQuery(Location):
    start: date = date(2024, 1, 1)
    end: date = date(2024, 12, 31)
    mode: Literal["live", "cached", "simulation"] = "cached"

    @model_validator(mode="after")
    def check_dates(self):
        if self.end < self.start or (self.end - self.start).days > 1826:
            raise ValueError("Choose an ordered date interval of at most five years.")
        if self.start < date(1981, 1, 1) or self.end >= date.today():
            raise ValueError(
                "POWER requires historical dates from 1981 through yesterday."
            )
        return self


class Observation(BaseModel):
    date: date
    temperature: float | None = None
    minimum: float | None = None
    maximum: float | None = None
    precipitation: float | None = None
    solar: float | None = None
    humidity: float | None = None
    wind: float | None = None


class Priorities(BaseModel):
    water: float = Field(default=40, ge=0, le=100, allow_inf_nan=False)
    diversity: float = Field(default=35, ge=0, le=100, allow_inf_nan=False)
    suitability: float = Field(default=25, ge=0, le=100, allow_inf_nan=False)

    @model_validator(mode="after")
    def not_zero(self):
        if self.water + self.diversity + self.suitability == 0:
            raise ValueError("At least one priority must be positive.")
        return self


class Farm(Location):
    id: str | None = None
    category: str = 'Sri Lanka pilot'
    boundary: list[list[float]] = Field(default_factory=list,max_length=200)
    name: str = Field(
        default="Anuradhapura learning farm", min_length=1, max_length=100
    )
    area_ha: float = Field(default=12, gt=0, le=100000, allow_inf_nan=False)
    soil: Literal["sandy", "loam", "clay"] = "loam"
    available_water_mm: float = Field(default=120, ge=20, le=300, allow_inf_nan=False)
    irrigation_mm: float = Field(default=80, ge=0, le=1000, allow_inf_nan=False)
    season_start_month: int = Field(default=10, ge=1, le=12)
    season_length_days: int = Field(default=120, ge=60, le=180)
    previous_crop: str = "rice"
    existing: list[str] = Field(
        default=["rice", "rice", "maize", "rice"], min_length=4, max_length=4
    )
    allowed_crops: list[str] = Field(
        default=["rice", "maize", "mungbean", "cowpea", "sorghum", "groundnut"],
        min_length=1,
        max_length=8,
    )
    equipment: Literal["standard", "paddy"] = "paddy"
    market_note: str = Field(
        default="Confirm buyers for pulses before changing the rotation.",
        max_length=1000,
    )
    priorities: Priorities = Field(default_factory=Priorities)


class Scenario(BaseModel):
    kind: Literal["typical", "dry", "wet", "custom"] = "typical"
    temperature_delta: float = Field(default=0, ge=-5, le=8, allow_inf_nan=False)
    rainfall_factor: float = Field(default=1, ge=0.2, le=2, allow_inf_nan=False)


class AnalysisRequest(BaseModel):
    farm: Farm
    climate: ClimateQuery
    scenario: Scenario = Field(default_factory=Scenario)
    alternatives: list[list[str]] | None = Field(
        default=None, min_length=2, max_length=2
    )

    @model_validator(mode="after")
    def same_location(self):
        if (
            abs(self.farm.latitude - self.climate.latitude) > 0.0001
            or abs(self.farm.longitude - self.climate.longitude) > 0.0001
        ):
            raise ValueError("Farm and climate coordinates must match.")
        return self
