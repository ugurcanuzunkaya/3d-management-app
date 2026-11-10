# Task 05: MQTT Deep-Merge Telemetry, P2S Chamber Temp & Credential Masking

**Description:**
Fix `BambuMQTTService` (`backend/app/services/mqtt_service.py`) so that it subscribes specifically to `device/{serial}/report`, never drops incoming delta messages arriving within 5 seconds, and recursively deep-merges nested dictionaries (such as `3D`, `ams`, `device`, `ipcam`, `lights_report`) under a thread lock. Normalize Bambu Lab P2S telemetry fields so `chamber_temper` automatically falls back to `device.ctc.info.temp` or `info.temp` (which is `31°C` in the real P2S payload in `backend/printer_data_dump.json`), and extract structured AMS 2 Pro trays (`ams.ams[0].tray`), drying state (`dry_setting`, `dry_time`), active tray (`tray_now`), and external spool (`vir_slot` / `vt_tray`). Finally, mask or omit plaintext `access_code` from `GET /api/printer` responses (`PrinterRead` schema) so LAN access codes are never persisted into browser `localStorage`.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write unit tests in `backend/tests/test_multi_printer.py`:
     - Simulate two MQTT `on_message` calls 100ms apart (first with `{"print": {"bed_temper": 55.0}}`, second with the full P2S payload from `printer_data_dump.json`). Assert that both fields are preserved (proving the 5s drop bug fails).
     - Assert that `get_status()` returns `chamber_temper == 31` when `device.ctc.info.temp == 31` (P2S format) even if top-level `chamber_temper` is absent.
     - Assert that `GET /api/printer` does not expose plaintext `access_code` in the JSON response (or returns masked `"********"`), while `PUT /api/printer/{id}` preserves the existing `access_code` in DB if `access_code` is omitted or masked.
2. **Green:**
   - Implement recursive dict deep-merging in `PrinterConnection.on_message` protected by `threading.Lock()`.
   - Subscribe to `f"device/{self.serial}/report"` in `on_connect`.
   - Normalize `chamber_temper`, `layer_num` (fallback to `3D.layer_num`), `total_layer_num` (fallback to `3D.total_layer_num`), and parsed AMS 2 Pro + `vir_slot` summary in `get_status()`.
   - Add `PrinterRead` / `PrinterCreate` / `PrinterUpdate` schemas in `backend/app/schemas/printer.py` and use them in `backend/app/routers/printer.py`.
3. **Refactor:** Clean up logging in `mqtt_service.py` to use structured key-value messages.

**Acceptance Criteria:**
- [ ] Rapid MQTT delta messages (<5s apart) are deep-merged without data loss.
- [ ] P2S chamber temperature (`device.ctc.info.temp` / `info.temp`) and `3D.layer_num` / `3D.total_layer_num` are normalized into `get_status()`.
- [ ] `GET /api/printer` masks `access_code` so plaintext credentials are not stored in `localStorage`.
- [ ] Updating a printer without re-typing the masked `access_code` keeps the existing `access_code` in SQLite.

**Verification:**
- [ ] Tests pass: `rtk uv run --directory backend pytest`
- [ ] Type & lint checks pass: `rtk uv run --directory backend ruff check .` and `rtk uv run --directory backend ty check`
- [ ] Frontend tests pass: `rtk bun run --cwd frontend test -- --run`

**Dependencies:** Task 01, Task 04

**Files Likely Touched:**
- `backend/app/services/mqtt_service.py`
- `backend/app/schemas/printer.py` (new)
- `backend/app/routers/printer.py`
- `backend/tests/test_multi_printer.py`

**Estimated Scope:** Medium (4 files)
