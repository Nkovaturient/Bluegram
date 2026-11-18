"""Bluegram stats service.

Run from this directory: .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
"""

import asyncio
import os
from contextlib import asynccontextmanager
from pathlib import Path

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware


def _autoload_dotenv() -> None:
    """Lightweight .env loader so stats/.env keys take effect without extra pip deps."""
    env_path = Path(__file__).resolve().parent / ".env"
    if not env_path.exists():
        return
    try:
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val
    except Exception:
        pass


_autoload_dotenv()

from analysis import SeriesRejected, compute_fdr_qvalues, compute_trend  # noqa: E402
from partners import (  # noqa: E402
    fetch_global_eonet_events,
    fetch_planetary_stac_scene,
    fetch_region_eonet_events,
    fetch_synoptic_nowcast,
    get_isro_ground_telemetry,
    get_provider_status,
    get_region_supplemental,
)
from power import PowerError, get_series  # noqa: E402
from regions import BY_ID, REGIONS, Region  # noqa: E402
from variables import DEFAULT_VARIABLE, VARIABLES, VariableSpec  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(120.0, connect=30.0),
        headers={"User-Agent": "Bluegram/1.0 (NASA Space Apps)"},
        follow_redirects=True,
    )
    try:
        yield
    finally:
        await app.state.http.aclose()


raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app = FastAPI(title="Bluegram stats", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/api/regions")
def list_regions() -> dict[str, object]:
    return {
        "regions": [
            {
                "id": region.id,
                "name": region.name,
                "latitude": region.latitude,
                "longitude": region.longitude,
            }
            for region in REGIONS
        ]
    }


@app.get("/api/providers")
def list_providers() -> dict[str, object]:
    _autoload_dotenv()
    return {"providers": get_provider_status()}


def _variable(variable: str) -> VariableSpec:
    found = VARIABLES.get(variable)
    if found is None:
        known = ", ".join(VARIABLES)
        raise HTTPException(
            status_code=404, detail=f"Unknown variable '{variable}'. Known: {known}"
        )
    return found


@app.get("/api/events/global")
async def global_events(request: Request) -> dict[str, object]:
    events = await fetch_global_eonet_events(request.app.state.http)
    return {"events": events}


@app.get("/api/events")
async def region_events(
    request: Request,
    region: str = Query(min_length=1),
) -> dict[str, object]:
    found = BY_ID.get(region)
    if found is None:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")
    events = await fetch_region_eonet_events(request.app.state.http, found)
    return {"regionId": found.id, "events": events}


@app.get("/api/planetary-intel")
async def planetary_intel(
    request: Request,
    region: str = Query(min_length=1),
) -> dict[str, object]:
    found = BY_ID.get(region)
    if found is None:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")
    stac_scene, synoptic = await asyncio.gather(
        fetch_planetary_stac_scene(request.app.state.http, found),
        fetch_synoptic_nowcast(request.app.state.http, found),
    )
    return {
        "regionId": found.id,
        "stacScene": stac_scene,
        "synoptic": synoptic,
        "isroTelemetry": get_isro_ground_telemetry(found),
    }


@app.get("/api/trend")
async def trend(
    request: Request,
    region: str = Query(min_length=1),
    variable: str = Query(default=DEFAULT_VARIABLE),
    start_year: int = Query(default=1981, ge=1981, le=2025),
    end_year: int = Query(default=2025, ge=1981, le=2025),
) -> dict[str, object]:
    found = BY_ID.get(region)
    if found is None:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")
    if end_year <= start_year:
        raise HTTPException(status_code=422, detail="end_year must be greater than start_year")
    spec = _variable(variable)
    try:
        series = await get_series(request.app.state.http, found, spec.parameter)
        result = compute_trend(
            found, series, spec, start_year=start_year, end_year=end_year
        )
    except PowerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except SeriesRejected as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    p_map: dict[str, float] = {found.id: float(result["pValue"])}
    for other in REGIONS:
        if other.id == found.id:
            continue
        try:
            other_series = await get_series(
                request.app.state.http, other, spec.parameter
            )
            other_res = compute_trend(
                other, other_series, spec, start_year=start_year, end_year=end_year
            )
            p_map[other.id] = float(other_res["pValue"])
        except Exception:
            continue

    q_map = compute_fdr_qvalues(p_map)
    result["qValue"] = q_map.get(found.id, result["pValue"])
    result["events"] = await fetch_region_eonet_events(request.app.state.http, found)
    supplemental = get_region_supplemental(found, spec.id)
    if supplemental is not None:
        result["supplemental"] = supplemental

    return result


@app.get("/api/trends")
async def trends(
    request: Request,
    variable: str = Query(default=DEFAULT_VARIABLE),
    start_year: int = Query(default=1981, ge=1981, le=2025),
    end_year: int = Query(default=2025, ge=1981, le=2025),
) -> dict[str, object]:
    spec = _variable(variable)
    if end_year <= start_year:
        raise HTTPException(status_code=422, detail="end_year must be greater than start_year")

    async def one(region: Region) -> dict[str, object]:
        try:
            series = await get_series(request.app.state.http, region, spec.parameter)
            result = compute_trend(
                region, series, spec, start_year=start_year, end_year=end_year
            )
        except (PowerError, SeriesRejected) as exc:
            return {"regionId": region.id, "error": str(exc)}
        return {
            "regionId": region.id,
            "slopePerDecade": result["slopePerDecade"],
            "direction": result["direction"],
            "significance": result["significance"],
            "pValue": result["pValue"],
            "unit": result["unit"],
            "startYear": result["startYear"],
            "endYear": result["endYear"],
        }

    raw_points = list(await asyncio.gather(*(one(region) for region in REGIONS)))
    valid_p = {
        str(pt["regionId"]): float(pt["pValue"])
        for pt in raw_points
        if "pValue" in pt and isinstance(pt["pValue"], (int, float))
    }
    q_map = compute_fdr_qvalues(valid_p)
    for pt in raw_points:
        rid = str(pt.get("regionId", ""))
        if rid in q_map:
            pt["qValue"] = q_map[rid]

    return {
        "variable": spec.id,
        "unit": spec.unit,
        "startYear": start_year,
        "endYear": end_year,
        "points": raw_points,
    }
