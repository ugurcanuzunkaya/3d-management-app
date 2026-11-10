from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .job import PrintJob


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


class JobFilament(SQLModel, table=True):
    job_id: Optional[int] = Field(
        default=None, foreign_key="printjob.id", primary_key=True
    )
    filament_id: Optional[int] = Field(
        default=None, foreign_key="filament.id", primary_key=True
    )
    grams_used: float = Field(default=0.0)


class Filament(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    brand: Optional[str] = Field(default=None, index=True)
    type_id: Optional[int] = Field(default=None, foreign_key="filamenttype.id")
    color_id: Optional[int] = Field(default=None, foreign_key="filamentcolor.id")
    price_per_kg: float = Field(default=0.0)
    initial_weight_g: float = Field(default=1000.0)
    empty_spool_weight_g: float = Field(default=200.0)
    remaining_weight_g: float = Field(default=0.0)
    is_opened: bool = Field(default=False)
    notes: Optional[str] = Field(default=None)

    filament_type: Optional[FilamentType] = Relationship(back_populates="filaments")
    filament_color: Optional[FilamentColor] = Relationship(back_populates="filaments")
    job_filaments: List[JobFilament] = Relationship()
    jobs: List["PrintJob"] = Relationship(
        sa_relationship_kwargs={"viewonly": True}, link_model=JobFilament
    )
