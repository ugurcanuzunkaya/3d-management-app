# Phase 01: Foundation, Tooling Gates & Architecture Wiring

## Goal
Establish a 100% clean, zero-warning engineering baseline across both Backend (Python/FastAPI/SQLModel) and Frontend (React/TypeScript/Vite/Bun) before adding new Phase 1 features. This phase fixes the broken `PUT` vs `PATCH` filament edit endpoint, fixes the printer poll URL, resolves the Tailwind v3/v4 CSS variable conflict, removes all `# type: ignore` and `eslint-disable` suppressions, wires the unused `src/hooks/*` and `src/api/*` modules into the pages, and decomposes oversized components so every file adheres to the 300-line / 100-line-per-function / complexity-15 rules.

## Tasks in This Phase
1. **[Task 01: Backend Tooling, Config Unification & DB Lifecycle](./task-01-backend-tooling-and-db-init.md)**
2. **[Task 02: Frontend ESLint Rules, Zero Suppressions & Tailwind Theme Fix](./task-02-frontend-lint-and-css-theme.md)**
3. **[Task 03: Wire Frontend API & React Query Hooks (Fix Filament 405 & Printer Poll)](./task-03-wire-modular-hooks-and-apis.md)**
4. **[Task 04: Decompose Oversized Pages (`Printer.tsx`, `Jobs.tsx`, `StockSettings.tsx`)](./task-04-decompose-oversized-pages.md)**

## Phase 01 Verification Checkpoint
- [ ] `rtk uv run --directory backend ruff check .` -> 0 errors
- [ ] `rtk uv run --directory backend ty check` -> 0 errors, 0 `# type: ignore`
- [ ] `rtk uv run --directory backend pytest` -> passes directly
- [ ] `rtk bun run --cwd frontend lint` -> 0 errors, 0 warnings
- [ ] `rtk bun run --cwd frontend tsc --noEmit` -> 0 errors
- [ ] `rtk bun run --cwd frontend build` -> 0 LightningCSS warnings, chunks <500 kB
- [ ] `rtk bun run --cwd frontend test -- --run` -> all tests pass
