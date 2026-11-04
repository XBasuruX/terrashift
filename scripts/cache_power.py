"""Explicitly download one validated POWER location/interval into genuine cache."""

import argparse
import asyncio
import json
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.contracts import ClimateQuery
from backend.providers.service import get_climate


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--latitude", type=float, required=True)
    parser.add_argument("--longitude", type=float, required=True)
    parser.add_argument("--start", default="20230101")
    parser.add_argument("--end", default="20251231")
    args = parser.parse_args()
    from datetime import datetime

    q = ClimateQuery(
        latitude=args.latitude,
        longitude=args.longitude,
        start=datetime.strptime(args.start, "%Y%m%d").date(),
        end=datetime.strptime(args.end, "%Y%m%d").date(),
        mode="live",
    )
    _, receipt = await get_climate(q)
    print(json.dumps(receipt, indent=2))
    if receipt["mode"] != "live":
        raise SystemExit(
            "Live download failed. Fallback data were NOT written as genuine observations."
        )


if __name__ == "__main__":
    asyncio.run(main())
