# Task 01: Backend Tooling, Config Unification & DB Lifecycle

**Description:**
Fix the backend test runner configuration (`pythonpath = ["."]`), unify `database.py` with `app.config.get_settings().database_url`, ensure `init_db()` runs safely in `main.py` `lifespan` so fresh local SQLite databases never crash with missing tables, isolate `test_integration.py` and `test_privacy_presets.py` from mutating the local `3d_management.db`, remove all `# type: ignore` comments in `main.py` and `routers/printer.py`, update the default Gemini model in `ai_service.py` to `gemini-3.8-flash`, and clean up root-level ad-hoc test files.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:** Add tests in `backend/tests/test_tdd_fixes.py` verifying:
   - `database.py` uses `get_settings().database_url`.
   - `lifespan` initializes database tables on a fresh in-memory SQLite engine before querying `Printer`.
   - `AIService` defaults to `gemini-3.8-flash`.
   - `test_integration.py` and `test_privacy_presets.py` use an isolated in-memory SQLite `Session` override.
2. **Green:** Update `pyproject.toml`, `database.py`, `main.py`, `routers/printer.py`, `ai_service.py`, and test fixtures.
3. **Refactor:** Remove root-level duplicate scripts (`test_costs.py`, `test_automated_costs.py`, `test_mqtt_logic.py`, `backend/__init__.py`) after ensuring all assertions exist in `backend/tests/`.

**Acceptance Criteria:**
- [ ] Running `rtk uv run --directory backend pytest` works directly without `ModuleNotFoundError: No module named 'app'`.
- [ ] Zero `# type: ignore` comments remain in `backend/app/main.py` and `backend/app/routers/printer.py` (replaced with explicit `if printer.id is not None` guards).
- [ ] `backend/app/services/ai_service.py` uses `"gemini-3.8-flash"` for Gemini text and vision extraction.
- [ ] `test_integration.py` and `test_privacy_presets.py` run against an isolated in-memory SQLite database instead of `3d_management.db`.

**Verification:**
- [ ] Tests pass: `rtk uv run --directory backend pytest`
- [ ] Lint passes: `rtk uv run --directory backend ruff check .`
- [ ] Format passes: `rtk uv run --directory backend ruff format --check .`
- [ ] Type check passes: `rtk uv run --directory backend ty check`

**Dependencies:** None

**Files Likely Touched:**
- `backend/pyproject.toml`
- `backend/app/database.py`
- `backend/app/main.py`
- `backend/app/routers/printer.py`
- `backend/app/services/ai_service.py`
- `backend/tests/test_integration.py`
- `backend/tests/test_privacy_presets.py`

**Estimated Scope:** Small (4–6 files)
