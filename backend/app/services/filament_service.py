from typing import Any, List, cast
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select
from app.models.filament import Filament, FilamentType, FilamentColor
from app.models.printer import PrinterSlotAssignment
from app.schemas.filament import (
    FilamentCreate,
    FilamentUpdate,
    FilamentTypeCreate,
    FilamentColorCreate,
)
from app.exceptions import NotFoundException, ConflictException


class FilamentService:
    @staticmethod
    def list_filaments(session: Session) -> List[Filament]:
        stmt = select(Filament).options(
            selectinload(cast(Any, Filament.filament_type)),
            selectinload(cast(Any, Filament.filament_color)),
        )
        return list(session.exec(stmt).all())

    @staticmethod
    def get_filament(session: Session, filament_id: int) -> Filament:
        filament = session.get(Filament, filament_id)
        if not filament:
            raise NotFoundException(f"Filament with id {filament_id} not found")
        return filament

    @staticmethod
    def create_filament(session: Session, data: FilamentCreate) -> Filament:
        filament = Filament.model_validate(data)
        filament.remaining_weight_g = max(0.0, filament.remaining_weight_g)
        session.add(filament)
        session.commit()
        session.refresh(filament)
        return filament

    @staticmethod
    def update_filament(
        session: Session, filament_id: int, data: FilamentUpdate
    ) -> Filament:
        filament = FilamentService.get_filament(session, filament_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(filament, key, value)
        filament.remaining_weight_g = max(0.0, filament.remaining_weight_g)
        session.add(filament)
        session.commit()
        session.refresh(filament)
        return filament

    @staticmethod
    def delete_filament(session: Session, filament_id: int) -> None:
        filament = FilamentService.get_filament(session, filament_id)
        assignments = session.exec(
            select(PrinterSlotAssignment).where(
                PrinterSlotAssignment.filament_id == filament_id
            )
        ).all()
        for assignment in assignments:
            assignment.filament_id = None
            session.add(assignment)
        session.delete(filament)
        session.commit()

    # Types
    @staticmethod
    def list_types(session: Session) -> List[FilamentType]:
        return list(session.exec(select(FilamentType)).all())

    @staticmethod
    def create_type(session: Session, data: FilamentTypeCreate) -> FilamentType:
        existing = session.exec(
            select(FilamentType).where(FilamentType.name == data.name)
        ).first()
        if existing:
            raise ConflictException(f"Filament type '{data.name}' already exists")
        f_type = FilamentType.model_validate(data)
        session.add(f_type)
        session.commit()
        session.refresh(f_type)
        return f_type

    @staticmethod
    def delete_type(session: Session, type_id: int) -> None:
        f_type = session.get(FilamentType, type_id)
        if not f_type:
            raise NotFoundException(f"Type {type_id} not found")
        if f_type.filaments:
            raise ConflictException("Cannot delete type referenced by filaments")
        session.delete(f_type)
        session.commit()

    # Colors
    @staticmethod
    def list_colors(session: Session) -> List[FilamentColor]:
        return list(session.exec(select(FilamentColor)).all())

    @staticmethod
    def create_color(session: Session, data: FilamentColorCreate) -> FilamentColor:
        existing = session.exec(
            select(FilamentColor).where(FilamentColor.name == data.name)
        ).first()
        if existing:
            raise ConflictException(f"Color '{data.name}' already exists")
        color = FilamentColor.model_validate(data)
        session.add(color)
        session.commit()
        session.refresh(color)
        return color

    @staticmethod
    def delete_color(session: Session, color_id: int) -> None:
        color = session.get(FilamentColor, color_id)
        if not color:
            raise NotFoundException(f"Color {color_id} not found")
        if color.filaments:
            raise ConflictException("Cannot delete color referenced by filaments")
        session.delete(color)
        session.commit()
