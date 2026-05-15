import json
import os
from sqlmodel import Session, select
from .database import engine, init_db
from .models import (
    FilamentSeries,
    Filament,
    Settings,
    FilamentType,
    FilamentColor,
    StockSettings,
)

COLOR_MAP = {
    "Siyah (Black)": "#1A1A1A",
    "Beyaz (White)": "#F5F5F5",
    "Mavi (Blue)": "#2563EB",
    "Yeşil (Green)": "#16A34A",
    "Kırmızı (Red)": "#DC2626",
    "Sarı (Yellow)": "#EAB308",
    "Mor (Purple)": "#9333EA",
    "Pembe (Pink)": "#EC4899",
    "Kahverengi (Brown)": "#92400E",
    "Gri (Grey)": "#6B7280",
    "Turuncu (Orange)": "#EA580C",
    "Doğal (Natural)": "#D4A574",
    "Toz Pembe (Powder Pink)": "#F9A8D4",
    "Bebek Mavisi (Baby Blue)": "#93C5FD",
    "Buz Mavi (Ice Blue)": "#BAE6FD",
    "Clay": "#C2956B",
}


def seed_data():
    with Session(engine) as session:
        # Check if already seeded (based on filaments)
        if session.exec(select(Filament)).first():
            return

    json_path = os.path.join(os.path.dirname(__file__), "..", "stock_data.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    with Session(engine) as session:
        # 1. Seed Settings if empty
        if not session.exec(select(Settings)).first():
            settings = Settings(electric_price=2.5, fallback_wattage=200.0)
            session.add(settings)

        # 2. Seed StockSettings if empty
        if not session.exec(select(StockSettings)).first():
            stock_settings = StockSettings(
                default_price_per_kg=500.0, default_weight_g=1000.0
            )
            session.add(stock_settings)

        # 3. Seed Colors
        for name, hex_code in COLOR_MAP.items():
            color = session.exec(
                select(FilamentColor).where(FilamentColor.name == name)
            ).first()
            if not color:
                color = FilamentColor(name=name, hex_code=hex_code)
                session.add(color)
        session.commit()

        # 4. Seed Types (from series names)
        for spec in data["series_specs"]:
            f_type = session.exec(
                select(FilamentType).where(FilamentType.name == spec["name"])
            ).first()
            if not f_type:
                f_type = FilamentType(name=spec["name"], is_custom=False)
                session.add(f_type)
        session.commit()

        # 5. Seed Series
        for spec in data["series_specs"]:
            series = session.exec(
                select(FilamentSeries).where(FilamentSeries.id == spec["id"])
            ).first()
            if not series:
                series = FilamentSeries(
                    id=spec["id"],
                    name=spec["name"],
                    nozzle_temp=spec.get("Yazdırma Sıcaklığı", "200-230 °C"),
                    bed_temp=spec.get("Tabla Sıcaklığı", "0-60 °C"),
                    other_specs=spec,
                )
                session.add(series)
        session.commit()

        # 6. Seed Inventory
        for item in data["inventory"]:
            filament = session.exec(
                select(Filament).where(Filament.id == item["id"])
            ).first()
            if not filament:
                # Find matching color
                found_color_id = None
                for c_name in COLOR_MAP:
                    if c_name.split(" ")[0] in item["name"]:
                        color_obj = session.exec(
                            select(FilamentColor).where(FilamentColor.name == c_name)
                        ).first()
                        if color_obj:
                            found_color_id = color_obj.id
                            break

                # Default to Siyah if not found
                if not found_color_id:
                    black = session.exec(
                        select(FilamentColor).where(
                            FilamentColor.name == "Siyah (Black)"
                        )
                    ).first()
                    found_color_id = black.id if black else None

                # Find matching type (via series)
                series_obj = session.exec(
                    select(FilamentSeries).where(FilamentSeries.id == item["series_id"])
                ).first()
                type_id = None
                if series_obj:
                    type_obj = session.exec(
                        select(FilamentType).where(FilamentType.name == series_obj.name)
                    ).first()
                    type_id = type_obj.id if type_obj else None

                filament = Filament(
                    id=item["id"],
                    name=item["name"],
                    series_id=item["series_id"],
                    type_id=type_id,
                    color_id=found_color_id,
                    price_per_kg=500.0,
                    remaining_weight_g=1000.0 * item["quantity"],
                    is_opened=item["is_opened"],
                )
                session.add(filament)
        session.commit()

        # Reset sequences for Postgres
        if "postgresql" in str(engine.url):
            from sqlalchemy import text

            for table in [
                "filament",
                "filamenttype",
                "filamentcolor",
                "stocksettings",
                "filamentseries",
                "model3d",
                "printjob",
            ]:
                try:
                    session.execute(
                        text(
                            f"SELECT setval('{table}_id_seq', (SELECT max(id) FROM {table}))"
                        )
                    )
                except Exception:
                    pass
            session.commit()

        print("Database seeded successfully!")


if __name__ == "__main__":
    from .models import SQLModel

    SQLModel.metadata.drop_all(engine)
    init_db()
    seed_data()
