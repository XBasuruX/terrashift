"""Reproducible end-to-end calculation without running a web server."""

import asyncio
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.contracts import Farm, ClimateQuery, Scenario
from backend.providers.service import get_climate
from backend.science.rotation import analyze_rotations


async def main():
    farm = Farm(latitude=8.3114, longitude=80.4037)
    query = ClimateQuery(
        latitude=farm.latitude,
        longitude=farm.longitude,
        start="2023-01-01",
        end="2025-12-31",
        mode="cached",
    )
    records, provenance = await get_climate(query)
    result = analyze_rotations(farm, records, Scenario())
    target = Path(__file__).resolve().parents[1] / "examples/result.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(
        json.dumps(
            {"farm": farm.model_dump(), "provenance": provenance, **result}, indent=2
        )
    )
    print(
        f"Mode: {provenance['mode']}; {len(records)} daily records; {result['candidate_count']} feasible alternatives"
    )
    for r in result["rotations"]:
        print(r["name"], " -> ".join(r["sequence"]), r["score"], "index / 100")
    print("Inspect", target)


if __name__ == "__main__":
    asyncio.run(main())
