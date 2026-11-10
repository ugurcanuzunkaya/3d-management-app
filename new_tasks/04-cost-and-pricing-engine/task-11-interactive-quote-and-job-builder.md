# Task 11: Interactive Cost & Quote Calculator UI + Model Library & Printer Linking

**Description:**
Upgrade the Frontend Jobs & Costing experience (`JobForm.tsx`, `JobTable.tsx`, `Jobs.tsx`, `ModelCard.tsx`) to expose the full power of the unified `CostService`:
1. **Itemized Cost & Profit Breakdown in `JobForm.tsx`**:
   - Show live itemized breakdown: **Filament Cost**, **Electricity Cost**, **Machine Wear**, **Total Production Cost**, **Markup Multiplier** (defaulting to `settings.markup_multiplier` e.g. `3x`, adjustable per job), **Custom Costs** list (add/remove rows like Packaging, Magnets, Labor), **Final Sales Price** (auto-calculated from markup + custom costs, or manually overridden), and **Net Profit + Profit Margin %**.
2. **Link `PrintJob` to `Model3D` and `Printer`**:
   - Add `model_id` selector and `printer_id` selector to `JobForm.tsx`.
   - When the user selects a `Model3D` in `JobForm.tsx`—or clicks a new **"Quote / Log Print"** button on `ModelCard.tsx` in `ModelLibrary.tsx` (navigating to `/jobs?modelId=X`)—automatically pre-fill the job name, print duration (`print_time_minutes`), and estimated filament weight (`weight_g`).
3. **Profit & Margin Columns in `JobTable.tsx`**:
   - Display Production Cost, Sales Price, and **Net Profit badge (`+₺109.30` / `68%`)** in `JobTable.tsx` (wrapped in `<PrivacyWrapper>`).

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write frontend unit tests in `frontend/src/test/Jobs.test.tsx`:
     - Verify selecting a filament and duration in `JobForm` displays the itemized cost breakdown (Filament Cost, Power Cost, Production Cost, `3x` Suggested Price, and Net Profit) and allows adding a Custom Cost item (`"Box"`, `10`).
     - Verify navigating to `/jobs?modelId=1` pre-populates the job form with Model 1's name, duration, and filament weight.
     - Verify editing an existing job's filament weight recalculates the production and total cost.
2. **Green:**
   - Update `frontend/src/types/job.ts`, `frontend/src/api/jobs.ts`, and `frontend/src/hooks/use-jobs.ts`.
   - Enhance `JobForm.tsx`, `JobTable.tsx`, and `ModelCard.tsx`.
3. **Refactor:** Keep `JobForm.tsx`, `JobTable.tsx`, and `Jobs.tsx` strictly under 300 lines and 100 lines per function.

**Acceptance Criteria:**
- [ ] `JobForm` shows live itemized cost breakdown (Filament, Electricity, Wear, Production Cost, Markup Multiplier, Custom Costs, Final Price, Net Profit) and allows manual final price override.
- [ ] Users can link a job to a `Printer` and a `Model3D`, or click `"Quote / Print"` directly on a `ModelCard` in `ModelLibrary` to pre-fill the form.
- [ ] Editing an existing job's filaments or duration properly updates `production_cost` and `total_cost`.
- [ ] `JobTable` displays Net Profit and Margin % wrapped in `<PrivacyWrapper>`.

**Verification:**
- [ ] Frontend tests pass: `rtk bun run --cwd frontend test -- --run`
- [ ] Frontend lint & build pass: `rtk bun run --cwd frontend lint && rtk bun run --cwd frontend build`

**Dependencies:** Task 04, Task 07, Task 10

**Files Likely Touched:**
- `frontend/src/types/job.ts`
- `frontend/src/api/jobs.ts`
- `frontend/src/components/jobs/JobForm.tsx`
- `frontend/src/components/jobs/JobTable.tsx`
- `frontend/src/components/models/ModelCard.tsx`
- `frontend/src/pages/Jobs.tsx`
- `frontend/src/test/Jobs.test.tsx` (new)

**Estimated Scope:** Medium (5–7 files)
