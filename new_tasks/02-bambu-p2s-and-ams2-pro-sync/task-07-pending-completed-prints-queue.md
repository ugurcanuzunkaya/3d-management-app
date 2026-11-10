# Task 07: Pending Completed Prints Review Queue (`RUNNING` -> `FINISH`)

**Description:**
Implement the **Pending Completed Prints** workflow requested by the user: when the Bambu Lab P2S transitions from `RUNNING` (or `PAUSE`) to `FINISH` (or when the user clicks "Send to Pending Jobs" on an active/finished print), automatically create a `PrintJob` record with `status = "pending"`, capturing:
- `printer_id` and Bambu `external_job_id` (`job_id` / `subtask_id` to prevent duplicates)
- `name` (from `subtask_name` or `gcode_file`)
- `duration_minutes` (elapsed print time or estimated time)
- Pre-linked `JobFilament` rows using the local `Filament` spool(s) currently mounted in the active AMS 2 Pro slot (`tray_now` / `mapping`) or External Holder.

Crucially, **a `pending` job does NOT deduct filament weight from inventory until the user reviews, edits (grams used, custom costs, final price), and approves it** (`POST /api/jobs/{job_id}/approve` or updating status from `"pending"` to `"completed"`).

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write backend tests in `backend/tests/test_pending_jobs.py`:
     - Verify creating a job with `status="pending"` does **not** subtract `grams_used` from `Filament.remaining_weight_g`.
     - Verify approving a pending job (`POST /api/jobs/{id}/approve` with edited `grams_used=65.0` and `total_cost=150.0`) transitions `status` to `"completed"`, deducts `65.0g` from `Filament.remaining_weight_g`, and recalculates costs.
     - Verify simulating an MQTT transition on Printer 1 from `gcode_state="RUNNING"` (with `subtask_id="952420398"`, `subtask_name="0.2mm layer, 2 walls"`, `tray_now="0"`, where AMS Slot 0 has `Filament(id=1)` assigned) to `gcode_state="FINISH"` automatically creates 1 pending `PrintJob` pre-linked to `Filament(id=1)` and does not duplicate it on subsequent `"FINISH"` polls.
2. **Green:**
   - Add `status: str = Field(default="completed")` (`"pending"` | `"completed"`), `printer_id: Optional[int]`, and `external_job_id: Optional[str]` to `PrintJob` in `backend/app/models/job.py` and `backend/app/schemas/job.py`.
   - Update `JobService` (`backend/app/services/job_service.py`) so stock deduction only occurs when `status == "completed"`, and add `JobService.approve_pending_job()` + `JobService.create_pending_job_from_mqtt()`.
   - Hook state transition detection (`RUNNING` -> `FINISH`) in `BambuMQTTService` to invoke `create_pending_job_from_mqtt`.
   - Add a **Pending Completed Prints** banner and review modal in `frontend/src/pages/Jobs.tsx` (and `src/components/jobs/PendingJobsBanner.tsx`) allowing the user to check/edit grams, filaments, and final price before confirming or dismissing.
3. **Refactor:** Keep all job components under 300 lines and wrap pending job financial fields in `<PrivacyWrapper>`.

**Acceptance Criteria:**
- [ ] `PrintJob` supports `status: "pending" | "completed"`, `printer_id`, and `external_job_id`.
- [ ] Pending jobs do not deduct filament stock until approved; dismissing/deleting a pending job leaves filament stock untouched.
- [ ] When a Bambu printer transitions from `RUNNING` to `FINISH`, a deduplicated `pending` job is created with the active AMS/External slot's assigned `Filament` pre-selected.
- [ ] **Smart Gram Pre-Fill**: If `subtask_name` matches a `Model3D` in `ModelLibrary`, `grams_used` and `model_id` are automatically pre-populated from that model's `weight_g`; otherwise `grams_used` defaults to `0g` and is highlighted in the UI for manual entry before approval.
- [ ] Users can review, edit grams/price, and approve pending prints in the UI, which transitions them to `"completed"` and deducts filament stock.

**Verification:**
- [ ] Backend tests pass: `rtk uv run --directory backend pytest`
- [ ] Backend lint & types pass: `rtk uv run --directory backend ruff check .` and `rtk uv run --directory backend ty check`
- [ ] Frontend tests, lint & build pass: `rtk bun run --cwd frontend lint && rtk bun run --cwd frontend test -- --run && rtk bun run --cwd frontend build`

**Dependencies:** Task 04, Task 06

**Files Likely Touched:**
- `backend/app/models/job.py`
- `backend/app/schemas/job.py`
- `backend/app/services/job_service.py`
- `backend/app/routers/jobs.py`
- `backend/app/services/mqtt_service.py`
- `backend/tests/test_pending_jobs.py` (new)
- `frontend/src/types/job.ts`
- `frontend/src/components/jobs/PendingJobsBanner.tsx` (new)
- `frontend/src/pages/Jobs.tsx`

**Estimated Scope:** Medium (6–8 files)
