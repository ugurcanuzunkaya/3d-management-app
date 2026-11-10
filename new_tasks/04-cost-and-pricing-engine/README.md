# Phase 04: Cost & Pricing Engine

## Goal
Turn the disconnected `CostService` and basic `Jobs` form into a complete **3D Printing Business Costing, Quoting & Job Accounting Engine**. This phase connects `CostService` to the backend settings and job creation/update pipelines, adds configurable pricing parameters (`markup_multiplier`, `machine_hourly_rate`, `failure_rate_pct`, `currency`, and `custom_costs` for packaging/hardware/labor), and builds an interactive **Cost & Quote Calculator** in the frontend that can pre-fill parameters directly from `ModelLibrary` items or Pending Completed Prints.

## Tasks in This Phase
1. **[Task 10: Unified Backend `CostService` & Configurable Pricing Formula](./task-10-unified-backend-cost-service.md)**
2. **[Task 11: Interactive Cost & Quote Calculator UI + Model Library & Printer Linking](./task-11-interactive-quote-and-job-builder.md)**

## Phase 04 Verification Checkpoint
- [ ] All backend (`pytest`, `ruff`, `ty`) and frontend (`vitest`, `eslint`, `tsc`, `vite build`) checks pass
- [ ] `POST /api/jobs/calculate-cost` and `JobService` use `CostService` with settings-driven `markup_multiplier`, `machine_hourly_rate`, and `failure_rate_pct`
- [ ] Editing a job's filament weights or duration accurately recalculates `production_cost` and suggested `total_cost`
- [ ] Users can click `"Create Quote / Job"` on any `Model3D` card in `ModelLibrary` to open `Jobs` pre-populated with that model's weight, duration, and `model_id`
