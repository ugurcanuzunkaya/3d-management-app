from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel
from .filament import FilamentRead


class JobFilamentCreate(SQLModel):
    filament_id: int
    grams_used: float


class PrintJobCreate(SQLModel):
    name: str
    job_type: str = "Generic"
    model_id: Optional[int] = None
    duration_minutes: int = 0
    total_cost: float = 0.0
    production_cost: float = 0.0
    filaments: List[JobFilamentCreate]


class PrintJobRead(SQLModel):
    id: int
    name: str
    job_type: str
    duration_minutes: int
    total_cost: float
    production_cost: float
    status: str
    created_at: datetime
    filaments: List[FilamentRead] = []
    job_filaments: List[JobFilamentCreate] = []


class PrintJobUpdate(SQLModel):
    name: Optional[str] = None
    job_type: Optional[str] = None
    model_id: Optional[int] = None
    duration_minutes: Optional[int] = None
    total_cost: Optional[float] = None
    production_cost: Optional[float] = None
    status: Optional[str] = None
    filaments: Optional[List[JobFilamentCreate]] = None
