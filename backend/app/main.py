import logging
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.dependencies import get_mqtt_service
from app.routers import filaments, jobs, models, printer, settings

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)


async def background_poll():
    mqtt_service = get_mqtt_service()
    while True:
        try:
            mqtt_service.manual_poll()
        except Exception as e:
            logger.error(f"Error in background poll: {e}")
        await asyncio.sleep(60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Note: DB init and seeding now happen via Alembic and CLI respectively
    mqtt_service = get_mqtt_service()
    polling_task = None
    try:
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


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
