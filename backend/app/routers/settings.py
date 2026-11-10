from typing import Any
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from app.dependencies import get_session
from app.services.settings_service import SettingsService
from app.models.settings import Settings
from app.models.filament import Filament
from app.models.model3d import Model3D
from app.models.job import PrintJob
from app.models.printer import Printer
from app.schemas.printer import PrinterRead
from app.schemas.settings import StockSettingsRead, StockSettingsUpdate

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=Settings)
def get_settings(session: Session = Depends(get_session)):
    return SettingsService.get_or_create_settings(session)


@router.post("", response_model=Settings)
def update_settings(data: Settings, session: Session = Depends(get_session)):
    return SettingsService.update_settings(session, data)


@router.get("/stock", response_model=StockSettingsRead)
def get_stock_settings(session: Session = Depends(get_session)):
    return SettingsService.get_or_create_stock_settings(session)


@router.put("/stock", response_model=StockSettingsRead)
def update_stock_settings(
    data: StockSettingsUpdate, session: Session = Depends(get_session)
):
    return SettingsService.update_stock_settings(session, data)


@router.get("/export")
def export_local_backup(session: Session = Depends(get_session)) -> dict[str, Any]:
    settings = SettingsService.get_or_create_settings(session)
    stock_settings = SettingsService.get_or_create_stock_settings(session)
    filaments = session.exec(select(Filament)).all()
    models = session.exec(select(Model3D)).all()
    jobs = session.exec(select(PrintJob)).all()
    printers = session.exec(select(Printer)).all()

    return {
        "settings": settings.model_dump(),
        "stock_settings": stock_settings.model_dump(),
        "filaments": [f.model_dump() for f in filaments],
        "models": [m.model_dump(mode="json") for m in models],
        "jobs": [j.model_dump(mode="json") for j in jobs],
        "printers": [PrinterRead.from_printer(p).model_dump() for p in printers],
    }
