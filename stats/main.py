"""Bluegram stats service.

Run from this directory: .venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
"""

import asyncio
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware

from analysis import SeriesRejected, compute_trend
from power import PowerError, get_series
from regions import BY_ID, REGIONS, Region
from variables import DEFAULT_VARIABLE, VARIABLES, VariableSpec


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(
        timeout=httpx.Timeout(120.0, connect=30.0),
        headers={"User-Agent": "Bluegram/0.1 (NASA Space Apps)"},
        follow_redirects=True,
    )
    try:
        yield
    finally:
        await app.state.http.aclose()


app = FastAPI(title="Bluegram stats", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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


def _variable(variable: str) -> VariableSpec:
    found = VARIABLES.get(variable)
    if found is None:
        known = ", ".join(VARIABLES)
        raise HTTPException(status_code=404, detail=f"Unknown variable '{variable}'. Known: {known}")
    return found


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
        return compute_trend(found, series, spec)
    except PowerError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except SeriesRejected as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


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

    points = await asyncio.gather(*(one(region) for region in REGIONS))
    return {"variable": spec.id, "unit": spec.unit, "points": list(points)}
