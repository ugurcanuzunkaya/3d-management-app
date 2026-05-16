from typing import Optional, List, Dict, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship, JSON, Column

if TYPE_CHECKING:
    from .job import PrintJob


class Model3D(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    source_url: Optional[str] = None
    local_path: Optional[str] = None
    estimated_weight_g: float = Field(default=0.0)
    tech_details: Dict = Field(default={}, sa_column=Column(JSON))

    jobs: List["PrintJob"] = Relationship(back_populates="model")
