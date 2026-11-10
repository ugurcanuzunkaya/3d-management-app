# Implementation Plan: 3D Printing Business Management App (Phase 1)

## Overview

Transform the existing prototype into a production-grade, local-first **3D Printing Business Management Application** tailored for operating a 3D printing business with a **Bambu Lab P2S + AMS 2 Pro + External Spool Holder** using third-party (non-Bambu) filaments. Phase 1 resolves all 8 confirmed functional/build bugs, wires the unused modular frontend architecture to enforce strict file/function complexity limits, solves the non-Bambu spool tracking gap via **Virtual AMS 2 Pro & External Slot Assignment** and **Tare Scale Weight Control**, adds a **Pending Completed Prints Review Queue**, unifies the **Cost & Pricing Engine**, upgrades the **Business KPI Dashboard**, and preserves full **Privacy Mode** support for marketing demos and screen sharing.

---

## Architecture Decisions

1. **Virtual Spool Assignment for AMS 2 Pro & External Holder (Solving Non-Bambu Spools)**:
   - *Context*: Real telemetry from the user's Bambu Lab P2S (`backend/printer_data_dump.json`) shows that third-party spools lack Bambu RFID tags (`tag_uid: "0000000000000000"`), causing the AMS 2 Pro to report `remain: -1` and `tray_weight: "0"`.
   - *Decision*: Introduce a `PrinterSlotAssignment` model (or `assigned_printer_id` + `assigned_slot_index` on `Filament` / dedicated `PrinterSlot` table) representing AMS 2 Pro Slots `0..3` (Slots 1–4) and External Holder Slot `254`/`255` (`vir_slot`). Users assign a local `Filament` spool to a physical slot in 1 click. The app merges live P2S telemetry (`tray_type`, `tray_color`, active `tray_now`, AMS 2 Pro `temp`, `humidity_raw`, and `dry_setting`) with the local spool's exact `remaining_weight_g`, brand, price/kg, and low-stock threshold.

2. **Pending Completed Prints Review Queue (`status: "pending" | "completed"`)**:
   - *Context*: Automatic stock deduction on print completion can be inaccurate if a print failed mid-way, used purge/poop waste, or needs manual price/custom cost adjustments.
   - *Decision*: When `BambuMQTTService` detects a state transition from `RUNNING`/`PAUSE` to `FINISH` (or a new completed `job_id`/`subtask_id`), it creates a `PrintJob` with `status = "pending"` (storing `printer_id`, `subtask_name`, elapsed `duration_minutes`, and pre-linking the `Filament` spools assigned to the active AMS slots). The user reviews, edits grams/costs/price in the UI, and clicks **"Approve & Deduct Stock"**, which transitions the job to `completed` and deducts `grams_used` from `Filament.remaining_weight_g`.

3. **Deep-Merge MQTT Telemetry Without Dropping Packets**:
   - *Context*: `PrinterConnection.on_message` currently drops any MQTT message arriving within 5 seconds of the previous message and performs a shallow `dict.update()`, losing delta fields and `pushall` responses. Also, Bambu Lab P2S reports chamber temperature at `device.ctc.info.temp` / `info.temp` rather than top-level `chamber_temper`.
   - *Decision*: Remove the 5-second drop gate in `on_message`. Recursively deep-merge every incoming `device/{serial}/report` payload into `self.last_status` under a `threading.Lock()`, and normalize P2S telemetry fields (`chamber_temper` fallback to `device.ctc.info.temp` or `info.temp`) so the frontend receives consistent telemetry.

4. **Manual Stock Control Ergonomics (Tare Weight & Quick Adjust)**:
   - *Context*: Because third-party spools do not report weight via RFID, the user manages stock manually.
   - *Decision*: Add `brand`, `initial_weight_g` (default `1000g`), and `empty_spool_weight_g` (tare weight, e.g., `200g`) to `Filament`. Provide a **"Weigh on Scale (Tare)"** helper (enter gross weight on scale -> automatically subtracts `empty_spool_weight_g` to set `remaining_weight_g`) plus quick `-10g`, `-50g`, `+50g`, and `Mark Empty` actions.

5. **Unified Cost & Pricing Engine (`CostService`)**:
   - *Context*: `CostService` was disconnected from routers, and `Jobs.tsx` hardcoded `1x` production cost as sales price.
   - *Decision*: Extend `Settings` with `markup_multiplier` (default `3.0`), `machine_hourly_rate` (default `0.0`), `failure_rate_pct` (default `5.0`), and `currency` (default `"TRY"` or `"USD"`). Expose a backend cost calculation endpoint `/api/jobs/calculate-cost` used by both the Interactive Quote Calculator and `JobService`.

