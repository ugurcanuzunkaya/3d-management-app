# Task 06: AMS 2 Pro & External Spool Slot Assignment for Non-Bambu Filaments

**Description:**
Because third-party filaments do not have Bambu RFID tags (`remain: -1`, `tray_weight: "0"` in AMS 2 Pro), create a **Virtual Spool Slot Assignment** system that maps physical printer slots—**AMS 2 Pro Slots 1–4** (`slot_index: 0..3`, `slot_type: "ams"`) and **External Spool Holder** (`slot_index: 254`, `slot_type: "external"`)—to local `Filament` spools in the database. Expose REST endpoints (`GET /api/printer/{printer_id}/slots`, `PUT /api/printer/{printer_id}/slots/{slot_index}`) so the user can mount/unmount any local `Filament` spool into an AMS 2 Pro slot or External Holder, and automatically enrich `GET /api/printer/{printer_id}/status` with the mounted spool's details (name, brand, exact `remaining_weight_g`, color hex, filament type, and low-stock status).

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write backend tests in `backend/tests/test_printer_slots.py`:
     - Assign `Filament(id=1, name="eSUN PLA+ Grey", remaining_weight_g=420.0)` to `printer_id=1, slot_index=0` (AMS Slot 1) and `Filament(id=2, name="Polymaker PETG Black", remaining_weight_g=850.0)` to `printer_id=1, slot_index=254` (External Holder).
     - Assert that mounting the same `Filament` spool to a different slot automatically unmounts it from its previous slot (a physical spool cannot be in two slots at once!).
     - Assert that `GET /api/printer/1/slots` merges live P2S AMS tray telemetry (`tray_type`, `tray_color`, `nozzle_temp_min`, `nozzle_temp_max`, `is_active_tray` from `tray_now == "0"`) with the assigned local `Filament` record.
2. **Green:**
   - Create `PrinterSlotAssignment` model in `backend/app/models/printer.py` (or `printer_slot.py`) and Alembic migration.
   - Implement slot assignment endpoints and service logic in `backend/app/routers/printer.py`.
   - Add frontend API methods (`printerApi.getSlots`, `printerApi.assignSlot`) and hooks (`usePrinterSlots`, `useAssignPrinterSlot`) in `frontend/src/api/printer.ts` and `frontend/src/hooks/use-printer.ts`.
3. **Refactor:** Ensure clean foreign-key handling when a `Filament` or `Printer` is deleted (`ON DELETE SET NULL` / cascade cleanup).

**Acceptance Criteria:**
- [ ] Each printer supports 4 AMS 2 Pro slots (`0, 1, 2, 3`) and 1 External Spool Holder slot (`254`).
- [ ] Assigning a local `Filament` spool to a slot links it in SQLite, automatically unmounting that spool if it was previously mounted in another slot.
- [ ] **Two-Way MQTT Sync**: Assigning a local `Filament` spool to a slot publishes the Bambu MQTT `ams_filament_setting` command (`ams_id: 0` or `255`, `tray_id: slot_index`, `tray_type`, `tray_color` as 8-char `RRGGBBFF`, `nozzle_temp_min`, `nozzle_temp_max`) to `device/{serial}/request` so the Bambu Lab P2S and Bambu Studio automatically receive the filament color, type, and temperature range.
- [ ] Deleting a `Filament` spool cleanly clears its slot assignment without foreign key errors.
- [ ] Slot status merges live Bambu P2S telemetry (`tray_type`, `tray_color`, `tray_now` active indicator, AMS 2 Pro `temp`, `humidity_raw`, `dry_setting`) with local `Filament` data (`id`, `name`, `remaining_weight_g`, `color.hex_code`, `filament_type.name`).

**Verification:**
- [ ] Tests pass: `rtk uv run --directory backend pytest`
- [ ] Type & lint checks pass: `rtk uv run --directory backend ruff check .` and `rtk uv run --directory backend ty check`
- [ ] Frontend build & tests pass: `rtk bun run --cwd frontend test -- --run`

**Dependencies:** Task 05

**Files Likely Touched:**
- `backend/app/models/printer.py`
- `backend/app/schemas/printer.py`
- `backend/app/routers/printer.py`
- `backend/alembic/versions/..._add_printer_slot_assignments.py`
- `backend/tests/test_printer_slots.py` (new)
- `frontend/src/types/printer.ts`
- `frontend/src/api/printer.ts`
- `frontend/src/hooks/use-printer.ts`

**Estimated Scope:** Medium (5–7 files)
