from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .filament import Filament
    from .model3d import Model3D


from .filament import JobFilament


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
    model: Optional["Model3D"] = Relationship(back_populates="jobs")
    filaments: List["Filament"] = Relationship(
        sa_relationship_kwargs={"viewonly": True},
        link_model=JobFilament
    )
    job_filaments: List[JobFilament] = Relationship(
        sa_relationship_kwargs={
            "cascade": "all, delete-orphan"
        }
    )
