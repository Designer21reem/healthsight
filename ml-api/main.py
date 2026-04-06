import sys
import model
sys.modules["__main__"] = model

from model import DiseaseFeatureEngineer, DiseaseModel

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from supabase import create_client
from dotenv import load_dotenv
import pandas as pd
import os
import asyncio
from typing import Optional

load_dotenv()

app = FastAPI(title="Disease Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY"),
)

# Global variables with lazy loading
_disease_model: Optional[DiseaseModel] = None
_df_stats: Optional[pd.DataFrame] = None
_model_load_lock = asyncio.Lock()
_stats_load_lock = asyncio.Lock()


def get_disease_model() -> DiseaseModel:
    """Lazy loader for DiseaseModel - loads only when first needed."""
    global _disease_model
    if _disease_model is None:
        _disease_model = DiseaseModel("disease_pipeline.pkl")
    return _disease_model


async def get_disease_model_async() -> DiseaseModel:
    """Async wrapper for lazy model loading."""
    async with _model_load_lock:
        if _disease_model is None:
            loop = asyncio.get_event_loop()
            _disease_model = await loop.run_in_executor(
                None, lambda: DiseaseModel("disease_pipeline.pkl")
            )
        return _disease_model


def get_stats_sync() -> pd.DataFrame:
    """Synchronous lazy loader for stats DataFrame."""
    global _df_stats
    if _df_stats is None:
        df = pd.read_csv("Infectious Disease 2001-2014.csv")
        _df_stats = (
            df.groupby("Disease")["Rate"]
            .agg(["mean", "std"])
            .reset_index()
        )
    return _df_stats


async def get_stats_async() -> pd.DataFrame:
    """Async wrapper for lazy stats loading."""
    async with _stats_load_lock:
        if _df_stats is None:
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, get_stats_sync)
        return _df_stats


def calc_zscore(disease: str, rate: float) -> float:
    """Calculate z-score using lazy-loaded stats."""
    stats = get_stats_sync()
    match = stats[stats["Disease"] == disease]
    if match.empty:
        return 0.0
    mean = float(match["mean"].values[0])
    std = float(match["std"].values[0])
    return round((rate - mean) / std, 2) if std > 0 else 0.0


def outbreak_from_z(z: float) -> str:
    return "red" if z > 2 else "yellow" if z > 1 else "green"


# ── Root Endpoint (fixes 404) ─────────────────────────────────────────────────
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Disease Prediction API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "GET": {
                "/": "API information",
                "/health": "Health check with model status",
                "/predictions": "Get all predictions (filter by sex)",
                "/predictions/disease/{disease_name}": "Get predictions by disease",
                "/predictions/year/{year}": "Get predictions by year",
                "/predictions/diseases": "Get list of all diseases",
                "/stats": "Get summary statistics"
            },
            "POST": {
                "/predict": "Make a single prediction",
                "/load-csv": "Load and process entire CSV file",
                "/send-alert": "Send outbreak alert to users"
            }
        },
        "docs": "/docs",
        "redoc": "/redoc"
    }


# ── Health Check Endpoint (very fast, no lazy loading) ──
@app.get("/health")
async def health_check():
    """Simple health check that doesn't trigger lazy loading."""
    return {
        "status": "healthy",
        "model_loaded": _disease_model is not None,
        "stats_loaded": _df_stats is not None
    }


# ── Schemas ───────────────────────────────────────────────────────────────────

class PredictionInput(BaseModel):
    """
    Accepts 2-element lists: [previous_row, current_row].

    Example:
        {
          "disease": ["Amebiasis", "Amebiasis"],
          "county":  ["California", "California"],
          "sex":     ["Total", "Total"],
          "year":    [2000, 2001],
          "count":   [571, 442],
          "rate":    [1.654, 1.265]
        }
    """
    disease: list[str]
    county: list[str]
    sex: list[str] = ["Total", "Total"]
    year: list[int]
    count: list[float]
    rate: list[float]


class AlertInput(BaseModel):
    disease: str
    county: str
    year: int
    outbreak_level: str
    message: str


