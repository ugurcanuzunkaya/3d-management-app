# Task 08: Spool Brand, Tare Weight Calculator & Quick Gram Adjustments

**Description:**
Upgrade the `Filament` data model and inventory UI to make manual stock control for non-Bambu spools effortless:
1. Add `brand: Optional[str]` (e.g., `"eSUN"`, `"Polymaker"`, `"Sunlu"`), `initial_weight_g: float = 1000.0`, and `empty_spool_weight_g: float = 200.0` (tare weight of the empty plastic/cardboard reel) to `Filament` (`backend/app/models/filament.py` & `backend/app/schemas/filament.py`).
2. Add a **"Scale / Tare Weight Calculator"** helper in `FilamentFormBody.tsx` (and quick popover on `FilamentCard.tsx`): the user places their partially used spool on a digital scale, enters the gross scale reading (e.g., `680g`), and the app automatically computes `remaining_weight_g = max(0, gross_weight_g - empty_spool_weight_g)` (`480g`).
3. Add 1-click **Quick Adjust (`-50g`, `-10g`, `+50g`)** buttons on `FilamentCard.tsx` and compute progress bar percentage using `remaining_weight_g / initial_weight_g` instead of hardcoding `1000g`.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write backend tests in `backend/tests/test_models.py` testing `Filament` creation and `PATCH /api/filaments/{id}` with `brand`, `initial_weight_g`, `empty_spool_weight_g`, and clamping `remaining_weight_g >= 0`.
   - Write frontend tests in `frontend/src/test/FilamentStock.test.tsx` testing:
     - Scale Tare calculation (`gross = 680`, `empty_spool_weight_g = 200` -> sets `remaining_weight_g = 480`).
     - Quick `-50g` button on `FilamentCard` triggers `PATCH /api/filaments/{id}` with `remaining_weight_g - 50`.
2. **Green:**
   - Update `Filament` model, schemas, and Alembic migration.
   - Update `FilamentFormBody.tsx`, `FilamentFormModal.tsx`, and `FilamentCard.tsx`.
3. **Refactor:** Ensure all stock components stay under 300 lines and wrap financial/weight figures in `<PrivacyWrapper>`.

**Acceptance Criteria:**
- [ ] `Filament` stores `brand`, `initial_weight_g` (default `1000.0`), and `empty_spool_weight_g` (default `200.0`).
- [ ] Scale Tare helper calculates `remaining_weight_g = max(0, gross_scale_weight - empty_spool_weight_g)`.
- [ ] `FilamentCard` displays the spool brand, shows progress bar relative to `initial_weight_g`, and provides 1-click quick weight adjustment buttons.

**Verification:**
- [ ] Backend tests pass: `rtk uv run --directory backend pytest`
- [ ] Frontend tests pass: `rtk bun run --cwd frontend test -- --run`
- [ ] Lint & build pass: `rtk bun run --cwd frontend lint && rtk bun run --cwd frontend build`

**Dependencies:** Task 03, Task 04

**Files Likely Touched:**
- `backend/app/models/filament.py`
- `backend/app/schemas/filament.py`
- `backend/alembic/versions/..._add_filament_brand_and_tare.py`
- `frontend/src/types/filament.ts`
- `frontend/src/components/stock/FilamentFormBody.tsx`
- `frontend/src/components/stock/FilamentCard.tsx`
- `frontend/src/test/FilamentStock.test.tsx`

**Estimated Scope:** Medium (5–7 files)
