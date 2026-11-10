from typing import Optional
from sqlmodel import SQLModel, Field


class Settings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    electric_price: float = Field(default=0.0, description="Price per kWh in TL")
    fallback_wattage: float = Field(
        default=200.0, description="Fallback wattage in Watts"
    )
    markup_multiplier: float = Field(default=3.0)
    machine_hourly_rate: float = Field(default=0.0)
    failure_rate_pct: float = Field(default=0.0)
    currency: str = Field(default="TRY")


class StockSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    default_price_per_kg: float = Field(default=500.0)
    default_weight_g: float = Field(default=1000.0)
    low_stock_threshold: float = Field(default=200.0)