# ── POST /predict ─────────────────────────────────────────────────────────────
@app.post("/predict")
async def predict(data: PredictionInput):
    """Prediction endpoint with lazy loading of model and stats."""
    lengths = {
        len(data.disease), len(data.county), len(data.sex),
        len(data.year), len(data.count), len(data.rate),
    }
    if lengths != {2}:
        raise HTTPException(
            status_code=422,
            detail="Each list must have exactly 2 elements: [previous_year, current_year]",
        )

    if data.year[0] == data.year[1]:
        raise HTTPException(
            status_code=422,
            detail=(
                f"year[0] and year[1] must be different. "
                f"Got both as {data.year[0]}. "
                f"Use consecutive years e.g. [{data.year[0]-1}, {data.year[0]}]."
            ),
        )

    try:
        disease_model = await get_disease_model_async()
        
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: disease_model.predict_pair(
                disease=data.disease[0],
                county=data.county[0],
                sex=data.sex[0],
                year_prev=data.year[0],
                count_prev=data.count[0],
                rate_prev=data.rate[0],
                year_curr=data.year[1],
                count_curr=data.count[1],
                rate_curr=data.rate[1],
            )
        )

        zscore = calc_zscore(data.disease[1], data.rate[1])
        level = outbreak_from_z(zscore)

        response = {
            "prev": {
                "disease": data.disease[0], "county": data.county[0],
                "sex": data.sex[0], "year": data.year[0],
                "count": data.count[0], "rate": data.rate[0],
            },
            "curr": {
                "disease": data.disease[1], "county": data.county[1],
                "sex": data.sex[1], "year": data.year[1],
                "count": data.count[1], "rate": data.rate[1],
            },
            "output_0": round(result["output_0"], 2),
            "output_1": round(result["output_1"], 2),
            "zscore": zscore,
            "outbreak_level": level,
        }

        record = {
            "disease": data.disease[1],
            "county": data.county[1],
            "sex": data.sex[1],
            "year": data.year[1],
            "count": data.count[1],
            "rate": data.rate[1],
            "predicted_cases": round(result["output_1"], 2),
            "zscore": zscore,
            "outbreak_level": level,
        }
        
        await loop.run_in_executor(
            None,
            lambda: supabase.table("predictions").upsert(
                record, on_conflict="disease,county,year,sex"
            ).execute()
        )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /load-csv ────────────────────────────────────────────────────────────
@app.post("/load-csv")
async def load_csv():
    """
    Groups CSV by (Disease, County, Sex), pairs consecutive years,
    runs the model and stores output[1] as predicted_cases.
    """
    try:
        disease_model = await get_disease_model_async()
        loop = asyncio.get_event_loop()
        
        def process_csv():
            df = pd.read_csv("Infectious Disease 2001-2014.csv")
            df.columns = df.columns.str.strip()

            required = {"Disease", "County", "Year", "Sex", "Count", "Rate"}
            missing = required - set(df.columns)
            if missing:
                raise HTTPException(
                    status_code=400,
                    detail=f"CSV missing columns: {missing}. Found: {list(df.columns)}"
                )

            df = df.dropna(subset=list(required))
            df["Year"] = df["Year"].astype(int)
            df["Count"] = df["Count"].astype(float)
            df["Rate"] = df["Rate"].astype(float)
            if "Population" in df.columns:
                df["Population"] = df["Population"].astype(float)

            df = df.sort_values(["Disease", "County", "Sex", "Year"]).reset_index(drop=True)

            records = []
            total_skipped = 0

            for (disease, county, sex), grp in df.groupby(["Disease", "County", "Sex"]):
                grp = grp.sort_values("Year").reset_index(drop=True)

                for i in range(len(grp)):
                    row_curr = grp.iloc[i]

                    if i == 0:
                        year_prev = int(row_curr["Year"]) - 1
                        count_prev = float(row_curr["Count"]) * 0.9
                        rate_prev = float(row_curr["Rate"]) * 0.9
                    else:
                        row_prev = grp.iloc[i - 1]
                        year_prev = int(row_prev["Year"])
                        count_prev = float(row_prev["Count"])
                        rate_prev = float(row_prev["Rate"])

                    year_curr = int(row_curr["Year"])
                    count_curr = float(row_curr["Count"])
                    rate_curr = float(row_curr["Rate"])

                    if year_prev == year_curr:
                        year_prev = year_curr - 1

                    try:
                        result = disease_model.predict_pair(
                            disease=str(disease),
                            county=str(county),
                            sex=str(sex),
                            year_prev=year_prev,
                            count_prev=count_prev,
                            rate_prev=rate_prev,
                            year_curr=year_curr,
                            count_curr=count_curr,
                            rate_curr=rate_curr,
                        )
                        predicted = result["output_1"]
                    except Exception:
                        predicted = count_curr
                        total_skipped += 1

                    zscore = calc_zscore(str(disease), rate_curr)
                    level = outbreak_from_z(zscore)

                    record = {
                        "disease": str(disease),
                        "county": str(county),
                        "sex": str(sex),
                        "year": year_curr,
                        "count": count_curr,
                        "rate": rate_curr,
                        "predicted_cases": round(predicted, 2),
                        "zscore": zscore,
                        "outbreak_level": level,
                    }
                    if "Population" in row_curr.index and not pd.isna(row_curr["Population"]):
                        record["population"] = float(row_curr["Population"])

                    records.append(record)

            chunk_size = 500
            total_inserted = 0
            for i in range(0, len(records), chunk_size):
                supabase.table("predictions").upsert(
                    records[i: i + chunk_size],
                    on_conflict="disease,county,year,sex"
                ).execute()
                total_inserted += len(records[i: i + chunk_size])

            return {
                "message": f"{total_inserted} rows upserted successfully",
                "total_skipped": total_skipped,
            }
        
        return await loop.run_in_executor(None, process_csv)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /send-alert ──────────────────────────────────────────────────────────
