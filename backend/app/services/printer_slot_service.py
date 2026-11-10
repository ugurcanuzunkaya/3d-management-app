from typing import Any, Dict, List, Optional, Tuple, cast
from fastapi import HTTPException, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, col, select
from app.models.filament import Filament
from app.models.printer import PrinterSlotAssignment
from app.schemas.printer import (
    PrinterSlotRead,
    SlotAmsTelemetry,
    SlotFilamentSummary,
)
from app.services.mqtt_service import BambuMQTTService

VALID_SLOTS: Tuple[int, ...] = (0, 1, 2, 3, 254)
LOW_STOCK_THRESHOLD_G: float = 200.0

DEFAULT_TEMP_RANGES: Dict[str, Tuple[int, int]] = {
    "PLA": (190, 240),
    "PLA+": (190, 240),
    "PETG": (230, 260),
    "ABS": (240, 270),
    "ASA": (240, 270),
    "TPU": (200, 230),
}


def _safe_int(val: Any, default: int = 0) -> int:
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


class PrinterSlotService:
    @staticmethod
    def get_temp_range(type_name: str) -> Tuple[int, int]:
        upper = (type_name or "PLA").upper().strip()
        return DEFAULT_TEMP_RANGES.get(upper, (190, 240))

    @staticmethod
    def extract_slot_telemetry(
        status_data: Dict[str, Any], slot_index: int
    ) -> SlotAmsTelemetry:
        ams_root = status_data.get("ams")
        ams_unit: Dict[str, Any] = {}
        tray_now: Optional[str] = None

        if isinstance(ams_root, dict):
            tray_now_raw = ams_root.get("tray_now")
            if tray_now_raw is not None:
                tray_now = str(tray_now_raw)
            ams_list = ams_root.get("ams")
            if (
                isinstance(ams_list, list)
                and len(ams_list) > 0
                and isinstance(ams_list[0], dict)
            ):
                ams_unit = ams_list[0]

        tray_dict: Dict[str, Any] = {}
        if slot_index < 4:
            trays = ams_unit.get("tray")
            if isinstance(trays, list):
                for item in trays:
                    if isinstance(item, dict) and str(item.get("id")) == str(
                        slot_index
                    ):
                        tray_dict = item
                        break
            is_active = tray_now == str(slot_index)
        else:
            vt_tray = status_data.get("vt_tray")
            if isinstance(vt_tray, dict):
                tray_dict = vt_tray
            else:
                vir_slot = status_data.get("vir_slot")
                if (
                    isinstance(vir_slot, list)
                    and len(vir_slot) > 0
                    and isinstance(vir_slot[0], dict)
                ):
                    tray_dict = vir_slot[0]
            is_active = tray_now in ("254", "255")

        return SlotAmsTelemetry(
            tray_type=str(tray_dict.get("tray_type") or ""),
            tray_color=str(tray_dict.get("tray_color") or ""),
            nozzle_temp_min=_safe_int(tray_dict.get("nozzle_temp_min"), 0),
            nozzle_temp_max=_safe_int(tray_dict.get("nozzle_temp_max"), 0),
            is_active_tray=is_active,
            humidity_raw=(
                str(ams_unit.get("humidity_raw"))
                if ams_unit.get("humidity_raw") is not None and slot_index < 4
                else None
            ),
            ams_temp=(
                str(ams_unit.get("temp"))
                if ams_unit.get("temp") is not None and slot_index < 4
                else None
            ),
            dry_time=_safe_int(ams_unit.get("dry_time"), 0) if slot_index < 4 else 0,
        )

    @staticmethod
    def _build_filament_summary(filament: Filament) -> SlotFilamentSummary:
        assert filament.id is not None
        color_name = (
            filament.filament_color.name if filament.filament_color else "Unknown"
        )
        color_hex = (
            filament.filament_color.hex_code if filament.filament_color else "#808080"
        )
        type_name = filament.filament_type.name if filament.filament_type else "PLA"
        brand = getattr(filament, "brand", None)
        return SlotFilamentSummary(
            id=filament.id,
            name=filament.name,
            brand=brand,
            remaining_weight_g=filament.remaining_weight_g,
            price_per_kg=filament.price_per_kg,
            color_name=color_name,
            color_hex=color_hex,
            type_name=type_name,
            is_low_stock=filament.remaining_weight_g <= LOW_STOCK_THRESHOLD_G,
        )

    @staticmethod
    def build_printer_slots(
        session: Session, printer_id: int, status_data: Dict[str, Any]
    ) -> List[PrinterSlotRead]:
        assignments = session.exec(
            select(PrinterSlotAssignment).where(
                PrinterSlotAssignment.printer_id == printer_id
            )
        ).all()
        by_slot: Dict[int, PrinterSlotAssignment] = {
            a.slot_index: a for a in assignments
        }
        assigned_ids = [a.filament_id for a in assignments if a.filament_id is not None]
        filaments_by_id: Dict[int, Filament] = {}
        if assigned_ids:
            loaded_filaments = session.exec(
                select(Filament)
                .where(col(Filament.id).in_(assigned_ids))
                .options(
                    selectinload(cast(Any, Filament.filament_type)),
                    selectinload(cast(Any, Filament.filament_color)),
                )
            ).all()
            filaments_by_id = {f.id: f for f in loaded_filaments if f.id is not None}

        result: List[PrinterSlotRead] = []
        for idx in VALID_SLOTS:
            slot_type = "ams" if idx < 4 else "external"
            slot_label = f"AMS Slot {idx + 1}" if idx < 4 else "External Spool"
            assignment = by_slot.get(idx)
            filament_id = assignment.filament_id if assignment else None
            filament_summary: Optional[SlotFilamentSummary] = None
            if filament_id is not None:
                db_filament = filaments_by_id.get(filament_id)
                if db_filament is not None:
                    filament_summary = PrinterSlotService._build_filament_summary(
                        db_filament
                    )
                else:
                    filament_id = None

            telemetry = PrinterSlotService.extract_slot_telemetry(status_data, idx)
            result.append(
                PrinterSlotRead(
                    slot_index=idx,
                    slot_type=slot_type,
                    slot_label=slot_label,
                    filament_id=filament_id,
                    filament=filament_summary,
                    ams_telemetry=telemetry,
                )
            )
        return result

    @staticmethod
    def assign_slot(
        session: Session,
        mqtt_service: BambuMQTTService,
        printer_id: int,
        slot_index: int,
        filament_id: Optional[int],
    ) -> PrinterSlotRead:
        if slot_index not in VALID_SLOTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid slot_index {slot_index}. Expected one of {VALID_SLOTS}.",
            )

        db_filament: Optional[Filament] = None
        if filament_id is not None:
            db_filament = session.get(Filament, filament_id)
            if db_filament is None:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Filament {filament_id} not found",
                )

            # Unmount this filament from any other slot first
            previous = session.exec(
                select(PrinterSlotAssignment).where(
                    PrinterSlotAssignment.filament_id == filament_id
                )
            ).all()
            for prev in previous:
                if prev.printer_id != printer_id or prev.slot_index != slot_index:
                    prev.filament_id = None
                    session.add(prev)

        existing = session.exec(
            select(PrinterSlotAssignment).where(
                PrinterSlotAssignment.printer_id == printer_id,
                PrinterSlotAssignment.slot_index == slot_index,
            )
        ).first()

        if existing:
            existing.filament_id = filament_id
            session.add(existing)
        else:
            existing = PrinterSlotAssignment(
                printer_id=printer_id,
                slot_index=slot_index,
                filament_id=filament_id,
            )
            session.add(existing)

        session.commit()

        if db_filament is not None:
            type_name = (
                db_filament.filament_type.name if db_filament.filament_type else "PLA"
            )
            color_hex = (
                db_filament.filament_color.hex_code
                if db_filament.filament_color
                else "#FFFFFF"
            )
            temp_min, temp_max = PrinterSlotService.get_temp_range(type_name)
            mqtt_service.set_ams_filament_setting(
                printer_id=printer_id,
                slot_index=slot_index,
                tray_type=type_name,
                tray_color_hex=color_hex,
                nozzle_temp_min=temp_min,
                nozzle_temp_max=temp_max,
            )

        status_data = mqtt_service.get_status(printer_id)
        slots = PrinterSlotService.build_printer_slots(session, printer_id, status_data)
        for s in slots:
            if s.slot_index == slot_index:
                return s
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Slot not found after assignment",
        )
