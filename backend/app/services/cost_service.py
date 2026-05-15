from typing import List, Dict, Optional, Any


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
        # Filament Cost
        filament_cost = (used_filament_g / 1000.0) * filament_price_per_kg

        # Power Cost
        # If power_usage_kwh is 0, use fallback
        if power_usage_kwh <= 0:
            power_usage_kwh = (fallback_wattage / 1000.0) * (duration_minutes / 60.0)

        power_cost = power_usage_kwh * electric_price

        return filament_cost + power_cost

    @staticmethod
    def calculate_total_price(
        production_cost: float, custom_costs: Optional[List[Dict[str, Any]]] = None
    ) -> float:
        total = production_cost * 3.0

        if custom_costs:
            for cost in custom_costs:
                total += cost.get("value", 0.0)

        return total
