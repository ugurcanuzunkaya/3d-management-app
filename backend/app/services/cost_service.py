from typing import Any, Dict, List, Optional
from sqlmodel import Session
from app.models.filament import Filament
from app.services.settings_service import SettingsService


class CostService:
    @staticmethod
    def calculate_production_cost(
        used_filament_g: float,
        filament_price_per_kg: float,
        duration_minutes: int,
        power_usage_kwh: float,
        electric_price: float,
        fallback_wattage: float = 200.0,
    ) -> float:
        filament_cost = (used_filament_g / 1000.0) * filament_price_per_kg
        if power_usage_kwh <= 0:
            power_usage_kwh = (fallback_wattage / 1000.0) * (duration_minutes / 60.0)
        power_cost = power_usage_kwh * electric_price
        return filament_cost + power_cost

    @staticmethod
    def calculate_total_price(
        production_cost: float,
        custom_costs: Optional[List[Dict[str, Any]]] = None,
        markup_multiplier: float = 3.0,
    ) -> float:
        total = production_cost * markup_multiplier
        if custom_costs:
            for cost in custom_costs:
                total += float(cost.get("value", 0.0))
        return total

    @staticmethod
    def calculate_job_breakdown(
        session: Session,
        filaments: List[Dict[str, Any]],
        duration_minutes: int,
        custom_costs: Optional[List[Dict[str, Any]]] = None,
        markup_override: Optional[float] = None,
    ) -> Dict[str, float]:
        settings = SettingsService.get_or_create_settings(session)
        hours = max(0.0, duration_minutes / 60.0)

        filament_cost = 0.0
        for item in filaments:
            fid = item.get("filament_id")
            grams = float(item.get("grams_used", 0.0))
            if fid is not None and grams > 0:
                db_filament = session.get(Filament, int(fid))
                price_per_kg = db_filament.price_per_kg if db_filament else 0.0
                filament_cost += (grams / 1000.0) * price_per_kg

        electricity_cost = (
            (settings.fallback_wattage / 1000.0) * hours * settings.electric_price
        )
        machine_wear_cost = settings.machine_hourly_rate * hours
        base_production_cost = filament_cost + electricity_cost + machine_wear_cost
        failure_buffer_cost = base_production_cost * (
            max(0.0, settings.failure_rate_pct) / 100.0
        )
        production_cost = base_production_cost + failure_buffer_cost

        multiplier = (
            markup_override
            if markup_override is not None and markup_override > 0
            else (settings.markup_multiplier if settings.markup_multiplier > 0 else 3.0)
        )
        suggested_price = production_cost * multiplier

        custom_costs_total = 0.0
        if custom_costs:
            for c in custom_costs:
                custom_costs_total += float(c.get("value", 0.0))

        final_total_price = suggested_price + custom_costs_total
        net_profit = final_total_price - production_cost - custom_costs_total
        margin_pct = (
            (net_profit / final_total_price) * 100.0 if final_total_price > 0 else 0.0
        )

        return {
            "filament_cost": round(filament_cost, 2),
            "electricity_cost": round(electricity_cost, 2),
            "machine_wear_cost": round(machine_wear_cost, 2),
            "failure_buffer_cost": round(failure_buffer_cost, 2),
            "production_cost": round(production_cost, 2),
            "suggested_price": round(suggested_price, 2),
            "custom_costs_total": round(custom_costs_total, 2),
            "final_total_price": round(final_total_price, 2),
            "net_profit": round(net_profit, 2),
            "margin_pct": round(margin_pct, 2),
        }
