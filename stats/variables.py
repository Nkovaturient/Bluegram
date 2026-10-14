"""NASA POWER variables served by the Phase 2 stats API."""

from dataclasses import dataclass


@dataclass(frozen=True)
class VariableSpec:
    id: str
    parameter: str
    label: str
    unit: str


VARIABLES: dict[str, VariableSpec] = {
    "temperature": VariableSpec(
        id="temperature",
        parameter="T2M",
        label="Surface temperature",
        unit="°C",
    ),
    "precipitation": VariableSpec(
        id="precipitation",
        parameter="PRECTOTCORR",
        label="Precipitation",
        unit="mm/day",
    ),
}

DEFAULT_VARIABLE = "temperature"
