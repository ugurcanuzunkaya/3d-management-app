from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.dependencies import get_session, get_mqtt_service
from app.models.printer import Printer, PrinterSlotAssignment
from app.schemas.printer import (
    MASKED_ACCESS_CODE,
    PrinterCreate,
    PrinterRead,
    PrinterSlotAssignRequest,
    PrinterSlotRead,
    PrinterUpdate,
)
from app.services.mqtt_service import BambuMQTTService
from app.services.printer_slot_service import PrinterSlotService

router = APIRouter(prefix="/printer", tags=["printer"])


def _enrich_status_with_slots(
    session: Session, printer_id: int, status_data: Dict[str, Any]
) -> Dict[str, Any]:
    enriched = dict(status_data)
    slots = PrinterSlotService.build_printer_slots(session, printer_id, enriched)
    enriched["slots"] = [s.model_dump() for s in slots]
    return enriched


@router.get("", response_model=List[PrinterRead])
def list_printers(session: Session = Depends(get_session)):
    printers = session.exec(select(Printer)).all()
    return [PrinterRead.from_printer(p) for p in printers]


@router.post("", response_model=PrinterRead, status_code=status.HTTP_201_CREATED)
def create_printer(
    printer_data: PrinterCreate,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    db_printer = Printer(
        name=printer_data.name,
        ip_address=printer_data.ip_address,
        serial_number=printer_data.serial_number,
        access_code=printer_data.access_code,
        is_active=printer_data.is_active,
    )
    session.add(db_printer)
    session.commit()
    session.refresh(db_printer)

    if db_printer.is_active and db_printer.id is not None:
        mqtt_service.register_printer(
            printer_id=db_printer.id,
            host=db_printer.ip_address,
            serial=db_printer.serial_number,
            access_code=db_printer.access_code,
        )

    return PrinterRead.from_printer(db_printer)


@router.get("/status")
def get_any_printer_status(
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    printer = session.exec(select(Printer).where(Printer.is_active)).first()
    if not printer or printer.id is None:
        return {"last_updated": None}
    raw_status = mqtt_service.get_status(printer.id)
    return _enrich_status_with_slots(session, printer.id, raw_status)


@router.get("/status/all")
def get_all_printer_statuses(
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    printers = session.exec(select(Printer)).all()
    res = {}
    for p in printers:
        if p.id is None:
            continue
        if p.is_active:
            raw_status = mqtt_service.get_status(p.id)
            res[p.id] = _enrich_status_with_slots(session, p.id, raw_status)
        else:
            res[p.id] = {}
    return res


@router.get("/{printer_id}", response_model=PrinterRead)
def get_printer(
    printer_id: int,
    session: Session = Depends(get_session),
):
    printer = session.get(Printer, printer_id)
    if not printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )
    return PrinterRead.from_printer(printer)


@router.put("/{printer_id}", response_model=PrinterRead)
def update_printer(
    printer_id: int,
    printer_data: PrinterUpdate,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    new_access_code = (
        db_printer.access_code
        if not printer_data.access_code
        or printer_data.access_code == MASKED_ACCESS_CODE
        else printer_data.access_code
    )

    connection_changed = (
        db_printer.ip_address != printer_data.ip_address
        or db_printer.serial_number != printer_data.serial_number
        or db_printer.access_code != new_access_code
        or db_printer.is_active != printer_data.is_active
    )

    db_printer.name = printer_data.name
    db_printer.ip_address = printer_data.ip_address
    db_printer.serial_number = printer_data.serial_number
    db_printer.access_code = new_access_code
    db_printer.is_active = printer_data.is_active

    session.add(db_printer)
    session.commit()
    session.refresh(db_printer)

    if connection_changed and db_printer.id is not None:
        if db_printer.is_active:
            mqtt_service.register_printer(
                printer_id=db_printer.id,
                host=db_printer.ip_address,
                serial=db_printer.serial_number,
                access_code=db_printer.access_code,
            )
        else:
            mqtt_service.unregister_printer(db_printer.id)

    return PrinterRead.from_printer(db_printer)


@router.delete("/{printer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_printer(
    printer_id: int,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    mqtt_service.unregister_printer(printer_id)
    assignments = session.exec(
        select(PrinterSlotAssignment).where(
            PrinterSlotAssignment.printer_id == printer_id
        )
    ).all()
    for a in assignments:
        session.delete(a)
    session.delete(db_printer)
    session.commit()
    return None


@router.get("/{printer_id}/status")
def get_printer_status(
    printer_id: int,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    if not db_printer.is_active:
        return {}

    raw_status = mqtt_service.get_status(printer_id)
    return _enrich_status_with_slots(session, printer_id, raw_status)


@router.get("/{printer_id}/slots", response_model=List[PrinterSlotRead])
def get_printer_slots(
    printer_id: int,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    status_data = mqtt_service.get_status(printer_id) if db_printer.is_active else {}
    return PrinterSlotService.build_printer_slots(session, printer_id, status_data)


@router.put(
    "/{printer_id}/slots/{slot_index}",
    response_model=PrinterSlotRead,
)
def assign_printer_slot(
    printer_id: int,
    slot_index: int,
    body: PrinterSlotAssignRequest,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    return PrinterSlotService.assign_slot(
        session=session,
        mqtt_service=mqtt_service,
        printer_id=printer_id,
        slot_index=slot_index,
        filament_id=body.filament_id,
    )


@router.post("/{printer_id}/poll")
def manual_poll_printer(
    printer_id: int,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    if db_printer.is_active:
        mqtt_service.manual_poll(printer_id)

    return {"status": "request_sent"}
