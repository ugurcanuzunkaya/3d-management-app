# Task 12: Business KPI Dashboard (Revenue, Cost, Profit, AMS & Pending Prints)

**Description:**
Transform `Dashboard.tsx` from a minimal two-card placeholder into a complete **3D Business Command Center**:
1. **Top KPI Summary Row (`DashboardKpiCards.tsx`)**:
   - **Total Revenue** (sum of `total_cost` across completed jobs)
   - **Total Production Cost** (sum of `production_cost` + total inventory asset value)
   - **Net Profit & Margin %** (`Revenue - Production Cost` and profit margin percentage)
   - **Workshop Output** (Total Completed Prints count, Total Print Hours, Total Filament Grams Consumed, and Pending Completed Prints badge)
2. **Middle Workshop Operations Grid**:
   - **Live Printer & AMS 2 Pro Widget** (`PrinterStatusWidget.tsx` + compact AMS 2 Pro & External Spool slot indicators showing loaded local spools).
   - **Low-Stock & Action Alerts Card** (`DashboardAlertsCard.tsx`): Lists any pending completed prints waiting for approval and any local filament spools at or below `low_stock_threshold` (highlighting spools currently mounted in AMS 2 Pro!).
3. **Bottom Recent Print Jobs Table**:
   - Shows the 5 most recent print jobs with quick link to `/jobs`.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write frontend unit tests in `frontend/src/test/Dashboard.test.tsx` verifying:
     - Financial KPIs (Total Revenue, Production Cost, Net Profit, Margin %) render accurately from mocked jobs and filaments.
     - Low-stock spools (where `remaining_weight_g <= low_stock_threshold`) and Pending Completed Prints (`status === "pending"`) appear in the Action Alerts section.
     - All financial and KPI figures are wrapped in `<PrivacyWrapper>` so enabling Privacy Mode blurs them.
2. **Green:**
   - Create `frontend/src/components/dashboard/DashboardKpiCards.tsx` and `frontend/src/components/dashboard/DashboardAlertsCard.tsx`.
   - Update `frontend/src/pages/Dashboard.tsx` to compose these widgets cleanly.
3. **Refactor:** Verify `Dashboard.tsx` and all dashboard sub-components stay under 300 lines and 100 lines per function.

**Acceptance Criteria:**
- [ ] Dashboard displays Total Revenue, Total Production Cost, Net Profit, Margin %, Total Print Hours, and Total Grams Printed.
- [ ] Dashboard surfaces Pending Completed Prints waiting for review and Low-Stock filament spools.
- [ ] All KPI values and sensitive labels are wrapped in `<PrivacyWrapper>` for marketing/demo screen sharing.
- [ ] `Dashboard.tsx` and its sub-components pass all ESLint complexity and line limits.

**Verification:**
- [ ] Frontend tests pass: `rtk bun run --cwd frontend test -- --run`
- [ ] Frontend lint & build pass: `rtk bun run --cwd frontend lint && rtk bun run --cwd frontend build`

**Dependencies:** Task 09, Task 11

**Files Likely Touched:**
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/components/dashboard/DashboardKpiCards.tsx` (new)
- `frontend/src/components/dashboard/DashboardAlertsCard.tsx` (new)
- `frontend/src/test/Dashboard.test.tsx` (new)

**Estimated Scope:** Medium (4 files)
