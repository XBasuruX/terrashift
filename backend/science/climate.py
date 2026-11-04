import calendar
import math
from collections import defaultdict
from statistics import mean
from ..contracts import Observation


def radiation_mj(latitude: float, day_of_year: int) -> float:
    """FAO-56 equations 21, 23–25. Extraterrestrial radiation MJ/m²/day."""
    phi = math.radians(latitude)
    dr = 1 + 0.033 * math.cos(2 * math.pi * day_of_year / 365)
    delta = 0.409 * math.sin(2 * math.pi * day_of_year / 365 - 1.39)
    sunset = math.acos(max(-1, min(1, -math.tan(phi) * math.tan(delta))))
    return max(
        0,
        (24 * 60 / math.pi)
        * 0.0820
        * dr
        * (
            sunset * math.sin(phi) * math.sin(delta)
            + math.cos(phi) * math.cos(delta) * math.sin(sunset)
        ),
    )


def hargreaves(tmean, tmin, tmax, latitude, day_of_year):
    """FAO-56 eq 52: Ra is converted from MJ/m²/day to equivalent mm/day."""
    if any(v is None for v in (tmean, tmin, tmax)) or tmax < tmin:
        return None
    return max(
        0,
        0.0023
        * (tmean + 17.8)
        * math.sqrt(tmax - tmin)
        * 0.408
        * radiation_mj(latitude, day_of_year),
    )


def summarize(records: list[Observation], latitude: float):
    grouped = defaultdict(list)
    for r in records:
        grouped[r.date.strftime("%Y-%m")].append(r)
    months = []
    for month, rows in sorted(grouped.items()):

        def values(field):
            return [getattr(r, field) for r in rows if getattr(r, field) is not None]

        temp, rain = values("temperature"), values("precipitation")
        eto = [
            hargreaves(
                r.temperature,
                r.minimum,
                r.maximum,
                latitude,
                r.date.timetuple().tm_yday,
            )
            for r in rows
        ]
        eto = [v for v in eto if v is not None]
        # Partial sums must never look like complete calendar-month totals.
        expected = calendar.monthrange(int(month[:4]), int(month[5:]))[1]
        complete = len(rows) == expected
        months.append(
            dict(
                month=month,
                temperature=round(mean(temp), 2)
                if len(temp) >= 0.8 * len(rows)
                else None,
                precipitation=round(sum(rain), 2)
                if complete and len(rain) == expected
                else None,
                eto=round(sum(eto), 2) if complete and len(eto) == expected else None,
                coverage=round(min(len(temp), len(rain)) / expected, 3),
                valid_days=min(len(temp), len(rain)),
                expected_days=expected,
            )
        )
    temp = [r.temperature for r in records if r.temperature is not None]
    rain = [r.precipitation for r in records if r.precipitation is not None]
    maximum = [r.maximum for r in records if r.maximum is not None]
    minimum = [r.minimum for r in records if r.minimum is not None]
    dry_spell = longest = 0
    for r in records:
        dry_spell = (
            dry_spell + 1 if r.precipitation is not None and r.precipitation < 1 else 0
        )
        longest = max(longest, dry_spell)
    anomalies = []
    for m in months:
        peers = [
            x["temperature"]
            for x in months
            if x["month"][5:] == m["month"][5:] and x["temperature"] is not None
        ]
        anomalies.append(
            dict(
                month=m["month"],
                departure=round(m["temperature"] - mean(peers), 2)
                if m["temperature"] is not None and len(peers) >= 3
                else None,
            )
        )
    return dict(
        monthly=months,
        summary=dict(
            temperature=round(mean(temp), 1) if temp else None,
            precipitation=round(sum(rain), 1) if len(rain) == len(records) else None,
            heat_days=sum(v > 35 for v in maximum),
            frost_days=sum(v < 0 for v in minimum),
            longest_dry_spell=longest,
            coverage=round(min(len(temp), len(rain)) / len(records), 3),
        ),
        anomalies=anomalies,
        anomaly_note="Departure from same-month mean within selected interval; requires ≥3 years. Not a long-term climate anomaly.",
    )
