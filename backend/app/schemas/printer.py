from typing import Optional
from sqlmodel import SQLModel
from app.models.printer import Printer

MASKED_ACCESS_CODE = "********"


class PrinterCreate(SQLModel):
    name: str
    ip_address: str
    serial_number: str
    access_code: str
    is_active: bool = True


class PrinterUpdate(SQLModel):
    name: str
    ip_address: str
    serial_number: str
    access_code: Optional[str] = None
    is_active: bool = True


class PrinterRead(SQLModel):
    id: Optional[int] = None
    name: str
    ip_address: str
    serial_number: str
    access_code: str
    is_active: bool = True

    @classmethod
    def from_printer(cls, printer: Printer) -> "PrinterRead":
        masked = MASKED_ACCESS_CODE if printer.access_code else ""
        return cls(
            id=printer.id,
            name=printer.name,
            ip_address=printer.ip_address,
            serial_number=printer.serial_number,
            access_code=masked,
            is_active=printer.is_active,
        )


class PrinterSlotAssignRequest(SQLModel):
    filament_id: Optional[int] = None


class SlotFilamentSummary(SQLModel):
    id: int
    name: str
    brand: Optional[str] = None
    remaining_weight_g: float
    price_per_kg: float
    color_name: str
    color_hex: str
    type_name: str
    is_low_stock: bool


class SlotAmsTelemetry(SQLModel):
    tray_type: str = ""
    tray_color: str = ""
    nozzle_temp_min: int = 0
    nozzle_temp_max: int = 0
    is_active_tray: bool = False
    humidity_raw: Optional[str] = None
    ams_temp: Optional[str] = None
    dry_time: int = 0


class PrinterSlotRead(SQLModel):
    slot_index: int
    slot_type: str
    slot_label: str
    filament_id: Optional[int] = None
    filament: Optional[SlotFilamentSummary] = None
    ams_telemetry: SlotAmsTelemetry
