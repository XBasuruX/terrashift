import math
from datetime import timedelta
from ..contracts import ClimateQuery, Observation


def simulate(query: ClimateQuery) -> list[Observation]:
    """Deterministic, coordinate-dependent synthetic weather; never labeled observed."""
    result = []
    for i in range((query.end - query.start).days + 1):
        day = query.start + timedelta(days=i)
        j = day.timetuple().tm_yday
        phase = 2 * math.pi * (j - 172) / 365.25
        hemisphere = 1 if query.latitude >= 0 else -1
        seasonal = hemisphere * math.cos(phase) * min(18, abs(query.latitude) * 0.45)
        noise = math.sin(day.toordinal() * 1.719 + query.longitude) * 1.8
        t = 29 - abs(query.latitude) * 0.4 + seasonal + noise
        rain_season = (
            1 + math.cos(2 * math.pi * (j - 295) / 365.25 + query.longitude / 40)
        ) / 2
        pulse = max(0, math.sin(day.toordinal() * 2.417 + query.latitude)) ** 5
        rain = (2 + 24 * rain_season) * pulse
        result.append(
            Observation(
                date=day,
                temperature=round(t, 2),
                minimum=round(t - 4, 2),
                maximum=round(t + 6, 2),
                precipitation=round(rain, 2),
                solar=round(4.5 + math.sin(phase), 2),
                humidity=70,
                wind=2,
            )
        )
    return result
