"""Capture real CMR discovery responses. Metadata is not a scientific raster sample."""

import asyncio
import json
from datetime import datetime, timezone
from pathlib import Path
import httpx

PRODUCTS = {
    "smap": ("SPL3SMP_E", "005"),
    "imerg": ("GPM_3IMERGDF", "07"),
    "ecostress": ("ECO_L2T_LSTE", "003"),
    "hls": ("HLSL30", "2.0"),
    "modis": ("MOD13Q1", "061"),
}
ROOT = Path(__file__).resolve().parents[1]


async def main():
    async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:

        async def capture(key, product):
            params = dict(short_name=product[0], version=product[1], page_size=1)
            try:
                response = await client.get(
                    "https://cmr.earthdata.nasa.gov/search/granules.json", params=params
                )
                response.raise_for_status()
                payload = response.json()
                target = ROOT / "backend/fixtures" / f"cmr_{key}.json"
                target.write_text(json.dumps(payload, indent=2))
                entries = payload.get("feed", {}).get("entry", [])
                print(key, response.status_code, "records", len(entries), flush=True)
                return {
                    "source": key,
                    "url": str(response.url),
                    "retrieved_at": datetime.now(timezone.utc).isoformat(),
                    "record_count": len(entries),
                    "status": "metadata captured",
                }
            except Exception as error:
                print(key, type(error).__name__, flush=True)
                return {"source": key, "status": type(error).__name__}

        results = await asyncio.gather(*(capture(k, v) for k, v in PRODUCTS.items()))
    (ROOT / "backend/fixtures/research_receipts.json").write_text(
        json.dumps(results, indent=2)
    )


if __name__ == "__main__":
    asyncio.run(main())
