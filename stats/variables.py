"""NASA POWER variables served by the Bluegram stats API."""

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
    "solar": VariableSpec(
        id="solar",
        parameter="ALLSKY_SFC_SW_DWN",
        label="Solar radiation",
        unit="W/m²",
    ),
    "humidity": VariableSpec(
        id="humidity",
        parameter="RH2M",
        label="Relative humidity",
        unit="%",
    ),
}

DEFAULT_VARIABLE = "temperature"
