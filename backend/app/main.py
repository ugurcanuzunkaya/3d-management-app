import logging
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from .database import get_session, init_db
from .models import Filament, Model3D, PrintJob, Settings, FilamentSeries
from .services.ai_service import AIService
from .services.cost_service import CostService
from .services.mqtt_service import BambuMQTTService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="3D Management App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

mqtt_service = BambuMQTTService()

from .seed import seed_data

@app.on_event("startup")
def on_startup():
    init_db()
    try:
        seed_data()
    except Exception as e:
        logger.error(f"Failed to seed data: {e}")
    try:
        mqtt_service.start()
    except Exception as e:
        logger.error(f"Failed to start MQTT service: {e}")

@app.on_event("shutdown")
def on_shutdown():
    mqtt_service.stop()

# --- Filaments ---
@app.get("/api/filaments", response_model=List[Filament])
def list_filaments(session: Session = Depends(get_session)):
    return session.exec(select(Filament)).all()

@app.get("/api/filament-series", response_model=List[FilamentSeries])
def list_filament_series(session: Session = Depends(get_session)):
    return session.exec(select(FilamentSeries)).all()

# --- Models ---
@app.get("/api/models", response_model=List[Model3D])
def list_models(session: Session = Depends(get_session)):
    return session.exec(select(Model3D)).all()

@app.post("/api/models/extract")
async def extract_model(url: str, session: Session = Depends(get_session)):
    ai_service = AIService()
    markdown = ai_service.fetch_markdown(url)
    if not markdown:
        raise HTTPException(status_code=400, detail="Failed to fetch markdown from URL")
    
    tech_params = ai_service.extract_tech_params(markdown)
    
    # Save to DB
    model = Model3D(
        name=url.split("/")[-1] or "New Model",
        source_url=url,
        estimated_weight_g=tech_params.get("weight_g", 0.0),
        tech_details=tech_params
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    return model

# --- PrintJobs ---
@app.get("/api/printjobs", response_model=List[PrintJob])
def list_printjobs(status: Optional[str] = None, session: Session = Depends(get_session)):
    statement = select(PrintJob)
    if status:
        statement = statement.where(PrintJob.status == status)
    return session.exec(statement).all()

@app.post("/api/printjobs/{job_id}/approve")
def approve_job(job_id: int, custom_costs: List[dict] = [], session: Session = Depends(get_session)):
    job = session.get(PrintJob, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status == "confirmed":
        raise HTTPException(status_code=400, detail="Job already confirmed")
    
    # Calculate final cost
    filament = session.get(Filament, job.filament_id)
    settings = session.exec(select(Settings)).first() or Settings()
    
    f_price = filament.price_per_kg if filament else 500.0
    
    prod_cost = CostService.calculate_production_cost(
        used_filament_g=job.used_filament_g,
        filament_price_per_kg=f_price,
        duration_minutes=job.duration_minutes,
        power_usage_kwh=job.power_usage_kwh,
        electric_price=settings.electric_price,
        fallback_wattage=settings.fallback_wattage
    )
    
    job.total_cost = CostService.calculate_total_price(prod_cost, custom_costs)
    job.status = "confirmed"
    
    # Deduct stock
    if filament:
        filament.remaining_weight_g -= job.used_filament_g
        session.add(filament)
        
    session.add(job)
    session.commit()
    return job

# --- Settings ---
@app.get("/api/settings", response_model=Settings)
def get_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(Settings)).first()
    if not settings:
        settings = Settings()
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings

@app.post("/api/settings", response_model=Settings)
def update_settings(new_settings: Settings, session: Session = Depends(get_session)):
    db_settings = session.exec(select(Settings)).first()
    if not db_settings:
        db_settings = Settings()
        session.add(db_settings)
    
    db_settings.electric_price = new_settings.electric_price
    db_settings.fallback_wattage = new_settings.fallback_wattage
    session.add(db_settings)
    session.commit()
    session.refresh(db_settings)
    return db_settings
