from typing import Optional
from sqlmodel import SQLModel, Field


class Printer(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    ip_address: str
    serial_number: str
    access_code: str
    is_active: bool = Field(default=True)


class PrinterSlotAssignment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    printer_id: int = Field(foreign_key="printer.id", index=True)
    slot_index: int = Field(index=True)
    filament_id: Optional[int] = Field(
        default=None, foreign_key="filament.id", index=True
    )
