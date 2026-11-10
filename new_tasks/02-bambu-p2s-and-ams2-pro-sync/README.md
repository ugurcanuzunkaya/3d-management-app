# Phase 02: Bambu Lab P2S & AMS 2 Pro Sync

## Goal
Make the Bambu Lab P2S + AMS 2 Pro + External Spool Holder integration rock-solid for a workshop using **third-party (non-Bambu) filaments**. This phase fixes the MQTT 5-second packet-drop bug, normalizes P2S-specific telemetry fields (such as chamber temperature under `device.ctc.info.temp` / `info.temp`, AMS 2 Pro active drying status `dry_setting` / `dry_time`, and external spool `vir_slot`), introduces **Virtual Slot Assignment** so non-Bambu spools in AMS 2 Pro Slots 1–4 and the External Holder are linked to local inventory spools, and adds the **Pending Completed Prints Review Queue** when a print transitions to `FINISH`.

## Tasks in This Phase
1. **[Task 05: MQTT Deep-Merge Telemetry, P2S Chamber Temp & Credential Masking](./task-05-mqtt-deep-merge-and-p2s-telemetry.md)**
2. **[Task 06: AMS 2 Pro & External Spool Slot Assignment for Non-Bambu Filaments](./task-06-ams2-pro-and-external-slot-assignment.md)**
3. **[Task 07: Pending Completed Prints Review Queue (`RUNNING` -> `FINISH`)](./task-07-pending-completed-prints-queue.md)**

## Phase 02 Verification Checkpoint
- [ ] All backend (`pytest`, `ruff`, `ty`) and frontend (`vitest`, `eslint`, `tsc`, `vite build`) checks pass
- [ ] Rapid delta MQTT messages (<100ms apart) merge completely without dropping `pushall` or state transitions
- [ ] P2S telemetry (`backend/printer_data_dump.json`) reports chamber temperature (`31°C`), AMS 2 Pro humidity (`35%`), temperature (`26.9°C`), active slot (`tray_now: "0"`), 4 AMS trays, and external `vir_slot`
- [ ] Assigning a local `Filament` spool to AMS Slot 1–4 or External Holder persists in SQLite and enriches the printer status API
- [ ] When a print transitions from `RUNNING` to `FINISH`, a `PrintJob` with `status="pending"` is created and surfaced in the Pending Completed Prints review queue
