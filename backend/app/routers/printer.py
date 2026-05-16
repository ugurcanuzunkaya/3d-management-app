from fastapi import APIRouter, Depends
from app.dependencies import get_mqtt_service
from app.services.mqtt_service import BambuMQTTService

router = APIRouter(prefix="/printer", tags=["printer"])


@router.get("/status")
def get_printer_status(mqtt_service: BambuMQTTService = Depends(get_mqtt_service)):
    return mqtt_service.get_status()


@router.post("/poll")
def manual_poll_printer(mqtt_service: BambuMQTTService = Depends(get_mqtt_service)):
    mqtt_service.manual_poll()
    return {"status": "request_sent"}
