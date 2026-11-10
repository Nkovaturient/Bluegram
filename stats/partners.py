"""Partner & NASA extension adapters (NASA EONET v3 live events, ISRO/Pixxel supplemental metadata, and Nov 13-14 API key registry)."""

import math
import os
import time
from typing import Any

import httpx

from regions import Region

EONET_URL = "https://eonet.gsfc.nasa.gov/api/v3/events"
_EONET_TTL_SECONDS = 900.0
_eonet_cache: tuple[float, list[dict[str, Any]]] | None = None
_EVENT_RADIUS_KM = 1800.0


def get_provider_status() -> dict[str, object]:
    """Reports active NASA & partner API credentials (ready for Nov 13-14 key drop-in)."""
    return {
        "nasa_power": {"configured": True, "auth": "none", "status": "active"},
        "nasa_gibs": {"configured": True, "auth": "none", "status": "active"},
        "nasa_eonet_v3": {"configured": True, "auth": "none", "status": "active"},
        "nasa_api_key": {
            "configured": bool(os.getenv("NASA_API_KEY", "").strip()),
            "env": "NASA_API_KEY",
            "status": "ready" if os.getenv("NASA_API_KEY", "").strip() else "standby_nov_13_14",
        },
        "nasa_earthdata_cmr": {
            "configured": bool(os.getenv("NASA_EARTHDATA_TOKEN", "").strip()),
            "env": "NASA_EARTHDATA_TOKEN",
            "status": "ready" if os.getenv("NASA_EARTHDATA_TOKEN", "").strip() else "standby_nov_13_14",
        },
        "nasa_firms": {
            "configured": bool(os.getenv("FIRMS_MAP_KEY", "").strip()),
            "env": "FIRMS_MAP_KEY",
            "status": "ready" if os.getenv("FIRMS_MAP_KEY", "").strip() else "standby_nov_13_14",
        },
        "copernicus_cds": {
            "configured": bool(os.getenv("COPERNICUS_CDS_KEY", "").strip()),
            "env": "COPERNICUS_CDS_KEY",
            "status": "ready" if os.getenv("COPERNICUS_CDS_KEY", "").strip() else "standby",
        },
        "pixxel_aurora": {
            "configured": bool(os.getenv("PIXXEL_AURORA_TOKEN", "").strip()),
            "env": "PIXXEL_AURORA_TOKEN",
            "status": "ready" if os.getenv("PIXXEL_AURORA_TOKEN", "").strip() else "supplemental_schema",
        },
    }


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(max(0.0, 1.0 - a)))


async def fetch_region_eonet_events(
    client: httpx.AsyncClient, region: Region, limit: int = 4
) -> list[dict[str, object]]:
    """Fetches open natural events from NASA EONET v3 within _EVENT_RADIUS_KM of the region."""
    global _eonet_cache
    now = time.monotonic()
    raw_events: list[dict[str, Any]] = []

    if _eonet_cache is not None and (now - _eonet_cache[0]) < _EONET_TTL_SECONDS:
        raw_events = _eonet_cache[1]
    else:
        try:
            params: dict[str, str | int] = {"status": "open", "limit": 80}
            nasa_key = os.getenv("NASA_API_KEY", "").strip()
            if nasa_key:
                params["api_key"] = nasa_key
            response = await client.get(EONET_URL, params=params, timeout=8.0)
            if response.status_code == 200:
                payload = response.json()
                if isinstance(payload, dict) and isinstance(payload.get("events"), list):
                    raw_events = payload["events"]
                    _eonet_cache = (now, raw_events)
        except Exception:
            raw_events = _eonet_cache[1] if _eonet_cache else []

    matched: list[tuple[float, dict[str, object]]] = []
    for event in raw_events:
        if not isinstance(event, dict):
            continue
        geometries = event.get("geometry")
        if not isinstance(geometries, list) or len(geometries) == 0:
            continue
        latest = geometries[-1]
        if not isinstance(latest, dict):
            continue
        coords = latest.get("coordinates")
        if not isinstance(coords, list) or len(coords) < 2:
            continue
        if not isinstance(coords[0], (int, float)) or not isinstance(coords[1], (int, float)):
            continue
        ev_lon = float(coords[0])
        ev_lat = float(coords[1])
        dist = _haversine_km(region.latitude, region.longitude, ev_lat, ev_lon)
        if dist <= _EVENT_RADIUS_KM:
            categories = event.get("categories")
            cat_title = "Natural Event"
            if isinstance(categories, list) and len(categories) > 0 and isinstance(categories[0], dict):
                cat_title = str(categories[0].get("title", "Natural Event"))
            matched.append(
                (
                    dist,
                    {
                        "id": str(event.get("id", "")),
                        "title": str(event.get("title", "NASA EONET Event")),
                        "category": cat_title,
                        "date": str(latest.get("date", ""))[:10],
                        "distanceKm": round(dist),
                        "sourceUrl": "https://eonet.gsfc.nasa.gov/",
                    },
                )
            )

    matched.sort(key=lambda item: item[0])
    return [item[1] for item in matched[:limit]]