6. **Wire Modular Frontend Hooks & Components to Meet Strict ESLint Complexity Limits**:
   - *Context*: `src/hooks/*`, `src/api/*`, `src/components/printer/*`, `src/components/jobs/*`, and `src/components/stock/*` were created in an earlier refactor but never wired into the pages, leaving `Printer.tsx` at 839 lines and `Jobs.tsx` at 457 lines.
   - *Decision*: Wire all pages to the modular hooks and sub-components, fix the Tailwind v3/v4 CSS variable mismatch in `index.css`, and enforce `max-lines: 300`, `max-lines-per-function: 100`, and `complexity: 15` in `eslint.config.js` with zero suppressions.

7. **Preserve & Extend Privacy Mode for Marketing & Demos**:
   - *Context*: The user plans to market this app and use Privacy Mode during screen shares and demos.
   - *Decision*: Keep `PrivacyContext`, `PrivacyWrapper`, `PrivacyEditPanel`, and `PrivacyPreset`, remove the `eslint-disable` suppression by splitting `usePrivacy` into its own hook file, and wrap all new Phase 1 financial/printer elements in `<PrivacyWrapper>`.

---

## Task List

### Phase 1: Foundation, Tooling Gates & Architecture Wiring (`01-foundation-and-bugfixes/`)
- [ ] **Task 01**: [Backend Tooling, Config Unification & DB Lifecycle](./01-foundation-and-bugfixes/task-01-backend-tooling-and-db-init.md)
- [ ] **Task 02**: [Frontend ESLint Rules, Zero Suppressions & Tailwind Theme Fix](./01-foundation-and-bugfixes/task-02-frontend-lint-and-css-theme.md)
- [ ] **Task 03**: [Wire Frontend API & React Query Hooks (Fix Filament 405 & Printer Poll)](./01-foundation-and-bugfixes/task-03-wire-modular-hooks-and-apis.md)
- [ ] **Task 04**: [Decompose Oversized Pages (`Printer.tsx`, `Jobs.tsx`, `StockSettings.tsx`)](./01-foundation-and-bugfixes/task-04-decompose-oversized-pages.md)

### Checkpoint 1: Clean Foundation
- [ ] All backend & frontend linters, type-checkers, builds, and unit tests pass with zero warnings/errors and every file under 300 lines.

### Phase 2: Bambu Lab P2S & AMS 2 Pro Sync (`02-bambu-p2s-and-ams2-pro-sync/`)
- [ ] **Task 05**: [MQTT Deep-Merge Telemetry, P2S Chamber Temp & Credential Masking](./02-bambu-p2s-and-ams2-pro-sync/task-05-mqtt-deep-merge-and-p2s-telemetry.md)
- [ ] **Task 06**: [AMS 2 Pro & External Spool Slot Assignment for Non-Bambu Filaments](./02-bambu-p2s-and-ams2-pro-sync/task-06-ams2-pro-and-external-slot-assignment.md)
- [ ] **Task 07**: [Pending Completed Prints Review Queue (`RUNNING` -> `FINISH`)](./02-bambu-p2s-and-ams2-pro-sync/task-07-pending-completed-prints-queue.md)

### Checkpoint 2: Live Hardware & Print Sync
- [ ] P2S telemetry deep-merges without packet loss, AMS 2 Pro slots (1–4) + External Spool map to local inventory spools, and completed prints enter the Pending Review Queue.

### Phase 3: Inventory & Manual Stock Control (`03-inventory-and-stock-control/`)
- [ ] **Task 08**: [Spool Brand, Tare Weight Calculator & Quick Gram Adjustments](./03-inventory-and-stock-control/task-08-spool-brand-weight-and-taring.md)
- [ ] **Task 09**: [AMS 2 Pro Visual Slot Cards, Color Match & Low-Stock Alerts](./03-inventory-and-stock-control/task-09-ams-color-and-low-stock-sync.md)

### Checkpoint 3: Non-Bambu Spool Inventory Mastery
- [ ] Users can weigh spools on a scale (auto-subtracting empty spool tare weight), adjust grams with 1 click, and see live remaining weight + low-stock alerts on AMS 2 Pro slots.

