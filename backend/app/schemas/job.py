from typing import Optional, List
from datetime import datetime
from sqlmodel import SQLModel
from .filament import FilamentRead


class JobFilamentCreate(SQLModel):
    filament_id: int
    grams_used: float


class CustomCostItem(SQLModel):
    name: str
    value: float


class CostCalculateRequest(SQLModel):
    duration_minutes: int = 0
    filaments: List[JobFilamentCreate] = []
    custom_costs: List[CustomCostItem] = []
    markup_multiplier: Optional[float] = None


class CostBreakdownRead(SQLModel):
    filament_cost: float
    electricity_cost: float
    machine_wear_cost: float
    failure_buffer_cost: float
    production_cost: float
    suggested_price: float
    custom_costs_total: float
    final_total_price: float
    net_profit: float
    margin_pct: float


class PrintJobCreate(SQLModel):
    name: str
    job_type: str = "Generic"
    model_id: Optional[int] = None
    printer_id: Optional[int] = None
    external_job_id: Optional[str] = None
    duration_minutes: int = 0
    total_cost: float = 0.0
    production_cost: float = 0.0
    status: str = "completed"
    filaments: List[JobFilamentCreate]


class PrintJobRead(SQLModel):
    id: int
    name: str
    job_type: str
    model_id: Optional[int] = None
    printer_id: Optional[int] = None
    external_job_id: Optional[str] = None
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
    printer_id: Optional[int] = None
    external_job_id: Optional[str] = None
    duration_minutes: Optional[int] = None
    total_cost: Optional[float] = None
    production_cost: Optional[float] = None
    status: Optional[str] = None
    filaments: Optional[List[JobFilamentCreate]] = None
