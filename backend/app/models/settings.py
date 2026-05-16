from typing import Optional
from sqlmodel import SQLModel, Field


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