### Phase 4: Cost & Pricing Engine (`04-cost-and-pricing-engine/`)
- [ ] **Task 10**: [Unified Backend `CostService` & Configurable Pricing Formula](./04-cost-and-pricing-engine/task-10-unified-backend-cost-service.md)
- [ ] **Task 11**: [Interactive Cost & Quote Calculator UI + Model Library & Printer Linking](./04-cost-and-pricing-engine/task-11-interactive-quote-and-job-builder.md)

### Checkpoint 4: Accurate Business Quoting & Job Accounting
- [ ] Backend `CostService` drives all cost/price calculations; users can generate quotes from `ModelLibrary` items or custom inputs with full cost breakdown.

### Phase 5: Business Dashboard & Unified Settings (`05-business-dashboard-and-settings/`)
- [ ] **Task 12**: [Business KPI Dashboard (Revenue, Cost, Profit, AMS & Pending Prints)](./05-business-dashboard-and-settings/task-12-business-kpi-dashboard.md)
- [ ] **Task 13**: [Unified Tabbed Settings, Local Backup/Export & Privacy Mode Polish](./05-business-dashboard-and-settings/task-13-unified-settings-and-backup.md)

### Checkpoint 5: Phase 1 Complete
- [ ] End-to-end business workflow verified, all TDD tests green, zero lint/type warnings, full Privacy Mode coverage for marketing demos.

---

## Parallelization Opportunities

- **Sequential Foundations**: Tasks `01` -> `02` -> `03` -> `04` must run first to establish the clean, modular codebase and test harness.
- **Parallel Track A (Hardware & MQTT)**: Tasks `05` -> `06` -> `07`
- **Parallel Track B (Inventory & Cost Engine)**: Tasks `08` and `10` can be developed in parallel with Track A once Task `04` is complete.
- **Convergence**: Tasks `09`, `11`, `12`, `13` integrate the hardware slots, inventory enhancements, and cost engine into the final UI.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Non-Bambu spools report `remain: -1` and `tray_weight: "0"` in AMS 2 Pro** | High | Do not rely on Bambu RFID for weight; use our local `PrinterSlotAssignment` to link AMS 2 Pro trays (`0..3`) and external spool (`254`/`255`) to local `Filament` records, tracking exact grams in SQLite. |
| **Bambu P2S sends high-frequency MQTT delta packets (several per second)** | High | Deep-merge deltas in memory under a thread lock (`O(keys)` in microseconds) without touching SQLite on every packet; only write to SQLite when `gcode_state` transitions to `FINISH`. |
| **Print finishes while backend is restarting or user prints multiple plates** | Medium | Deduplicate pending print jobs by `(printer_id, job_id, subtask_id)` and allow manual "Create Pending Print from Current/Last Telemetry" as a fallback. |
| **SQLite schema changes breaking existing local `3d_management.db`** | Medium | Provide Alembic migrations plus safe startup column/table inspection so upgrading an existing local database never loses data. |

---

## Resolved Design Decisions (Confirmed by User)

1. **Two-Way AMS 2 Pro & External Spool Sync via MQTT (`ams_filament_setting`)**:
   - Assigning a local non-Bambu `Filament` spool to an AMS 2 Pro slot (`0..3`) or External Holder (`254`) in the app not only links the spool in SQLite for remaining gram & low-stock tracking, but also publishes the Bambu MQTT `ams_filament_setting` command (`device/{serial}/request`) with the spool's `tray_type`, `tray_color` (`RRGGBBAA`), `nozzle_temp_min`, and `nozzle_temp_max` so the P2S touchscreen and Bambu Studio update automatically.
2. **Pending Completed Prints Auto-Matching**:
   - When a print completes (`RUNNING` -> `FINISH`) and enters the **Pending Completed Prints** review queue, the backend attempts to match `subtask_name` against `Model3D` records in `ModelLibrary` to pre-fill estimated `grams_used`. If no match is found, `grams_used` defaults to `0g` and is visually highlighted for manual entry before clicking **Approve & Deduct Stock**.
3. **Full Business Costing & Pricing Formula**:
   - Unified `CostService` includes: **Filament Cost** + **Electricity Cost** + **Machine Hourly Rate (Depreciation/Maintenance)** + **Failure Rate Buffer %** -> multiplied by **Configurable Markup Multiplier** (default `3.0x`, editable per job) + **Custom Costs** (Packaging, Hardware, Labor).
