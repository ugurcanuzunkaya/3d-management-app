from typing import Optional
from sqlmodel import SQLModel, Field


class Printer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    ip_address: str
    serial_number: str
    access_code: str
    is_active: bool = Field(default=True)
