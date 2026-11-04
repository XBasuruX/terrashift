"""Download bounded all-band MOD13Q1 subsets (<= 8 composites per request)."""

import asyncio
import json
from datetime import date, timedelta, datetime, timezone
from pathlib import Path
import httpx


async def main():
    batches = []
    receipts = []
    async with httpx.AsyncClient(timeout=40, follow_redirects=True) as client:
        start = date(2023, 1, 1)
        end = date(2025, 12, 31)
        while start <= end:
            stop = min(end, start + timedelta(days=119))
            params = dict(
                latitude=8.3114,
                longitude=80.4037,
                startDate=start.strftime("A%Y%j"),
                endDate=stop.strftime("A%Y%j"),
                kmAboveBelow=0,
                kmLeftRight=0,
            )
            r = await client.get(
                "https://modis.ornl.gov/rst/api/v1/MOD13Q1/subset",
                params=params,
                headers={"Accept": "application/json"},
            )
            r.raise_for_status()
            batches.append(r.json())
            receipts.append(str(r.url))
            print(start, stop, r.status_code, len(r.content), flush=True)
            start = stop + timedelta(days=1)
    path = (
        Path(__file__).resolve().parents[1]
        / "backend/fixtures/modis_anuradhapura_2023_2025.json"
    )
    path.write_text(
        json.dumps(
            dict(
                latitude=8.3114,
                longitude=80.4037,
                start="2023-01-01",
                end="2025-12-31",
                retrieved_at=datetime.now(timezone.utc).isoformat(),
                requests=receipts,
                batches=batches,
            )
        )
    )
    print("Saved", path, flush=True)


if __name__ == "__main__":
    asyncio.run(main())
