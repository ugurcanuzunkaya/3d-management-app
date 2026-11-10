# Task 10: Unified Backend `CostService` & Configurable Pricing Formula

**Description:**
Connect `CostService` (`backend/app/services/cost_service.py`) to `Settings` and `JobService` (`backend/app/services/job_service.py`) so that all production cost and retail price calculations are unified and driven by database settings:
1. Extend `Settings` (`backend/app/models/settings.py` & `backend/app/schemas/settings.py`) with:
   - `markup_multiplier: float = 3.0` (configurable multiplier instead of hardcoded `3.0`)
   - `machine_hourly_rate: float = 0.0` (depreciation/maintenance cost per print hour)
   - `failure_rate_pct: float = 0.0` (risk margin percentage added to production cost)
   - `currency: str = "TRY"` (currency code/symbol for display)
2. Upgrade `CostService` to support multi-filament jobs (summing `grams_used / 1000 * filament.price_per_kg` across all `JobFilament` items), electricity cost (`(fallback_wattage / 1000) * (duration_minutes / 60) * electric_price`), machine wear (`machine_hourly_rate * (duration_minutes / 60)`), failure margin (`* (1 + failure_rate_pct / 100)`), markup multiplier, and `custom_costs` (`[{"name": "Packaging", "value": 15.0}]`).
3. Expose `POST /api/jobs/calculate-cost` so the frontend quote calculator and pending print review modal get authoritative real-time cost breakdowns, and call `CostService` inside `JobService.create_job` and `JobService.update_job` whenever `production_cost` or `total_cost` is not manually overridden.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write backend tests in `backend/tests/test_cost_service.py`:
     - Test multi-filament production cost + electricity + machine wear + failure rate buffer + configurable `markup_multiplier` + `custom_costs`.
     - Test `POST /api/jobs/calculate-cost` endpoint returning `{ filament_cost, electricity_cost, machine_wear_cost, failure_buffer_cost, production_cost, suggested_price, custom_costs_total, final_total_price, net_profit, margin_pct }`.
     - Test `POST /api/jobs` automatically computing `production_cost` and `total_cost` via `CostService` when `total_cost` is omitted or `0`.
2. **Green:**
   - Update `Settings` model, schemas, and Alembic migration.
   - Refactor `CostService` and wire it into `JobService` and `routers/jobs.py`.
3. **Refactor:** Ensure zero lint or type-check issues.

**Acceptance Criteria:**
- [ ] `Settings` persists `markup_multiplier`, `machine_hourly_rate`, `failure_rate_pct`, and `currency`.
- [ ] `CostService` accurately computes multi-filament cost, electricity cost, machine wear, failure margin, suggested retail price, net profit, and profit margin %.
- [ ] `POST /api/jobs/calculate-cost` returns the full itemized cost breakdown.
- [ ] `JobService.create_job` and `JobService.update_job` use `CostService` instead of leaving `CostService` as dead code.

**Verification:**
- [ ] Backend tests pass: `rtk uv run --directory backend pytest`
- [ ] Backend lint & types pass: `rtk uv run --directory backend ruff check .` and `rtk uv run --directory backend ty check`

**Dependencies:** Task 01, Task 08

**Files Likely Touched:**
- `backend/app/models/settings.py`
- `backend/app/schemas/settings.py`
- `backend/app/schemas/job.py`
- `backend/app/services/cost_service.py`
- `backend/app/services/job_service.py`
- `backend/app/routers/jobs.py`
- `backend/tests/test_cost_service.py`

**Estimated Scope:** Medium (5–7 files)
