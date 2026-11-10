# Task 04: Decompose Oversized Pages (`Printer.tsx`, `Jobs.tsx`, `StockSettings.tsx`)

**Description:**
Decompose the remaining oversized frontend files (`Printer.tsx` at 839 lines, `Jobs.tsx` at 457 lines, `PrinterStatusWidget.tsx` at 432 lines, plus `StockSettings.tsx` and `FilamentFormModal.tsx`) by wiring the extracted components in `src/components/printer/*`, `src/components/jobs/*`, and `src/components/stock/*` (and wrapping them with `<PrivacyWrapper>` so zero Privacy Mode functionality is lost). Also fix Bug 5 (`Printer.tsx` offline banner not rendering when `gcode_state === "OFFLINE"` and `last_updated === null`).

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write a test in `frontend/src/test/Printer.test.tsx` verifying that when a printer returns `{ gcode_state: 'OFFLINE', last_updated: null }`, the `"Printer Offline"` troubleshooting view is rendered instead of `0°C` live telemetry.
   - Run `rtk bun run --cwd frontend lint` to see the `max-lines` and `max-lines-per-function` warnings on `Printer.tsx`, `Jobs.tsx`, and `PrinterStatusWidget.tsx`.
2. **Green:**
   - Update `PrinterCards.tsx`, `PrinterStatusViews.tsx`, and `PrinterStatusBadge.tsx` with `<PrivacyWrapper>` support and multi-printer props, then wire them into `Printer.tsx` and `PrinterStatusWidget.tsx`.
   - Fix `isOffline` in `Printer.tsx` and `PrinterStatusWidget.tsx` so `status?.gcode_state === 'OFFLINE' || status?.online?.ahb === false` also triggers the offline view even when `last_updated` is `null`.
   - Update `JobForm.tsx`, `JobTable.tsx`, and `FilamentUsageRow.tsx` with `<PrivacyWrapper>` and edit-mode support, then wire them into `Jobs.tsx`.
   - Wire `ColorSettings.tsx`, `TypeSettings.tsx`, `PaginationControl.tsx`, and `FilamentFormBody.tsx` into `StockSettings.tsx`, `FilamentStock.tsx`, and `FilamentFormModal.tsx`.
3. **Refactor:** Verify every single `.ts` and `.tsx` file in `frontend/src/` has **0 ESLint errors and 0 ESLint warnings** under the 300-line / 100-line-per-function / complexity-15 rules.

**Acceptance Criteria:**
- [ ] `Printer.tsx`, `Jobs.tsx`, `PrinterStatusWidget.tsx`, `StockSettings.tsx`, and `FilamentFormModal.tsx` are all under 300 lines (excluding blank lines and comments) and under 100 lines per function.
- [ ] When a printer has `gcode_state: "OFFLINE"` and `last_updated: null`, `Printer.tsx` displays the `"Printer Offline"` panel.
- [ ] `rtk bun run --cwd frontend lint` reports **0 errors and 0 warnings** across the entire frontend.

**Verification:**
- [ ] Tests pass: `rtk bun run --cwd frontend test -- --run`
- [ ] Lint passes with 0 warnings: `rtk bun run --cwd frontend lint`
- [ ] Type check & build pass: `rtk bun run --cwd frontend build`

**Dependencies:** Task 02, Task 03

**Files Likely Touched:**
- `frontend/src/pages/Printer.tsx`
- `frontend/src/pages/Jobs.tsx`
- `frontend/src/pages/StockSettings.tsx`
- `frontend/src/components/dashboard/PrinterStatusWidget.tsx`
- `frontend/src/components/printer/PrinterCards.tsx`
- `frontend/src/components/printer/PrinterStatusViews.tsx`
- `frontend/src/components/jobs/JobForm.tsx`
- `frontend/src/components/jobs/JobTable.tsx`
- `frontend/src/test/Printer.test.tsx`

**Estimated Scope:** Medium (6–8 files)
