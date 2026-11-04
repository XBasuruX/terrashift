import itertools
import calendar
from datetime import date, timedelta
from statistics import mean
from ..contracts import Farm, Scenario
from ..knowledge import CROPS
from .climate import hargreaves


def validate_crops(farm, alternatives=None):
    names = farm.existing + farm.allowed_crops + [farm.previous_crop]
    if alternatives:
        if any(len(seq) != 4 for seq in alternatives):
            raise ValueError("Each alternative must have exactly four seasons.")
        names += list(itertools.chain.from_iterable(alternatives))
    if set(names) - CROPS.keys():
        raise ValueError(
            "Unknown crop identifiers: " + ", ".join(sorted(set(names) - CROPS.keys()))
        )


def calendar_weather(records, scenario):
    """Replay a selected historical year (dry/wet) or mean month-day weather."""
    by_year = {}
    for r in records:
        by_year.setdefault(r.date.year, []).append(r)
    eligible = [
        (sum(r.precipitation for r in rows), year)
        for year, rows in by_year.items()
        if len(rows) == (366 if calendar.isleap(year) else 365)
        and all(r.precipitation is not None for r in rows)
    ]
    selected_year = None
    if scenario.kind in ("dry", "wet"):
        if len(eligible) < 2:
            raise ValueError(
                "Historical dry/wet replay requires at least two complete years of rainfall. Widen the interval or use custom perturbations."
            )
        selected_year = (min(eligible) if scenario.kind == "dry" else max(eligible))[1]
        records = [r for r in records if r.date.year == selected_year]
    grouped = {}
    for r in records:
        grouped.setdefault(r.date.strftime("%m-%d"), []).append(r)
    weather = {}
    for key, rows in grouped.items():

        def avg(field):
            values = [getattr(r, field) for r in rows if getattr(r, field) is not None]
            return mean(values) if len(values) == len(rows) else None

        weather[key] = {
            f: avg(f) for f in ("temperature", "minimum", "maximum", "precipitation")
        }
    return weather, selected_year


