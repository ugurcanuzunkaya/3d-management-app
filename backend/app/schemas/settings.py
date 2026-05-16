from typing import Optional
from sqlmodel import SQLModel


class StockSettingsUpdate(SQLModel):
    default_price_per_kg: Optional[float] = None
    default_weight_g: Optional[float] = None


class StockSettingsRead(SQLModel):
    id: int
    default_price_per_kg: float
    default_weight_g: float
