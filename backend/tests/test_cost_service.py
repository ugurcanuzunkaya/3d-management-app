import pytest
from app.services.cost_service import CostService

def test_calculate_production_cost():
    # 100g filament at 500TL/kg = 50TL
    # 60 min at 350W at 2TL/kWh = 0.35 * 1 * 2 = 0.7TL
    # Total = 50.7TL
    cost = CostService.calculate_production_cost(
        used_filament_g=100.0,
        filament_price_per_kg=500.0,
        duration_minutes=60,
        power_usage_kwh=0.0,
        electric_price=2.0,
        fallback_wattage=350.0
    )
    assert round(cost, 2) == 50.70

def test_calculate_total_price():
    production_cost = 50.0
    # 50 * 3 = 150
    # + box (10) = 160
    total = CostService.calculate_total_price(
        production_cost=production_cost,
        custom_costs=[{"name": "Box", "value": 10.0}]
    )
    assert total == 160.0
