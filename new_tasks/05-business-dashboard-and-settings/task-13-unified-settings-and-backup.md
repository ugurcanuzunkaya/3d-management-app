# Task 13: Unified Tabbed Settings, Local Backup/Export & Privacy Mode Polish

**Description:**
Consolidate the fragmented `/settings` (`Settings.tsx`) and `/filaments/settings` (`StockSettings.tsx`) pages into a unified, tabbed **Settings Center** at `/settings` (while keeping `/filaments/settings` redirecting or opening the Inventory tab of `/settings` so bookmarks/buttons work seamlessly):
1. **Tab 1 — Financial & Pricing Defaults**:
   - Currency (`TRY`, `USD`, `EUR`, `GBP`)
   - Electricity Price (per kWh) & Fallback Printer Wattage (W)
   - Default Markup Multiplier (e.g., `3.0x`), Machine Hourly Rate (depreciation/wear per hour), and Failure Rate Buffer (%)
   - Live interactive formula preview showing how a sample 100g / 2h print is priced.
2. **Tab 2 — Inventory & Filament Catalog**:
   - Default Spool Weight (`g`), Default Empty Spool Tare Weight (`g`), Low Stock Alert Threshold (`g`), and Default Filament Density (`g/cm³`).
   - Filament Types (`TypeSettings.tsx`) and Filament Colors (`ColorSettings.tsx`) management.
3. **Tab 3 — Local Data Backup & Export**:
   - `GET /api/settings/export` endpoint and UI button to download a full JSON backup of all local data (Filaments, Series, Types, Colors, Jobs, Models, Printers without raw access codes, Settings) for safe local business backup.
4. **Privacy Mode Audit**:
   - Verify every page (`Dashboard`, `FilamentStock`, `Printer`, `Jobs`, `ModelLibrary`, `Settings`) has comprehensive `<PrivacyWrapper>` keys and works smoothly with `PrivacyEditPanel`.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write backend test in `backend/tests/test_models.py` (or `test_integration.py`) testing `PUT /api/settings` with the new pricing fields (`markup_multiplier`, `machine_hourly_rate`, `failure_rate_pct`, `currency`) and `GET /api/settings/export` returning a valid JSON snapshot.
   - Update frontend tests in `frontend/src/test/Settings.test.tsx` verifying the tabbed settings UI renders Financial/Pricing settings, Inventory/Types/Colors settings, and the Local Backup export action.
2. **Green:**
   - Add `/api/settings/export` in `backend/app/routers/settings.py`.
   - Update `frontend/src/pages/Settings.tsx` with tabs (`Financial & Pricing`, `Inventory & Catalog`, `Backup & Data`) reusing `TypeSettings.tsx` and `ColorSettings.tsx`.
3. **Refactor:** Ensure all files in the repository pass `ruff`, `ty`, `pytest`, `eslint`, `tsc`, `vite build`, and `vitest` with zero warnings or errors.

**Acceptance Criteria:**
- [ ] `/settings` provides unified access to Financial & Pricing settings, Inventory Defaults, Filament Types & Colors, and Local JSON Backup export.
- [ ] `GET /api/settings/export` returns a structured JSON backup of local business data (excluding sensitive printer access codes).
- [ ] All `<PrivacyWrapper>` keys across all pages are verified and tested.

**Verification:**
- [ ] Backend tests, lint & types pass: `rtk uv run --directory backend ruff check . && rtk uv run --directory backend ty check && rtk uv run --directory backend pytest`
- [ ] Frontend tests, lint, types & build pass: `rtk bun run --cwd frontend lint && rtk bun run --cwd frontend tsc --noEmit && rtk bun run --cwd frontend test -- --run && rtk bun run --cwd frontend build`

**Dependencies:** Task 04, Task 10

**Files Likely Touched:**
- `backend/app/routers/settings.py`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/pages/StockSettings.tsx`
- `frontend/src/test/Settings.test.tsx`

**Estimated Scope:** Medium (4–5 files)
