"""NASA POWER monthly point fetch. Successful series stay in process memory."""

import asyncio
from dataclasses import dataclass

import httpx

from regions import Region

POWER_URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
_MAX_IN_FLIGHT = 5
_semaphore = asyncio.Semaphore(_MAX_IN_FLIGHT)
_cache: dict[str, "PowerSeries"] = {}


class PowerError(Exception):
    """NASA POWER failed. Callers must surface this and must not invent a series."""


@dataclass(frozen=True)
class PowerSeries:
    fill_value: float
    units: str
    values: dict[str, float]


def _cache_key(region: Region, parameter: str) -> str:
    return f"{region.id}:{parameter}:{region.latitude}:{region.longitude}"


async def get_series(client: httpx.AsyncClient, region: Region, parameter: str) -> PowerSeries:
    key = _cache_key(region, parameter)
    cached = _cache.get(key)
    if cached is not None:
        return cached
    async with _semaphore:
        cached = _cache.get(key)
        if cached is not None:
            return cached
        fetched = await _fetch(client, region, parameter)
        _cache[key] = fetched
        return fetched


async def _fetch(client: httpx.AsyncClient, region: Region, parameter: str) -> PowerSeries:
    params: dict[str, str | float | int] = {
        "parameters": parameter,
        "community": "AG",
        "latitude": region.latitude,
        "longitude": region.longitude,
        "start": 1981,
        "end": 2025,
        "format": "JSON",
    }
    try:
        response = await client.get(POWER_URL, params=params)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        body = exc.response.text[:300]
        raise PowerError(
            f"NASA POWER returned HTTP {exc.response.status_code}: {body}"
        ) from exc
    except httpx.HTTPError as exc:
        raise PowerError(f"NASA POWER request failed: {exc}") from exc
    try:
        payload = response.json()
    except ValueError as exc:
        raise PowerError("NASA POWER returned a non-JSON body") from exc
    return _parse(payload, parameter)


def _parse(payload: object, parameter: str) -> PowerSeries:
    if not isinstance(payload, dict):
        raise PowerError("NASA POWER returned an unexpected payload")
    properties = payload.get("properties")
    parameter_block = properties.get("parameter") if isinstance(properties, dict) else None
    raw_series = parameter_block.get(parameter) if isinstance(parameter_block, dict) else None
    if not isinstance(raw_series, dict) or len(raw_series) == 0:
        raise PowerError(
            f"NASA POWER returned no {parameter} series ({payload.get('messages')})"
        )
    values: dict[str, float] = {}
    for key, raw_value in raw_series.items():
        if not isinstance(key, str):
            continue
        if isinstance(raw_value, bool) or not isinstance(raw_value, (int, float)):
            continue
        values[key] = float(raw_value)
    if len(values) == 0:
        raise PowerError(f"NASA POWER {parameter} series had no numeric values")
    header = payload.get("header")
    fill_value = -999.0
    if isinstance(header, dict) and isinstance(header.get("fill_value"), (int, float)):
        fill_value = float(header["fill_value"])
    units = "C"
    parameters = payload.get("parameters")
    if isinstance(parameters, dict):
        meta = parameters.get(parameter)
        if isinstance(meta, dict) and isinstance(meta.get("units"), str):
            units = meta["units"]
    return PowerSeries(fill_value=fill_value, units=units, values=values)
