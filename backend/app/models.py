from datetime import datetime
from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

class Settings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    electric_price: float = Field(default=0.0, description="Price per kWh in TL")
    fallback_wattage: float = Field(default=200.0, description="Fallback wattage in Watts")

class FilamentSeries(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    nozzle_temp: str
    bed_temp: str
    other_specs: Dict = Field(default={}, sa_column=Column(JSON))
    
    filaments: List["Filament"] = Relationship(back_populates="series")

class Filament(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    series_id: Optional[int] = Field(default=None, foreign_key="filamentseries.id")
    type: str = Field(description="Smart, Eco, Silk, Stone, etc.")
    color: str
    price_per_kg: float = Field(default=0.0)
    remaining_weight_g: float = Field(default=0.0)
    is_opened: bool = Field(default=False)
    
    series: Optional[FilamentSeries] = Relationship(back_populates="filaments")
    jobs: List["PrintJob"] = Relationship(back_populates="filament")

class Model3D(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    source_url: Optional[str] = None
    local_path: Optional[str] = None
    estimated_weight_g: float = Field(default=0.0)
    tech_details: Dict = Field(default={}, sa_column=Column(JSON))
    
    jobs: List["PrintJob"] = Relationship(back_populates="model")

class PrintJob(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    model_id: Optional[int] = Field(default=None, foreign_key="model3d.id")
    filament_id: Optional[int] = Field(default=None, foreign_key="filament.id")
    duration_minutes: int = Field(default=0)
    used_filament_g: float = Field(default=0.0)
    power_usage_kwh: float = Field(default=0.0)
    total_cost: float = Field(default=0.0)
    status: str = Field(default="pending", description="pending, confirmed")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model: Optional[Model3D] = Relationship(back_populates="jobs")
    filament: Optional[Filament] = Relationship(back_populates="jobs")
