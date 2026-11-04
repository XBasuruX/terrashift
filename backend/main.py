import sys
import os

_backend_dir = os.path.dirname(os.path.abspath(__file__))
if _backend_dir not in sys.path:
    sys.path.insert(0, _backend_dir)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool

try:
    from .contracts import AnalysisRequest, ClimateQuery
    from .providers.service import get_climate
    from .science.climate import summarize
    from .science.rotation import analyze_rotations
    from .knowledge import CROPS, SOURCES
    from .providers.modis import get_vegetation
    from .responses import ClimateResponse, AnalysisResponse
    from .land import router as land_router
    from .vector_maps import router as vector_router
except (ImportError, ValueError):
    from contracts import AnalysisRequest, ClimateQuery
    from providers.service import get_climate
    from science.climate import summarize
    from science.rotation import analyze_rotations
    from knowledge import CROPS, SOURCES
    from providers.modis import get_vegetation
    from responses import ClimateResponse, AnalysisResponse
    from land import router as land_router
    from vector_maps import router as vector_router


app = FastAPI(
    title="TerraShift API",
    version="1.0.0",
    description="Transparent educational crop-rotation screening, not validated agronomic advice.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:3000", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
app.include_router(land_router)
app.include_router(vector_router)


@app.get("/api/health")
def health():
    return {"status": "ok", "model_version": "1.0.0"}


@app.get("/api/catalog")
def catalog():
    return {"crops": CROPS, "sources": SOURCES}


@app.post("/api/climate", response_model=ClimateResponse)
async def climate(query: ClimateQuery):
    try:
        records, provenance = await get_climate(query)
        return {
            **summarize(records, query.latitude),
            "daily": [r.model_dump(mode="json") for r in records],
            "provenance": provenance,
        }
    except (ValueError, KeyError) as error:
        raise HTTPException(422, detail=str(error)) from error


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    try:
        records, provenance = await get_climate(request.climate)
        result = await run_in_threadpool(
            analyze_rotations,
            request.farm,
            records,
            request.scenario,
            request.alternatives,
        )
        return {**result, "provenance": provenance, "farm": request.farm.model_dump()}
    except (ValueError, KeyError) as error:
        raise HTTPException(422, detail=str(error)) from error


@app.post("/api/vegetation")
async def vegetation(query: ClimateQuery):
    try:
        return await get_vegetation(query)
    except (ValueError, KeyError) as error:
        raise HTTPException(422, detail=str(error)) from error
