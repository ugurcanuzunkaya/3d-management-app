import pytest
from sqlmodel import SQLModel, create_engine, Session, select
from app.models import Filament, FilamentSeries, Settings

@pytest.fixture(name="session")
def session_fixture():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

def test_create_settings(session: Session):
    settings = Settings(electric_price=3.0, fallback_wattage=400.0)
    session.add(settings)
    session.commit()
    
    db_settings = session.exec(select(Settings)).first()
    assert db_settings.electric_price == 3.0
    assert db_settings.fallback_wattage == 400.0

def test_create_filament_with_series(session: Session):
    series = FilamentSeries(
        name="Test Series",
        nozzle_temp="200",
        bed_temp="60"
    )
    session.add(series)
    session.commit()
    
    filament = Filament(
        name="Test Filament",
        series_id=series.id,
        type="PLA",
        color="Red",
        price_per_kg=100.0,
        remaining_weight_g=500.0
    )
    session.add(filament)
    session.commit()
    
    db_filament = session.exec(select(Filament).where(Filament.name == "Test Filament")).first()
    assert db_filament.series.name == "Test Series"
    assert db_filament.remaining_weight_g == 500.0
