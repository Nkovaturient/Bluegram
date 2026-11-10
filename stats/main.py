"""Bluegram stats service.

Run from this directory: .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
"""

import asyncio
import os
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from analysis import SeriesRejected, compute_fdr_qvalues, compute_trend
from partners import (
    fetch_region_eonet_events,
    get_provider_status,
    get_region_supplemental,
)
from power import PowerError, get_series
from regions import BY_ID, REGIONS, Region
from variables import DEFAULT_VARIABLE, VARIABLES, VariableSpec


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
    return {"providers": get_provider_status()}


def _variable(variable: str) -> VariableSpec:
    found = VARIABLES.get(variable)
    if found is None:
        known = ", ".join(VARIABLES)
        raise HTTPException(
            status_code=404, detail=f"Unknown variable '{variable}'. Known: {known}"
        )
    return found


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


@app.get("/api/trend")
async def trend(
    request: Request,
    region: str = Query(min_length=1),
    variable: str = Query(default=DEFAULT_VARIABLE),
) -> dict[str, object]:
    found = BY_ID.get(region)
    if found is None:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")
    spec = _variable(variable)
    try:
        series = await get_series(request.app.state.http, found, spec.parameter)
        result = compute_trend(found, series, spec)
    except PowerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except SeriesRejected as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    # Compute spatial FDR qValue across cached/available regions if available, else fallback to pValue
    p_map: dict[str, float] = {found.id: float(result["pValue"])}
    for other in REGIONS:
        if other.id == found.id:
            continue
        try:
            other_series = await get_series(
                request.app.state.http, other, spec.parameter
            )
            other_res = compute_trend(other, other_series, spec)
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
) -> dict[str, object]:
    spec = _variable(variable)

    async def one(region: Region) -> dict[str, object]:
        try:
            series = await get_series(request.app.state.http, region, spec.parameter)
            result = compute_trend(region, series, spec)
        except (PowerError, SeriesRejected) as exc:
            return {"regionId": region.id, "error": str(exc)}
        return {
            "regionId": region.id,
            "slopePerDecade": result["slopePerDecade"],
            "direction": result["direction"],
            "significance": result["significance"],
            "pValue": result["pValue"],
            "unit": result["unit"],
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

    return {"variable": spec.id, "unit": spec.unit, "points": raw_points}