def get_region_supplemental(region: Region, variable_id: str) -> dict[str, object] | None:
    """Returns Partner Agency (ISRO Bhuvan/MOSDAC, ESA, JAXA) or Pixxel Mode A hyperspectral context."""
    pixxel_live = bool(os.getenv("PIXXEL_AURORA_TOKEN", "").strip())

    supplemental_catalog: dict[str, dict[str, object]] = {
        "western-ghats": {
            "source": "isro-bhuvan-pixxel",
            "agency": "ISRO Bhuvan / MOSDAC + Pixxel Firefly",
            "badge": "Hyperspectral + ISRO EO · Supplemental",
            "indexName": "Red-Edge Chlorophyll & Monsoon Orographic Index",
            "recordLengthMonths": 18,
            "primarySource": "nasa-power",
            "liveTokenActive": pixxel_live,
            "note": (
                "ISRO MOSDAC monsoon belt benchmark + Pixxel Firefly short-window canopy stress layer. "
                "Primary Mann-Kendall significance stamp remains anchored to 45-year NASA POWER series."
            ),
        },
        "indo-gangetic": {
            "source": "isro-bhuvan",
            "agency": "ISRO Bhuvan / Sentinel-5P Cross-Check",
            "badge": "ISRO Subcontinent Post · Supplemental",
            "indexName": "IGP Aerosol-Coupled Hydro-Thermal Regime",
            "recordLengthMonths": 24,
            "primarySource": "nasa-power",
            "liveTokenActive": pixxel_live,
            "note": (
                "Curated Indian subcontinent post (Ganga basin / Lucknow corridor): winter fog and intensive "
                "irrigation modulate surface temperature and relative humidity alongside greenhouse forcing."
            ),
        },
        "sundarbans": {
            "source": "isro-mosdac-pixxel",
            "agency": "ISRO MOSDAC + Pixxel Firefly",
            "badge": "Mangrove Hyperspectral · Supplemental",
            "indexName": "Mangrove Salinity & Canopy Stress Ratio",
            "recordLengthMonths": 16,
            "primarySource": "nasa-power",
            "liveTokenActive": pixxel_live,
            "note": (
                "Bay of Bengal cyclonic moisture convergence paired with mangrove spectral stress monitoring "
                "(short window <20 yr excluded from primary NASA spatial FDR pool per §08 guardrail)."
            ),
        },
        "amazon": {
            "source": "pixxel",
            "agency": "NASA MODIS + Pixxel Firefly (Mode A)",
            "badge": "Hyperspectral Window · 18 mo",
            "indexName": "Canopy Photochemical Reflectance / Red-Edge Stress",
            "recordLengthMonths": 18,
            "primarySource": "nasa-power",
            "liveTokenActive": pixxel_live,
            "note": (
                "Mode A NDVI/vegetation enrichment: hyperspectral narrow-band stress detection complements "
                "multi-decade NASA hydro-climatic trend detection."
            ),
        },
        "sahel": {
            "source": "esa-copernicus",
            "agency": "ESA Copernicus C3S / Sentinel-5P",
            "badge": "ESA Partner Cross-Check",
            "indexName": "Semi-Arid Albedo & Moisture Recovery Index",
            "recordLengthMonths": 36,
            "primarySource": "nasa-power",
            "liveTokenActive": bool(os.getenv("COPERNICUS_CDS_KEY", "").strip()),
            "note": (
                "Tri-agency cross-check: Sahel rainfall recovery and thermal amplification validated against "
                "ERA5 and NASA POWER long-term records."
            ),
        },
        "bay-of-bengal": {
            "source": "isro-jaxa",
            "agency": "ISRO MOSDAC · JAXA GSMaP / AMSR2",
            "badge": "ISRO + JAXA Ocean-Monsoon Layer",
            "indexName": "Bay of Bengal SST & Monsoon Depression Flux",
            "recordLengthMonths": 36,
            "primarySource": "nasa-power",
            "liveTokenActive": False,
            "note": (
                "Cross-referenced with ISRO MOSDAC Indian Ocean SST and JAXA GSMaP precipitation baselines."
            ),
        },
    }

    return supplemental_catalog.get(region.id)
