"""Fixed Phase 1 regions.

NASA POWER monthly T2M for 1981–2025 is complete at each point (no fill), so none of these coordinates were moved.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class Region:
    id: str
    name: str
    latitude: float
    longitude: float


REGIONS: tuple[Region, ...] = (
    Region("arctic", "Arctic", 75.0, -40.0),
    Region("antarctic", "Antarctic", -75.0, 0.0),
    Region("amazon", "Amazon", -3.4, -62.0),
    Region("sahel", "Sahel", 14.0, 0.0),
    Region("n-atlantic", "N. Atlantic", 45.0, -30.0),
    Region("w-pacific", "W. Pacific", 10.0, 140.0),
    Region("bay-of-bengal", "Bay of Bengal", 15.0, 88.0),
    Region("gulf-of-mexico", "Gulf of Mexico", 25.0, -90.0),
    Region("siberia", "Siberia", 62.0, 100.0),
    Region("sw-usa", "SW USA", 34.0, -112.0),
)

BY_ID: dict[str, Region] = {region.id: region for region in REGIONS}
