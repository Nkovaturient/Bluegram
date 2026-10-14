"""Monthly trend: short-gap fill, deseasonalize, Mann-Kendall, Sen slope.

Uses pymannkendall.original_test.
"""

import math
from dataclasses import dataclass

from pymannkendall import original_test
from scipy.stats import theilslopes

from power import PowerSeries
from regions import Region
from variables import VariableSpec

MIN_USABLE_MONTHS = 20 * 12
SHORT_GAP_MONTHS = 3


class SeriesRejected(Exception):
    """The NASA series cannot support a 20-year trend. Not a substitute result."""


@dataclass(frozen=True)
class MonthPoint:
    year: int
    month: int
    value: float | None


def compute_trend(region: Region, series: PowerSeries, variable: VariableSpec) -> dict[str, object]:
    observed = _observed_months(series)
    usable = [point for point in observed if point.value is not None]
    if len(usable) < MIN_USABLE_MONTHS:
        raise SeriesRejected(
            f"Fewer than 20 years of usable months ({len(usable)} after dropping fill values)"
        )
    years = {point.year for point in usable}
    if len(years) < 20:
        raise SeriesRejected(
            f"Fewer than 20 years with usable months ({len(years)} years)"
        )
    analysis = _interpolate_short_gaps(_continuous(observed))
    analysis = _trim_edges(analysis)
    if any(point.value is None for point in analysis):
        raise SeriesRejected(
            "Series still has gaps longer than 3 months after interpolation"
        )
    if len(analysis) < MIN_USABLE_MONTHS:
        raise SeriesRejected(
            f"Fewer than 20 years of usable months ({len(analysis)} after preprocessing)"
        )
    raw_values = [point.value for point in analysis]
    months = [point.month for point in analysis]
    if any(value is None for value in raw_values):
        raise SeriesRejected("Preprocessed series still contains missing months")
    values = [float(value) for value in raw_values if value is not None]
    anomalies = _deseasonalize(values, months)
    times = [_decimal_year(point.year, point.month) for point in analysis]
    fit = theilslopes(anomalies, times)
    slope_per_year = float(fit[0])
    test = original_test(anomalies)
    p_value = float(test.p)
    if not math.isfinite(slope_per_year) or not math.isfinite(p_value):
        raise SeriesRejected("Mann-Kendall or Theil-Sen returned a non-finite result")
    chart_series = [
        {"date": f"{point.year:04d}-{point.month:02d}", "value": point.value}
        for point in usable
        if point.value is not None
    ]
    annual = _annual_means(usable)
    if len(annual) == 0:
        raise SeriesRejected("Observed series produced no annual means")
    return {
        "region": {
            "id": region.id,
            "name": region.name,
            "latitude": region.latitude,
            "longitude": region.longitude,
        },
        "variable": variable.id,
        "variableLabel": variable.label,
        "unit": variable.unit,
        "units": series.units,
        "dataSource": "nasa",
        "direction": _direction(slope_per_year),
        "significance": _significance(p_value),
        "pValue": p_value,
        "slopePerYear": slope_per_year,
        "slopePerDecade": slope_per_year * 10.0,
        "nMonths": len(chart_series),
        "mkTrend": str(test.trend),
        "series": chart_series,
        "annual": [{"year": year, "value": value} for year, value in annual],
        "slopeLine": _slope_line(annual, slope_per_year),
    }


def _observed_months(series: PowerSeries) -> list[MonthPoint]:
    points: list[MonthPoint] = []
    for key, raw_value in series.values.items():
        if len(key) != 6 or not key.isdigit():
            continue
        year = int(key[:4])
        month = int(key[4:])
        if month < 1 or month > 12:
            continue
        value = None if _is_fill(raw_value, series.fill_value) else raw_value
        points.append(MonthPoint(year, month, value))
    points.sort(key=lambda point: (point.year, point.month))
    if len(points) == 0:
        raise SeriesRejected("NASA POWER series contained no monthly values")
    return points


def _is_fill(value: float, fill_value: float) -> bool:
    return math.isclose(value, fill_value, abs_tol=1e-3) or math.isclose(
        value, -999.0, abs_tol=1e-3
    )


def _continuous(points: list[MonthPoint]) -> list[MonthPoint]:
    lookup = {(point.year, point.month): point.value for point in points}
    start = points[0].year * 12 + (points[0].month - 1)
    end = points[-1].year * 12 + (points[-1].month - 1)
    grid: list[MonthPoint] = []
    for index in range(start, end + 1):
        year = index // 12
        month = index % 12 + 1
        grid.append(MonthPoint(year, month, lookup.get((year, month))))
    return grid


def _interpolate_short_gaps(points: list[MonthPoint]) -> list[MonthPoint]:
    values: list[float | None] = [point.value for point in points]
    index = 0
    count = len(values)
    while index < count:
        if values[index] is not None:
            index += 1
            continue
        end = index
        while end < count and values[end] is None:
            end += 1
        gap = end - index
        left = index - 1
        right = end
        if (
            gap <= SHORT_GAP_MONTHS
            and left >= 0
            and right < count
            and values[left] is not None
            and values[right] is not None
        ):
            left_value = values[left]
            right_value = values[right]
            if left_value is None or right_value is None:
                index = end
                continue
            span = gap + 1
            for step in range(gap):
                weight = (step + 1) / span
                values[index + step] = left_value * (1.0 - weight) + right_value * weight
        index = end
    return [
        MonthPoint(point.year, point.month, values[offset])
        for offset, point in enumerate(points)
    ]


def _trim_edges(points: list[MonthPoint]) -> list[MonthPoint]:
    start = 0
    end = len(points)
    while start < end and points[start].value is None:
        start += 1
    while end > start and points[end - 1].value is None:
        end -= 1
    return points[start:end]


def _deseasonalize(values: list[float], months: list[int]) -> list[float]:
    totals = [0.0] * 13
    counts = [0] * 13
    for value, month in zip(values, months, strict=True):
        totals[month] += value
        counts[month] += 1
    means = [0.0] * 13
    for month in range(1, 13):
        if counts[month] == 0:
            raise SeriesRejected(f"No usable observations in calendar month {month}")
        means[month] = totals[month] / counts[month]
    return [value - means[month] for value, month in zip(values, months, strict=True)]


def _decimal_year(year: int, month: int) -> float:
    return year + (month - 0.5) / 12.0


def _direction(slope_per_year: float) -> str:
    if slope_per_year > 0:
        return "increasing"
    if slope_per_year < 0:
        return "decreasing"
    return "no trend"


def _significance(p_value: float) -> str:
    if p_value < 0.05:
        return "significant"
    if p_value <= 0.10:
        return "borderline"
    return "not_significant"


def _annual_means(points: list[MonthPoint]) -> list[tuple[int, float]]:
    buckets: dict[int, list[float]] = {}
    for point in points:
        if point.value is None:
            continue
        buckets.setdefault(point.year, []).append(point.value)
    annual: list[tuple[int, float]] = []
    for year in sorted(buckets):
        values = buckets[year]
        if len(values) < 8:
            continue
        annual.append((year, sum(values) / len(values)))
    return annual


def _slope_line(
    annual: list[tuple[int, float]], slope_per_year: float
) -> list[dict[str, float | int]]:
    years = [year for year, _value in annual]
    values = [value for _year, value in annual]
    x_bar = sum(years) / len(years)
    y_bar = sum(values) / len(values)
    return [
        {"year": year, "value": y_bar + slope_per_year * (year - x_bar)}
        for year in years
    ]
