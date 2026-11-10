# Master Task Checklist (`todo.md`)

> Track progress across all 5 phases. Every task follows strict **Red -> Green -> Refactor TDD** and must clear all backend (`ruff`, `ty`, `pytest`) and frontend (`eslint`, `tsc`, `vite build`, `vitest`) gates.

---

## Phase 01: Foundation, Tooling Gates & Architecture Wiring
Folder: [`./01-foundation-and-bugfixes/`](./01-foundation-and-bugfixes/README.md)

- [x] **Task 01**: [Backend Tooling, Config Unification & DB Lifecycle](./01-foundation-and-bugfixes/task-01-backend-tooling-and-db-init.md) (Scope: Small, 4 files)
- [x] **Task 02**: [Frontend ESLint Rules, Zero Suppressions & Tailwind Theme Fix](./01-foundation-and-bugfixes/task-02-frontend-lint-and-css-theme.md) (Scope: Medium, 5 files)
- [x] **Task 03**: [Wire Frontend API & React Query Hooks (Fix Filament 405 & Printer Poll)](./01-foundation-and-bugfixes/task-03-wire-modular-hooks-and-apis.md) (Scope: Medium, 5 files)
- [x] **Task 04**: [Decompose Oversized Pages (`Printer.tsx`, `Jobs.tsx`, `StockSettings.tsx`)](./01-foundation-and-bugfixes/task-04-decompose-oversized-pages.md) (Scope: Medium, 5 files)

### Checkpoint 01: After Tasks 01–04
- [x] `rtk uv run --directory backend ruff check .` passes (0 errors)
- [x] `rtk uv run --directory backend ty check` passes (0 errors, 0 `# type: ignore`)
- [x] `rtk uv run --directory backend pytest` passes without needing `python -m`
- [x] `rtk bun run --cwd frontend lint` passes with `max-lines: 300`, `max-lines-per-function: 100`, `complexity: 15` (0 errors, 0 warnings, 0 `eslint-disable`)
- [x] `rtk bun run --cwd frontend build` succeeds with 0 LightningCSS warnings and code-split chunks <500 kB
- [x] `rtk bun run --cwd frontend test -- --run` passes
- [x] Review with human before proceeding to Phase 02

---

## Phase 02: Bambu Lab P2S & AMS 2 Pro Sync
Folder: [`./02-bambu-p2s-and-ams2-pro-sync/`](./02-bambu-p2s-and-ams2-pro-sync/README.md)

- [x] **Task 05**: [MQTT Deep-Merge Telemetry, P2S Chamber Temp & Credential Masking](./02-bambu-p2s-and-ams2-pro-sync/task-05-mqtt-deep-merge-and-p2s-telemetry.md) (Scope: Medium, 4 files)
- [x] **Task 06**: [AMS 2 Pro & External Spool Slot Assignment for Non-Bambu Filaments](./02-bambu-p2s-and-ams2-pro-sync/task-06-ams2-pro-and-external-slot-assignment.md) (Scope: Medium, 5 files)
- [x] **Task 07**: [Pending Completed Prints Review Queue (`RUNNING` -> `FINISH`)](./02-bambu-p2s-and-ams2-pro-sync/task-07-pending-completed-prints-queue.md) (Scope: Medium, 5 files)

### Checkpoint 02: After Tasks 05–07
- [x] All backend & frontend tests pass
- [x] P2S sample payload (`printer_data_dump.json`) parses chamber temp (`31°C`), AMS 2 Pro humidity (`35%`), temp (`26.9°C`), and all 4 trays + `vir_slot`
- [x] Assigning a local `Filament` spool to AMS Slot 1–4 or External Holder persists and enriches printer status
- [x] Simulated `RUNNING` -> `FINISH` transition creates a Pending Print Job that can be edited and approved to deduct filament weight
- [x] Review with human before proceeding to Phase 03

---

## Phase 03: Inventory & Manual Stock Control
Folder: [`./03-inventory-and-stock-control/`](./03-inventory-and-stock-control/README.md)

- [x] **Task 08**: [Spool Brand, Tare Weight Calculator & Quick Gram Adjustments](./03-inventory-and-stock-control/task-08-spool-brand-weight-and-taring.md) (Scope: Medium, 5 files)
- [x] **Task 09**: [AMS 2 Pro Visual Slot Cards, Color Match & Low-Stock Alerts](./03-inventory-and-stock-control/task-09-ams-color-and-low-stock-sync.md) (Scope: Medium, 4 files)

### Checkpoint 03: After Tasks 08–09
- [x] All backend & frontend tests pass
- [x] User can enter gross scale weight on a spool card/modal and have empty spool tare weight automatically subtracted
- [x] Quick `-10g / -50g / +50g` buttons update stock immediately with optimistic/invalidated query updates
- [x] AMS 2 Pro UI shows assigned local spool name, brand, color swatch, remaining grams, and low-stock warning badge
- [x] Review with human before proceeding to Phase 04

---

## Phase 04: Cost & Pricing Engine
Folder: [`./04-cost-and-pricing-engine/`](./04-cost-and-pricing-engine/README.md)

- [x] **Task 10**: [Unified Backend `CostService` & Configurable Pricing Formula](./04-cost-and-pricing-engine/task-10-unified-backend-cost-service.md) (Scope: Medium, 5 files)
- [x] **Task 11**: [Interactive Cost & Quote Calculator UI + Model Library & Printer Linking](./04-cost-and-pricing-engine/task-11-interactive-quote-and-job-builder.md) (Scope: Medium, 5 files)

### Checkpoint 04: After Tasks 10–11
- [x] All backend & frontend tests pass
- [x] Cost calculation matches across backend `CostService` and frontend `JobForm` / Quote Calculator
- [x] Creating a job from a `Model3D` item pre-fills weight, duration, and filament type
- [x] Pending Completed Prints use `CostService` to compute accurate production cost and suggested retail price
- [x] Review with human before proceeding to Phase 05

---

## Phase 05: Business Dashboard & Unified Settings
Folder: [`./05-business-dashboard-and-settings/`](./05-business-dashboard-and-settings/README.md)

- [x] **Task 12**: [Business KPI Dashboard (Revenue, Cost, Profit, AMS & Pending Prints)](./05-business-dashboard-and-settings/task-12-business-kpi-dashboard.md) (Scope: Medium, 4 files)
- [x] **Task 13**: [Unified Tabbed Settings, Local Backup/Export & Privacy Mode Polish](./05-business-dashboard-and-settings/task-13-unified-settings-and-backup.md) (Scope: Medium, 5 files)

### Checkpoint 05: Final Phase 1 Verification
- [x] All backend tests (`pytest`), type checks (`ty`), and lint checks (`ruff`) pass with 0 warnings
- [x] All frontend tests (`vitest`), type checks (`tsc`), lint checks (`eslint`), and production build (`vite build`) pass with 0 warnings
- [x] Privacy Mode masks all sensitive numbers, names, and credentials across Dashboard, Printer, Inventory, Jobs, Models, and Settings
- [x] Full review with human
