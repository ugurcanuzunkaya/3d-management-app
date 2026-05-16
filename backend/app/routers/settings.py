from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.dependencies import get_session
from app.services.settings_service import SettingsService
from app.models.settings import Settings
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
