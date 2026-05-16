from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.dependencies import get_session
from app.services.filament_service import FilamentService
from app.schemas.filament import (
    FilamentRead,
    FilamentCreate,
    FilamentUpdate,
    FilamentTypeRead,
    FilamentTypeCreate,
    FilamentColorRead,
    FilamentColorCreate,
)

router = APIRouter(prefix="/filaments", tags=["filaments"])


@router.get("", response_model=List[FilamentRead])
def list_filaments(session: Session = Depends(get_session)):
    return FilamentService.list_filaments(session)


@router.post("", response_model=FilamentRead)
def create_filament(data: FilamentCreate, session: Session = Depends(get_session)):
    return FilamentService.create_filament(session, data)


@router.get("/{filament_id}", response_model=FilamentRead)
def get_filament(filament_id: int, session: Session = Depends(get_session)):
    return FilamentService.get_filament(session, filament_id)


@router.patch("/{filament_id}", response_model=FilamentRead)
def update_filament(
    filament_id: int, data: FilamentUpdate, session: Session = Depends(get_session)
):
    return FilamentService.update_filament(session, filament_id, data)


@router.delete("/{filament_id}")
def delete_filament(filament_id: int, session: Session = Depends(get_session)):
    FilamentService.delete_filament(session, filament_id)
    return {"ok": True}


# Types
@router.get("/types", response_model=List[FilamentTypeRead])
def list_types(session: Session = Depends(get_session)):
    return FilamentService.list_types(session)


@router.post("/types", response_model=FilamentTypeRead)
def create_type(data: FilamentTypeCreate, session: Session = Depends(get_session)):
    return FilamentService.create_type(session, data)


@router.delete("/types/{type_id}")
def delete_type(type_id: int, session: Session = Depends(get_session)):
    FilamentService.delete_type(session, type_id)
    return {"ok": True}


# Colors
@router.get("/colors", response_model=List[FilamentColorRead])
def list_colors(session: Session = Depends(get_session)):
    return FilamentService.list_colors(session)


@router.post("/colors", response_model=FilamentColorRead)
def create_color(data: FilamentColorCreate, session: Session = Depends(get_session)):
    return FilamentService.create_color(session, data)


@router.delete("/colors/{color_id}")
def delete_color(color_id: int, session: Session = Depends(get_session)):
    FilamentService.delete_color(session, color_id)
    return {"ok": True}