@app.post("/send-alert")
async def send_alert(data: AlertInput):
    """
    1. Logs the alert in alert_logs
    2. Finds all users whose profiles.governorate matches the county
    3. Inserts a user_notification for each matching user
    Returns count of users notified.
    """
    try:
        loop = asyncio.get_event_loop()
        
        def process_alert():
            supabase.table("alert_logs").insert({
                "disease": data.disease,
                "county": data.county,
                "year": data.year,
                "outbreak_level": data.outbreak_level,
                "message": data.message,
            }).execute()

            profiles_res = (
                supabase.table("profiles")
                .select("id, governorate")
                .ilike("governorate", data.county)
                .execute()
            )
            matched_profiles = profiles_res.data or []

            notifications = [
                {
                    "user_id": p["id"],
                    "disease": data.disease,
                    "county": data.county,
                    "year": data.year,
                    "outbreak_level": data.outbreak_level,
                    "message": data.message,
                    "is_read": False,
                }
                for p in matched_profiles
            ]

            if notifications:
                supabase.table("user_notifications").insert(notifications).execute()

            return {
                "status": "sent",
                "users_notified": len(notifications),
                "county": data.county,
                "disease": data.disease,
            }
        
        return await loop.run_in_executor(None, process_alert)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /predictions ──────────────────────────────────────────────────────────
@app.get("/predictions")
async def get_predictions(sex: str = "Total"):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: supabase.table("predictions")
            .select("*")
            .eq("sex", sex)
            .order("year")
            .execute()
        )
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predictions/disease/{disease_name}")
async def get_by_disease(disease_name: str, sex: str = "Total"):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: supabase.table("predictions")
            .select("*")
            .eq("disease", disease_name)
            .eq("sex", sex)
            .order("year")
            .execute()
        )
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predictions/year/{year}")
async def get_by_year(year: int, sex: str = "Total"):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: supabase.table("predictions")
            .select("*")
            .eq("year", year)
            .eq("sex", sex)
            .execute()
        )
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/predictions/diseases")
async def get_distinct_diseases():
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: supabase.table("predictions").select("disease").execute()
        )
        diseases = sorted(set(r["disease"] for r in result.data))
        return diseases
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats_summary(sex: str = "Total"):
    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: supabase.table("predictions").select("*").eq("sex", sex).execute()
        )
        data = result.data
        if not data:
            return {"total": 0}
        df = pd.DataFrame(data)
        return {
            "total": len(df),
            "diseases": sorted(df["disease"].unique().tolist()),
            "years": sorted(df["year"].unique().tolist()),
            "total_observed": float(df["count"].sum()),
            "total_predicted": float(df["predicted_cases"].sum()),
            "outbreak_counts": df["outbreak_level"].value_counts().to_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))