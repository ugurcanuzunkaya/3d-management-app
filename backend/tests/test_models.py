import pytest
from sqlmodel import SQLModel, create_engine, Session, select
from app.models import Filament, Settings


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
    assert db_settings is not None
    assert db_settings.electric_price == 3.0
    assert db_settings.fallback_wattage == 400.0


def test_create_filament_with_type_and_color(session: Session):
    from app.models import FilamentType, FilamentColor

    f_type = FilamentType(name="PLA")
    color = FilamentColor(name="Red")
    session.add(f_type)
    session.add(color)
    session.commit()

    filament = Filament(
        name="Test Filament",
        type_id=f_type.id,
        color_id=color.id,
        price_per_kg=100.0,
        remaining_weight_g=500.0,
    )
    session.add(filament)
    session.commit()

    db_filament = session.exec(
        select(Filament).where(Filament.name == "Test Filament")
    ).first()
    assert db_filament is not None
    assert db_filament.filament_type is not None
    assert db_filament.filament_type.name == "PLA"
    assert db_filament.remaining_weight_g == 500.0


def test_filament_brand_and_tare_fields_with_clamping(session: Session):
    from app.models import FilamentType, FilamentColor
    from app.schemas.filament import FilamentCreate, FilamentUpdate
    from app.services.filament_service import FilamentService

    f_type = FilamentType(name="PETG")
    color = FilamentColor(name="Black", hex_code="#111111")
    session.add_all([f_type, color])
    session.commit()
    session.refresh(f_type)
    session.refresh(color)
    assert f_type.id is not None
    assert color.id is not None

    created = FilamentService.create_filament(
        session,
        FilamentCreate(
            name="eSUN PETG Black",
            brand="eSUN",
            type_id=f_type.id,
            color_id=color.id,
            price_per_kg=650.0,
            initial_weight_g=1000.0,
            empty_spool_weight_g=210.0,
            remaining_weight_g=790.0,
            is_opened=True,
        ),
    )
    assert created.id is not None
    assert created.brand == "eSUN"
    assert created.initial_weight_g == 1000.0
    assert created.empty_spool_weight_g == 210.0
    assert created.remaining_weight_g == 790.0

    # Updating remaining_weight_g below 0 clamps to 0.0
    updated = FilamentService.update_filament(
        session,
        created.id,
        FilamentUpdate(remaining_weight_g=-45.0),
    )
    assert updated.remaining_weight_g == 0.0
