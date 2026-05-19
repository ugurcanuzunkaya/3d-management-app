from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.dependencies import get_session, get_mqtt_service
from app.models.printer import Printer
from app.services.mqtt_service import BambuMQTTService

router = APIRouter(prefix="/printer", tags=["printer"])


@router.get("", response_model=List[Printer])
def list_printers(session: Session = Depends(get_session)):
    return session.exec(select(Printer)).all()


@router.post("", response_model=Printer, status_code=status.HTTP_201_CREATED)
def create_printer(
    printer_data: Printer,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    # Enforce fresh ID assignment
    printer_data.id = None
    session.add(printer_data)
    session.commit()
    session.refresh(printer_data)

    if printer_data.is_active:
        mqtt_service.register_printer(
            printer_id=printer_data.id,  # type: ignore
            host=printer_data.ip_address,
            serial=printer_data.serial_number,
            access_code=printer_data.access_code,
        )

    return printer_data


@router.get("/status")
def get_any_printer_status(
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    printer = session.exec(select(Printer).where(Printer.is_active)).first()
    if not printer:
        return {"last_updated": None}
    return mqtt_service.get_status(printer.id)  # type: ignore


@router.get("/status/all")
def get_all_printer_statuses(
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    printers = session.exec(select(Printer)).all()
    res = {}
    for p in printers:
        if p.is_active:
            res[p.id] = mqtt_service.get_status(p.id)  # type: ignore
        else:
            res[p.id] = {}
    return res


@router.get("/{printer_id}", response_model=Printer)
def get_printer(
    printer_id: int,
    session: Session = Depends(get_session),
):
    printer = session.get(Printer, printer_id)
    if not printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )
    return printer


@router.put("/{printer_id}", response_model=Printer)
def update_printer(
    printer_id: int,
    printer_data: Printer,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    # Check if connection parameters changed
    connection_changed = (
        db_printer.ip_address != printer_data.ip_address
        or db_printer.serial_number != printer_data.serial_number
        or db_printer.access_code != printer_data.access_code
        or db_printer.is_active != printer_data.is_active
    )

    db_printer.name = printer_data.name
    db_printer.ip_address = printer_data.ip_address
    db_printer.serial_number = printer_data.serial_number
    db_printer.access_code = printer_data.access_code
    db_printer.is_active = printer_data.is_active

    session.add(db_printer)
    session.commit()
    session.refresh(db_printer)

    if connection_changed:
        if db_printer.is_active:
            mqtt_service.register_printer(
                printer_id=db_printer.id,  # type: ignore
                host=db_printer.ip_address,
                serial=db_printer.serial_number,
                access_code=db_printer.access_code,
            )
        else:
            mqtt_service.unregister_printer(db_printer.id)  # type: ignore

    return db_printer


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
    session.delete(db_printer)
    session.commit()
    return None


@router.get("/{printer_id}/status")
def get_printer_status(
    printer_id: int,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    # Verify printer exists
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    if not db_printer.is_active:
        return {}

    return mqtt_service.get_status(printer_id)


@router.post("/{printer_id}/poll")
def manual_poll_printer(
    printer_id: int,
    session: Session = Depends(get_session),
    mqtt_service: BambuMQTTService = Depends(get_mqtt_service),
):
    # Verify printer exists
    db_printer = session.get(Printer, printer_id)
    if not db_printer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Printer not found"
        )

    if db_printer.is_active:
        mqtt_service.manual_poll(printer_id)

    return {"status": "request_sent"}