def season_metrics(crop_id, slot, farm, weather, scenario):
    crop = CROPS[crop_id]
    month_offset = farm.season_start_month - 1 + slot * 6
    start = date(2025 + month_offset // 12, month_offset % 12 + 1, 1)
    capacity = farm.available_water_mm
    storage = capacity * 0.5
    unmet = demand = rainfall = runoff = 0.0
    heat = frost = valid = unsuitable = 0
    trace = []
    for i in range(crop["days"]):
        day = start + timedelta(days=i)
        row = weather.get(day.strftime("%m-%d"))
        if not row or any(row[f] is None for f in row):
            continue
        t, lo, hi = (
            row[f] + scenario.temperature_delta
            for f in ("temperature", "minimum", "maximum")
        )
        eto = hargreaves(t, lo, hi, farm.latitude, day.timetuple().tm_yday)
        if eto is None:
            continue
        p = row["precipitation"] * scenario.rainfall_factor
        # Explicit educational assumption: constant season-average Kc, no paddy seepage.
        need = eto * crop["kc"]
        water_in = p + farm.irrigation_mm / crop["days"]
        overflow = max(0, storage + water_in - capacity)
        available = min(capacity, storage + water_in)
        actual = min(need, available)
        storage = max(0, available - actual)
        unmet += need - actual
        demand += need
        rainfall += p
        runoff += overflow
        heat += hi > crop["max_temp"]
        frost += lo < 0
        unsuitable += t < crop["min_temp"] or t > crop["max_temp"]
        valid += 1
        if i % 7 == 0:
            trace.append(
                dict(
                    day=i + 1,
                    storage_mm=round(storage, 1),
                    deficit_mm=round(need - actual, 2),
                )
            )
    if valid != crop["days"]:
        raise ValueError(
            f"Complete daily temperature and rain are needed for {crop_id}, slot {slot + 1} ({valid}/{crop['days']} days). Widen the date interval or use simulation."
        )
    warnings = []
    if crop["days"] > farm.season_length_days:
        warnings.append("Crop duration exceeds the configured growing season.")
    if crop["paddy"] and farm.equipment != "paddy":
        warnings.append("Paddy equipment / field preparation is unavailable.")
    if crop_id not in farm.allowed_crops:
        warnings.append("Outside farmer crop preferences.")
    if heat:
        warnings.append(f"{heat} replay days exceed illustrative heat threshold.")
    if frost:
        warnings.append(f"{frost} replay days have frost risk.")
    hard = (
        crop["days"] <= farm.season_length_days
        and (not crop["paddy"] or farm.equipment == "paddy")
        and crop_id in farm.allowed_crops
    )
    return dict(
        crop=crop_id,
        slot=slot + 1,
        start_month=start.month,
        days=crop["days"],
        demand_mm=round(demand, 2),
        rainfall_mm=round(rainfall, 2),
        deficit_mm=round(unmet, 2),
        overflow_mm=round(runoff, 2),
        heat_days=heat,
        frost_days=frost,
        suitability=round(100 * (1 - unsuitable / valid), 2),
        feasible=hard,
        warnings=warnings,
        trace=trace,
    )


def normalized_weights(priorities):
    values = priorities.model_dump()
    total = sum(values.values())
    return {k: v / total for k, v in values.items()}


def evaluate(sequence, table, farm):
    seasons = [table[(i, c)] for i, c in enumerate(sequence)]
    all_seq = [farm.previous_crop] + list(sequence)
    breaks = sum(
        CROPS[a]["family"] != CROPS[b]["family"] for a, b in zip(all_seq, all_seq[1:])
    )
    diversity = 50 * len(set(sequence)) / 4 + 50 * breaks / 4
    demand = sum(s["demand_mm"] for s in seasons)
    deficit = sum(s["deficit_mm"] for s in seasons)
    metrics = dict(
        water=round(100 * max(0, 1 - deficit / max(demand, 1)), 2),
        diversity=round(diversity, 2),
        suitability=round(mean(s["suitability"] for s in seasons), 2),
    )
    weights = normalized_weights(farm.priorities)
    contributions = {k: round(metrics[k] * weights[k], 3) for k in metrics}
    warnings = []
    if breaks < 4:
        warnings.append(
            f"{4 - breaks} family repeats including the previous crop; investigate shared pests and diseases locally."
        )
    if any(CROPS[c]["legume"] for c in sequence):
        warnings.append(
            "Legume presence indicates potential nitrogen fixation; nodulation, residues and soil tests determine actual benefit."
        )
    return dict(
        sequence=list(sequence),
        score=round(sum(contributions.values()), 2),
        metrics=metrics,
        contributions=contributions,
        feasible=all(s["feasible"] for s in seasons),
        water_demand_mm=round(demand, 1),
        water_deficit_mm=round(deficit, 1),
        irrigation_volume_m3=round(farm.irrigation_mm * farm.area_ha * 10 * 4, 1),
        legume_seasons=sum(CROPS[c]["legume"] for c in sequence),
        family_breaks=breaks,
        seasons=seasons,
        warnings=warnings,
    )


def dominates(a, b):
    return all(a["metrics"][k] >= b["metrics"][k] for k in a["metrics"]) and any(
        a["metrics"][k] > b["metrics"][k] for k in a["metrics"]
    )


def analyze_rotations(farm, records, scenario, alternatives=None):
    validate_crops(farm, alternatives)
    weather, replay_year = calendar_weather(records, scenario)
    crops = set(
        farm.allowed_crops
        + farm.existing
        + (list(itertools.chain.from_iterable(alternatives)) if alternatives else [])
    )
    table = {
        (i, c): season_metrics(c, i, farm, weather, scenario)
        for i in range(4)
        for c in crops
    }
    baseline = evaluate(farm.existing, table, farm)
    candidates = [
        evaluate(seq, table, farm)
        for seq in itertools.product(sorted(set(farm.allowed_crops)), repeat=4)
    ]
    candidates = [
        c for c in candidates if c["feasible"] and c["sequence"] != farm.existing
    ]
    candidates.sort(key=lambda c: (-c["score"], c["sequence"]))
    if alternatives:
        chosen = [evaluate(seq, table, farm) for seq in alternatives]
    else:
        if len(candidates) < 2:
            raise ValueError(
                "Fewer than two distinct feasible alternatives. Allow more crops, extend the season, or review equipment constraints."
            )
        best = candidates[0]
        # A water-lean alternative exposes demand/diversity tradeoffs even when
        # the weighted optimum already maximizes the diversity index.
        other = sorted(
            (c for c in candidates if c["sequence"] != best["sequence"]),
            key=lambda c: (
                -c["metrics"]["water"],
                c["water_demand_mm"],
                -c["metrics"]["diversity"],
                c["sequence"],
            ),
        )[0]
        chosen = [best, other]
    results = [baseline] + chosen
    # Robustness: fixed hypothetical perturbations applied to the same replay calendar.
    stress_scenarios = [
        ("Replay", Scenario()),
        ("Dry −30%", Scenario(rainfall_factor=0.7)),
        ("Warm +2°C", Scenario(temperature_delta=2)),
        ("Combined", Scenario(temperature_delta=2, rainfall_factor=0.7)),
    ]
    for idx, r in enumerate(results):
        r.update(
            id=["existing", "balanced", "diverse"][idx],
            name=[
                "Existing rotation",
                "Priority-led alternative",
                "Water-lean alternative",
            ][idx],
        )
        r["pareto"] = not any(dominates(other, r) for other in results)
        r["stress"] = []
        for label, stress in stress_scenarios:
            stress_table = {
                (i, c): season_metrics(c, i, farm, weather, stress)
                for i, c in enumerate(r["sequence"])
            }
            v = evaluate(r["sequence"], stress_table, farm)
            r["stress"].append(
                dict(scenario=label, score=v["score"], deficit_mm=v["water_deficit_mm"])
            )
        r["robust_score"] = min(s["score"] for s in r["stress"])
        r["sensitivity"] = []
        for delta in (-2, 0, 2, 4):
            st = Scenario(
                temperature_delta=delta, rainfall_factor=scenario.rainfall_factor
            )
            v = evaluate(
                r["sequence"],
                {
                    (i, c): season_metrics(c, i, farm, weather, st)
                    for i, c in enumerate(r["sequence"])
                },
                farm,
            )
            r["sensitivity"].append(dict(delta=delta, score=v["score"]))
    # Candidate frontier in 3 criteria, grouped by equal metrics to avoid duplicate points.
    unique = {}
    for c in candidates:
        unique.setdefault(tuple(c["metrics"].values()), c)
    frontier = []
    for c in unique.values():
        if any(dominates(f, c) for f in frontier):
            continue
        frontier = [f for f in frontier if not dominates(c, f)] + [c]
    return dict(
        rotations=results,
        weights=normalized_weights(farm.priorities),
        candidate_count=len(candidates),
        frontier=[
            dict(sequence=c["sequence"], **c["metrics"], score=c["score"])
            for c in sorted(frontier, key=lambda c: -c["score"])[:40]
        ],
        frontier_total=len(frontier),
        replay_year=replay_year,
        scenario=scenario.model_dump(),
        model="Educational screening model v1; no yield, profit, nutrient or erosion predictions",
        assumptions=[
            "Month-day weather is averaged across selected years, or replayed from the driest/wettest complete selected year. Dry/wet selection uses annual rainfall, not seasonal extremes.",
            "Four consecutive half-year planting slots; fixed crop durations and constant illustrative Kc. Independent seasons reset storage to 50% of user capacity.",
            "Hargreaves ET₀ is uncalibrated; Ra is converted to equivalent water depth. Rice seepage and ponding are not modeled.",
            "Daily bucket: rain + uniformly distributed irrigation; overflow is discarded; no capillary rise. Soil storage is farmer-entered, not SMAP.",
            "Water score is fraction of modeled ET demand supplied. Diversity combines crop variety and family breaks. Suitability counts days inside illustrative temperature limits.",
            "Weights express farmer preferences; scores are indices, not probabilities or predicted effectiveness. Market notes and root traits are contextual, not scored.",
            "Stress tests are hypothetical perturbations of the chosen replay; no climate forecasts or statistical confidence intervals.",
        ],
    )
