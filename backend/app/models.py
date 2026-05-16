from datetime import datetime, timezone
from typing import Optional, List, Dict
from sqlmodel import SQLModel, Field, Relationship, JSON, Column


class Settings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    electric_price: float = Field(default=0.0, description="Price per kWh in TL")
    fallback_wattage: float = Field(
        default=200.0, description="Fallback wattage in Watts"
    )


class StockSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    default_price_per_kg: float = Field(default=500.0)
    default_weight_g: float = Field(default=1000.0)


class FilamentType(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    is_custom: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    filaments: List["Filament"] = Relationship(back_populates="filament_type")


class FilamentColor(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    hex_code: str = Field(default="#808080")

    filaments: List["Filament"] = Relationship(back_populates="filament_color")


class FilamentSeries(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    nozzle_temp: str
    bed_temp: str
    other_specs: Dict = Field(default={}, sa_column=Column(JSON))

    filaments: List["Filament"] = Relationship(back_populates="series")


class JobFilament(SQLModel, table=True):
    job_id: Optional[int] = Field(
        default=None, foreign_key="printjob.id", primary_key=True
    )
    filament_id: Optional[int] = Field(
        default=None, foreign_key="filament.id", primary_key=True
    )
    grams_used: float = Field(default=0.0)


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
    name: str = Field(index=True)
    job_type: str = Field(default="Generic")
    model_id: Optional[int] = Field(default=None, foreign_key="model3d.id")
    duration_minutes: int = Field(default=0)
    total_cost: float = Field(default=0.0)  # This is the sales price
    production_cost: float = Field(default=0.0)
    status: str = Field(default="completed")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    model: Optional[Model3D] = Relationship(back_populates="jobs")
    filaments: List["Filament"] = Relationship(
        back_populates="jobs", link_model=JobFilament
    )
    job_filaments: List[JobFilament] = Relationship(
        sa_relationship_kwargs={"overlaps": "filaments"}
    )


# Update Filament model back_populates
class Filament(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    series_id: Optional[int] = Field(default=None, foreign_key="filamentseries.id")
    type_id: Optional[int] = Field(default=None, foreign_key="filamenttype.id")
    color_id: Optional[int] = Field(default=None, foreign_key="filamentcolor.id")
    price_per_kg: float = Field(default=0.0)
    remaining_weight_g: float = Field(default=0.0)
    is_opened: bool = Field(default=False)
    notes: Optional[str] = Field(default=None)

    series: Optional[FilamentSeries] = Relationship(back_populates="filaments")
    filament_type: Optional[FilamentType] = Relationship(back_populates="filaments")
    filament_color: Optional[FilamentColor] = Relationship(back_populates="filaments")
    jobs: List["PrintJob"] = Relationship(
        back_populates="filaments",
        link_model=JobFilament,
        sa_relationship_kwargs={"overlaps": "job_filaments"},
    )
