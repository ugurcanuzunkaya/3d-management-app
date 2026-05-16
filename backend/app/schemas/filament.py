from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel


class FilamentTypeCreate(SQLModel):
    name: str
    is_custom: bool = True


class FilamentTypeUpdate(SQLModel):
    name: Optional[str] = None


class FilamentTypeRead(SQLModel):
    id: int
    name: str
    is_custom: bool
    created_at: datetime


class FilamentColorCreate(SQLModel):
    name: str
    hex_code: str


class FilamentColorUpdate(SQLModel):
    name: Optional[str] = None
    hex_code: Optional[str] = None


class FilamentColorRead(SQLModel):
    id: int
    name: str
    hex_code: str


class FilamentCreate(SQLModel):
    name: str
    type_id: int
    color_id: int
    series_id: Optional[int] = None
    price_per_kg: float = 500.0
    remaining_weight_g: float = 1000.0
    is_opened: bool = False
    notes: Optional[str] = None


class FilamentUpdate(SQLModel):
    name: Optional[str] = None
    type_id: Optional[int] = None
    color_id: Optional[int] = None
    series_id: Optional[int] = None
    price_per_kg: Optional[float] = None
    remaining_weight_g: Optional[float] = None
    is_opened: Optional[bool] = None
    notes: Optional[str] = None


class FilamentRead(SQLModel):
    id: int
    name: str
    price_per_kg: float
    remaining_weight_g: float
    is_opened: bool
    notes: Optional[str]
    series_id: Optional[int]
    type_id: Optional[int]
    color_id: Optional[int]
    filament_type: Optional[FilamentTypeRead] = None
    filament_color: Optional[FilamentColorRead] = None
