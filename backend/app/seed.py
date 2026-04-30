import json
import os
from sqlmodel import Session, select
from .database import engine, init_db
from .models import FilamentSeries, Filament, Settings


def seed_data():
    json_path = os.path.join(os.path.dirname(__file__), "..", "stock_data.json")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    with Session(engine) as session:
        # 1. Seed Settings if empty
        if not session.exec(select(Settings)).first():
            settings = Settings(
                electric_price=2.5, fallback_wattage=200.0
            )  # Default values
            session.add(settings)

        # 2. Seed Series
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

        # 3. Seed Inventory
        for item in data["inventory"]:
            filament = session.exec(
                select(Filament).where(Filament.id == item["id"])
            ).first()
            if not filament:
                # Extract type and color from name if possible
                # e.g., "Smart PLA Siyah (Black)"
                name_parts = item["name"].split(" ")
                f_type = name_parts[0] if len(name_parts) > 0 else "Unknown"
                color = " ".join(name_parts[2:]) if len(name_parts) > 2 else "Unknown"

                filament = Filament(
                    id=item["id"],
                    name=item["name"],
                    series_id=item["series_id"],
                    type=f_type,
                    color=color,
                    price_per_kg=500.0,
                    remaining_weight_g=1000.0 * item["quantity"],
                    is_opened=item["is_opened"],
                )
                session.add(filament)
        session.commit()
        print("Database seeded successfully!")


if __name__ == "__main__":
    init_db()
    seed_data()
