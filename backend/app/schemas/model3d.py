from typing import Optional, Dict
from pydantic import BaseModel, Field
from sqlmodel import SQLModel


class Model3DCreate(SQLModel):
    name: str
    estimated_weight_g: float = 0.0
    source_url: Optional[str] = None
    local_path: Optional[str] = None
    tech_details: Dict = {}


class Model3DUpdate(SQLModel):
    name: Optional[str] = None
    estimated_weight_g: Optional[float] = None
    source_url: Optional[str] = None
    local_path: Optional[str] = None
    tech_details: Optional[Dict] = None


class Model3DRead(SQLModel):
    id: int
    name: str
    estimated_weight_g: float
    source_url: Optional[str]
    local_path: Optional[str]
    tech_details: Dict


class ModelExtractionResult(BaseModel):
    name: str = Field(
        ...,
        description="Name of the 3D model, e.g., 'Articulated Dragon' or 'Filament Spool'",
    )
    weight_g: Optional[float] = Field(
        None, description="Estimated weight of the print in grams"
    )
    filament_type: Optional[str] = Field(
        None, description="Recommended filament type, e.g., 'PLA', 'PETG', 'ABS', 'TPU'"
    )
    print_time_minutes: Optional[int] = Field(
        None, description="Estimated print time in minutes"
    )
    nozzle_temp: Optional[int] = Field(
        None, description="Recommended nozzle temperature in Celsius"
    )
    bed_temp: Optional[int] = Field(
        None, description="Recommended bed temperature in Celsius"
    )
    dimensions: Optional[str] = Field(
        None, description="Dimensions of the model, e.g., '150x150x80mm'"
    )
    tech_details: Optional[Dict[str, str]] = Field(
        default_factory=dict,
        description="Any other technical details extracted from the text or image",
    )
