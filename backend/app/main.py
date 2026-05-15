import logging
import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional, Any, cast
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from .database import get_session, init_db
from .models import (
    Filament,
    Model3D,
    PrintJob,
    JobFilament,
    Settings,
    FilamentType,
    FilamentColor,
    StockSettings,
)
from .seed import seed_data
from .services.ai_service import AIService
from .services.mqtt_service import BambuMQTTService
from .schemas import (
    FilamentCreate,
    FilamentUpdate,
    FilamentRead,
    FilamentTypeCreate,
    FilamentTypeUpdate,
    FilamentTypeRead,
    FilamentColorCreate,
    FilamentColorUpdate,
    FilamentColorRead,
    StockSettingsUpdate,
    StockSettingsRead,
    PrintJobCreate,
    PrintJobRead,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def background_poll():
    while True:
        try:
            mqtt_service.manual_poll()
        except Exception as e:
            logger.error(f"Error in background poll: {e}")
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    try:
        seed_data()
    except Exception as e:
        logger.error(f"Failed to seed data: {e}")
    try:
        mqtt_service.start()
        polling_task = asyncio.create_task(background_poll())
    except Exception as e:
        logger.error(f"Failed to start MQTT service: {e}")

    yield

    if "polling_task" in locals():
        polling_task.cancel()
    mqtt_service.stop()


app = FastAPI(title="3D Management App", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

mqtt_service = BambuMQTTService()


# --- Printer Status ---
@app.get("/api/printer/status")
def get_printer_status():
    return mqtt_service.get_status()


@app.post("/api/printer/poll")
def manual_poll_printer():
    mqtt_service.manual_poll()
    return {"status": "request_sent"}


# --- Filaments ---
@app.get("/api/filaments", response_model=List[FilamentRead])
def list_filaments(session: Session = Depends(get_session)):
    statement = select(Filament).options(
        selectinload(cast(Any, Filament.filament_type)),
        selectinload(cast(Any, Filament.filament_color)),
    )
    return session.exec(statement).all()


@app.post("/api/filaments", response_model=FilamentRead)
def create_filament(filament: FilamentCreate, session: Session = Depends(get_session)):
    db_filament = Filament.model_validate(filament)
    session.add(db_filament)
    session.commit()
    session.refresh(db_filament)
    return db_filament


@app.put("/api/filaments/{filament_id}", response_model=FilamentRead)
def update_filament(
    filament_id: int, filament: FilamentUpdate, session: Session = Depends(get_session)
):
    db_filament = session.get(Filament, filament_id)
    if not db_filament:
        raise HTTPException(status_code=404, detail="Filament not found")

    filament_data = filament.model_dump(exclude_unset=True)
    for key, value in filament_data.items():
        setattr(db_filament, key, value)

    session.add(db_filament)
    session.commit()
    session.refresh(db_filament)
    return db_filament


@app.delete("/api/filaments/{filament_id}")
def delete_filament(filament_id: int, session: Session = Depends(get_session)):
    db_filament = session.get(Filament, filament_id)
    if not db_filament:
        raise HTTPException(status_code=404, detail="Filament not found")
    session.delete(db_filament)
    session.commit()
    return {"ok": True}


# --- Filament Types ---
@app.get("/api/filament-types", response_model=List[FilamentTypeRead])
def list_filament_types(session: Session = Depends(get_session)):
    return session.exec(select(FilamentType)).all()


@app.post("/api/filament-types", response_model=FilamentTypeRead)
def create_filament_type(
    filament_type: FilamentTypeCreate, session: Session = Depends(get_session)
):
    db_type = FilamentType.model_validate(filament_type)
    session.add(db_type)
    session.commit()
    session.refresh(db_type)
    return db_type


@app.put("/api/filament-types/{type_id}", response_model=FilamentTypeRead)
def update_filament_type(
    type_id: int,
    filament_type: FilamentTypeUpdate,
    session: Session = Depends(get_session),
):
    db_type = session.get(FilamentType, type_id)
    if not db_type:
        raise HTTPException(status_code=404, detail="Filament type not found")

    type_data = filament_type.model_dump(exclude_unset=True)
    for key, value in type_data.items():
        setattr(db_type, key, value)

    session.add(db_type)
    session.commit()
    session.refresh(db_type)
    return db_type


@app.delete("/api/filament-types/{type_id}")
def delete_filament_type(type_id: int, session: Session = Depends(get_session)):
    db_type = session.get(FilamentType, type_id)
    if not db_type:
        raise HTTPException(status_code=404, detail="Filament type not found")
    # Check if used by filaments
    if session.exec(select(Filament).where(Filament.type_id == type_id)).first():
        raise HTTPException(
            status_code=400, detail="Cannot delete type referenced by filaments"
        )
    session.delete(db_type)
    session.commit()
    return {"ok": True}


# --- Filament Colors ---
@app.get("/api/filament-colors", response_model=List[FilamentColorRead])
def list_filament_colors(session: Session = Depends(get_session)):
    return session.exec(select(FilamentColor)).all()


@app.post("/api/filament-colors", response_model=FilamentColorRead)
def create_filament_color(
    filament_color: FilamentColorCreate, session: Session = Depends(get_session)
):
    db_color = FilamentColor.model_validate(filament_color)
    session.add(db_color)
    session.commit()
    session.refresh(db_color)
    return db_color


@app.put("/api/filament-colors/{color_id}", response_model=FilamentColorRead)
def update_filament_color(
    color_id: int,
    filament_color: FilamentColorUpdate,
    session: Session = Depends(get_session),
):
    db_color = session.get(FilamentColor, color_id)
    if not db_color:
        raise HTTPException(status_code=404, detail="Filament color not found")

    color_data = filament_color.model_dump(exclude_unset=True)
    for key, value in color_data.items():
        setattr(db_color, key, value)

    session.add(db_color)
    session.commit()
    session.refresh(db_color)
    return db_color


@app.delete("/api/filament-colors/{color_id}")
def delete_filament_color(color_id: int, session: Session = Depends(get_session)):
    db_color = session.get(FilamentColor, color_id)
    if not db_color:
        raise HTTPException(status_code=404, detail="Filament color not found")
    # Check if used by filaments
    if session.exec(select(Filament).where(Filament.color_id == color_id)).first():
        raise HTTPException(
            status_code=400, detail="Cannot delete color referenced by filaments"
        )
    session.delete(db_color)
    session.commit()
    return {"ok": True}


# --- Stock Settings ---
@app.get("/api/stock-settings", response_model=StockSettingsRead)
def get_stock_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(StockSettings)).first()
    if not settings:
        settings = StockSettings()
        session.add(settings)
        session.commit()
        session.refresh(settings)
    return settings


@app.put("/api/stock-settings", response_model=StockSettingsRead)
def update_stock_settings(
    settings_update: StockSettingsUpdate, session: Session = Depends(get_session)
):
    db_settings = session.exec(select(StockSettings)).first()
    if not db_settings:
        db_settings = StockSettings()
        session.add(db_settings)

    settings_data = settings_update.model_dump(exclude_unset=True)
    for key, value in settings_data.items():
        setattr(db_settings, key, value)

    session.add(db_settings)
    session.commit()
    session.refresh(db_settings)
    return db_settings


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
        tech_details=tech_params,
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


# --- PrintJobs ---
@app.get("/api/printjobs", response_model=List[PrintJobRead])
def list_printjobs(
    status: Optional[str] = None, session: Session = Depends(get_session)
):
    statement = select(PrintJob).options(
        selectinload(cast(Any, PrintJob.filaments)),
        selectinload(cast(Any, PrintJob.job_filaments)),
    )
    if status:
        statement = statement.where(PrintJob.status == status)
    return session.exec(statement.order_by(cast(Any, PrintJob.created_at).desc())).all()


@app.post("/api/printjobs", response_model=PrintJob)
def create_printjob(job_in: PrintJobCreate, session: Session = Depends(get_session)):
    # 1. Create the PrintJob
    db_job = PrintJob(
        name=job_in.name,
        job_type=job_in.job_type,
        model_id=job_in.model_id,
        duration_minutes=job_in.duration_minutes,
        total_cost=job_in.total_cost,
        production_cost=job_in.production_cost,
        status="completed",
    )
    session.add(db_job)
    session.commit()
    session.refresh(db_job)

    # 2. Add Filaments and Update Stock
    for jf in job_in.filaments:
        # Link filament to job
        link = JobFilament(
            job_id=db_job.id, filament_id=jf.filament_id, grams_used=jf.grams_used
        )
        session.add(link)

        # Decrement stock
        filament = session.get(Filament, jf.filament_id)
        if filament:
            filament.remaining_weight_g = max(
                0, filament.remaining_weight_g - jf.grams_used
            )
            session.add(filament)

    session.commit()
    session.refresh(db_job)
    return db_job


@app.put("/api/printjobs/{job_id}", response_model=PrintJobRead)
def update_printjob(
    job_id: int, job_in: PrintJobCreate, session: Session = Depends(get_session)
):
    db_job = session.get(PrintJob, job_id)
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")

    # 1. Revert previous stock changes
    old_links = session.exec(
        select(JobFilament).where(JobFilament.job_id == job_id)
    ).all()
    for link in old_links:
        filament = session.get(Filament, link.filament_id)
        if filament:
            filament.remaining_weight_g += link.grams_used
            session.add(filament)
        session.delete(link)

    # 2. Update job details
    db_job.name = job_in.name
    db_job.job_type = job_in.job_type
    db_job.duration_minutes = job_in.duration_minutes
    db_job.total_cost = job_in.total_cost
    db_job.production_cost = job_in.production_cost
    session.add(db_job)

    # 3. Add new filaments and update stock
    for jf in job_in.filaments:
        link = JobFilament(
            job_id=db_job.id, filament_id=jf.filament_id, grams_used=jf.grams_used
        )
        session.add(link)

        filament = session.get(Filament, jf.filament_id)
        if filament:
            filament.remaining_weight_g = max(
                0, filament.remaining_weight_g - jf.grams_used
            )
            session.add(filament)

    session.commit()
    session.refresh(db_job)
    return db_job


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
