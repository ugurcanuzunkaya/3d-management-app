# Task 03: Wire Frontend API & React Query Hooks (Fix Filament 405 & Printer Poll)

**Description:**
Wire the existing modular API clients (`src/api/{filaments,jobs,models,printer,settings}.ts`), query key factory (`src/lib/query-keys.ts`), and custom React Query hooks (`src/hooks/use-{filaments,jobs,models,printer,settings}.ts`) into the application pages. Fix the broken filament edit bug (`api.put` 405 Method Not Allowed in `FilamentStock.tsx` -> `filamentsApi.update` using `api.patch`) and fix `printerApi.poll(printerId)` to target `/api/printer/${printerId}/poll`.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write a frontend unit test (`frontend/src/test/FilamentStock.test.tsx`) testing filament creation (`POST /api/filaments`) and filament editing (`PATCH /api/filaments/:id`), proving that `FilamentStock.tsx` currently fails by calling `PUT` instead of `PATCH`.
   - Write a unit test in `PrinterStatusWidget.test.tsx` or `Printer.test.tsx` verifying `printerApi.poll(1)` calls `POST /api/printer/1/poll`.
2. **Green:**
   - Update `src/api/printer.ts` to support multi-printer endpoints (`list`, `create`, `update`, `delete`, `getStatus(id)`, `getAllStatuses()`, `poll(id)`).
   - Update `src/hooks/use-printer.ts` and `src/hooks/use-filaments.ts` to support pagination/filtering and multi-printer queries.
   - Wire `useFilaments`, `useFilamentTypes`, `useColors`, `useSeries`, `useSettings`, `useStockSettings`, `useJobs`, `useModels`, and `usePrinter` into `Dashboard.tsx`, `FilamentStock.tsx`, `ModelLibrary.tsx`, and `Settings.tsx`.
3. **Refactor:** Ensure query cache invalidation uses `queryKeys` consistently across all mutations.

**Acceptance Criteria:**
- [ ] Editing a filament in `FilamentStock.tsx` sends `PATCH /api/filaments/{id}` via `useUpdateFilament` / `filamentsApi.update` and succeeds with HTTP 200.
- [ ] `printerApi.poll(printerId)` sends `POST /api/printer/{printerId}/poll`.
- [ ] `src/lib/query-keys.ts`, `src/api/*`, and `src/hooks/*` are actively used by the pages with zero dead exports.

**Verification:**
- [ ] Tests pass: `rtk bun run --cwd frontend test -- --run`
- [ ] Lint passes: `rtk bun run --cwd frontend lint`
- [ ] Build succeeds: `rtk bun run --cwd frontend build`

**Dependencies:** Task 01, Task 02

**Files Likely Touched:**
- `frontend/src/api/printer.ts`
- `frontend/src/api/filaments.ts`
- `frontend/src/hooks/use-printer.ts`
- `frontend/src/hooks/use-filaments.ts`
- `frontend/src/pages/FilamentStock.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/ModelLibrary.tsx`
- `frontend/src/pages/Settings.tsx`
- `frontend/src/test/FilamentStock.test.tsx`

**Estimated Scope:** Medium (5–8 files)
