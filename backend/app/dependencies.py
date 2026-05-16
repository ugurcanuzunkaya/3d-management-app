from typing import Generator, Optional
from sqlmodel import Session
from app.database import engine
from app.config import get_settings, AppSettings
from app.services.mqtt_service import BambuMQTTService

# Global MQTT service instance
_mqtt_service: Optional[BambuMQTTService] = None


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def get_settings_dep() -> AppSettings:
    return get_settings()


def get_mqtt_service() -> BambuMQTTService:
    global _mqtt_service
    if _mqtt_service is None:
        _mqtt_service = BambuMQTTService()
    return _mqtt_service
