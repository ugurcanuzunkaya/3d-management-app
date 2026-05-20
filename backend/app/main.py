import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
from app.database import engine
from app.models import Printer
from app.config import get_settings
from app.dependencies import get_mqtt_service
from app.routers import filaments, jobs, models, printer, settings, privacy_presets

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


async def background_poll():
    mqtt_service = get_mqtt_service()
    while True:
        try:
            mqtt_service.manual_poll_all()
        except Exception as e:
            logger.error(f"Error in background poll: {e}")
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    mqtt_service = get_mqtt_service()
    polling_task = None
    try:
        # Load printers on startup
        settings = get_settings()
        with Session(engine) as session:
            printers = session.exec(select(Printer)).all()
            if not printers:
                ip = settings.bambu_printer_ip
                serial = settings.bambu_printer_serial
                code = settings.bambu_printer_access_code
                if ip and serial and code:
                    default_printer = Printer(
                        name="Default Printer",
                        ip_address=ip,
                        serial_number=serial,
                        access_code=code,
                        is_active=True,
                    )
                    session.add(default_printer)
                    session.commit()
                    session.refresh(default_printer)
                    printers = [default_printer]
                    logger.info("Seeded default printer from environment variables.")

            # Register all active printers in the MQTT service
            for p in printers:
                if p.is_active:
                    mqtt_service.register_printer(
                        printer_id=p.id,  # type: ignore
                        host=p.ip_address,
                        serial=p.serial_number,
                        access_code=p.access_code,
                    )

        mqtt_service.start()
        polling_task = asyncio.create_task(background_poll())
    except Exception as e:
        logger.error(f"Failed to start MQTT service: {e}")

    yield

    if polling_task:
        polling_task.cancel()
    mqtt_service.stop()


app = FastAPI(
    title="3D Management App",
    description="Modularized 3D printer and filament management system",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include Routers
app.include_router(filaments.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(printer.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(privacy_presets.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
