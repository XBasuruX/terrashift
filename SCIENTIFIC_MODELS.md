# Scientific models and interpretation

The deterministic layer is in `backend/science`. It is independent of HTTP and visualization. This is a transparent screening system, not a calibrated crop-growth model. Passing code tests proves neither agricultural validity nor effectiveness.

## 1. Weather aggregation

Monthly temperature is the arithmetic mean of valid daily T2M, subject to coverage rules. Precipitation and ET₀ are calendar-month sums, withheld for incomplete months. A dry spell counts consecutive available days with precipitation below 1 mm. Missing rain interrupts a spell. Heat days count daily TMAX >35°C in the dashboard; crop-specific heat flags use the displayed illustrative crop threshold. Frost days count TMIN <0°C.

Month-to-month temperature departures use a same-month mean within the selected interval and require at least three years of valid values. These are not anomalies against a 30-year normal and do not establish a climate trend.

## 2. Extraterrestrial radiation and reference ET

Reference: [FAO Irrigation and Drainage Paper 56, chapter 3](https://www.fao.org/4/x0490e/x0490e07.htm), equations 21–25 and 52.

For latitude φ (radians), Julian day J:

```text
dr = 1 + 0.033 cos(2π J / 365)
δ = 0.409 sin(2π J / 365 − 1.39)
ωs = arccos(clamp(−tan φ tan δ, −1, 1))
Ra = (24 × 60 / π) × 0.0820 × dr ×
     [ωs sin φ sin δ + cos φ cos δ sin ωs]      MJ m⁻² day⁻¹
Ra_mm = 0.408 × Ra                             mm day⁻¹ equivalent
ET0 = max(0, 0.0023 (Tmean + 17.8) √(Tmax−Tmin) Ra_mm)
```

Daily temperatures are °C. ET₀ is mm/day. TMAX<TMIN or missing temperatures returns unavailable, not an invented estimate. Polar bounds are clamped to avoid an invalid arccos, but high-latitude applicability remains limited. The numerical test checks FAO Example 8 independently: September 3, 20°S gives about 32.2 MJ/m²/day.

This is **Hargreaves**, not FAO Penman–Monteith. It is uncalibrated locally and can be biased in humid/high-wind settings. Although POWER supplies radiation, humidity and wind, this implementation does not claim full FAO-56 PM because it has not implemented/validated all net-radiation, vapor-pressure and surface assumptions. The 0.408 conversion is necessary because equation 52 uses equivalent-water-depth radiation.

## 3. Weather replay and scenarios

The typical/custom replay averages observations by month-day across the selected interval. Dry/wet replay selects the minimum/maximum **annual rainfall total** among at least two complete selected years, including leap-year completeness. It is not the locally worst growing season, drought return period or climate normal.

Four planting slots begin six months apart. A fixed non-leap calendar supports month-day replay. Crops occupy their configured number of days. Temperature shifts add uniformly to mean/min/max; rainfall multiplies each daily amount. These are hypothetical sensitivity parameters, not downscaled climate projections. Averaging daily rainfall across years smooths storm variability and can understate drought stress; dry/wet single-year replays preserve that year’s sequence.

## 4. Crop demand and daily water bucket

Crop demand `ETc = illustrative Kc × ET0`. Kc is constant over the crop season; this intentionally does not claim FAO’s full growth-stage coefficient method. Rice demand does not include ponding, seepage or puddling requirements, so comparisons with rice are particularly incomplete.

Each season resets plant-available soil storage S to 50% of the farmer-entered capacity C. Irrigation allocation I is divided uniformly over the crop’s D days:

```text
inflow = rainfall + I / D                       mm/day
overflow = max(0, S + inflow − C)               mm/day
available = min(C, S + inflow)                  mm
supplied_ET = min(ETc, available)               mm/day
unmet_ET = ETc − supplied_ET                    mm/day
S_next = available − supplied_ET               mm
```

All storage/flux terms are water depths. Overflow is discarded; it is not a validated runoff or erosion estimate. No capillary rise, infiltration-rate limit, rooting-stage change, salinity, nutrient balance, carry-over storage, paddy hydrology or stomatal stress curve is modeled. Field area converts irrigation depth to volume: 1 mm over 1 ha = 10 m³; four seasons receive `I × hectares × 10 × 4`. This volume is an input allocation, not a predicted requirement.

Soil texture and root traits are displayed context; user-entered root-zone capacity controls the bucket. Surface SMAP moisture is not substituted. Every modeled crop day must have mean/min/max/rainfall; missing days return a sufficiency error.

## 5. Crop traits and constraints

`knowledge.py` defines crop family, legume identity and visible **illustrative** crop duration, Kc, temperature limits and root depth. Numeric traits were not calibrated to local cultivars. Family identity is categorical; family breaks are only a pest-cycle screening proxy. Legume presence is a hypothesis about nitrogen-fixing potential, with no precise fixation quantity or soil benefit claimed.

Hard feasibility checks: candidate crop allowed by farmer; duration ≤ configured growing window; paddy capability available for rice. Temperature flags and family repeats are soft evidence, not hidden constraints. Local calendars, pests, markets, labor and soil suitability require expert review. Market notes persist into the brief but are not scored.

## 6. Indices and optimization

For a four-season sequence:

```text
Water = 100 × (1 − Σ unmet_ET / Σ ET_demand)
Diversity = 50 × (# unique crops / 4) + 50 × (# family changes / 4)
Temperature_fit = mean across seasons of
                  100 × (# days with crop_min ≤ Tmean ≤ crop_max / valid days)
```

Family changes include the transition from the previous crop into season 1. Weights are nonnegative farmer sliders normalized by their sum; all-zero weights are rejected. The weighted index is `Σ normalized_weight × criterion`. Contributions are displayed. Small rounding differences are not meaningful agricultural differences.

All configured four-crop combinations are enumerated (up to 8⁴ =4,096). The existing rotation remains visible even if infeasible. The priority-led alternative is the highest weighted feasible candidate. The water-lean alternative maximizes adequacy, then minimizes demand, then maximizes diversity, excluding the first alternative. It can expose a low-diversity monoculture: this is a deliberate trade-off to inspect, not an endorsed practice.

The frontier uses all three criteria. A candidate is dominated if another is at least as good on every criterion and strictly better on one. Equal metric combinations are grouped; at most 40 frontier combinations are displayed, with the full count reported. Displayed cards are also marked against the other two displayed options. Lower absolute demand is used to choose the water-lean strategy but is not a fourth frontier objective.

## 7. Robustness, sensitivity and uncertainty

The fixed stress matrix applies replay, rainfall ×0.7, temperature +2°C, and combined +2°C/×0.7 to the selected replay calendar. It does not stack the user’s custom perturbations. Worst-case index is the minimum across these four hypothetical tests. Temperature sensitivity uses −2, 0, +2 and +4°C while holding the selected rainfall factor constant.

These deterministic experiments are not probability distributions, forecasts or statistical confidence intervals. No arbitrary uncertainty band is drawn. Data gaps, source support, trait assumptions and structural model exclusions are disclosed directly. Local calibration, independent weather comparison, cultivar evidence and field trials remain necessary for scientific and practical validation.
