# Task 09: AMS 2 Pro Visual Slot Cards, Color Match & Low-Stock Alerts

**Description:**
Build a dedicated, interactive **AMS 2 Pro & External Spool Holder Slot Manager** component (`frontend/src/components/printer/AmsSlotGrid.tsx`) displayed on the `Printer.tsx` detail view (and compactly on `Dashboard.tsx` / `FilamentCard.tsx`):
1. Shows **AMS 2 Pro Unit** telemetry header: Humidity (`humidity_raw`%), Temperature (`temp`°C), and Active Drying state (`dry_time` / `dry_setting` on AMS 2 Pro).
2. Displays **4 AMS 2 Pro Tray Cards (Slots A1–A4)** + **1 External Spool Holder Card**:
   - Highlights the currently active/feeding slot (`tray_now` from P2S telemetry).
   - Shows the P2S-reported `tray_type` and `#tray_color` alongside the **mounted local `Filament` spool** (Brand, Name, Color Swatch, exact `remaining_weight_g` / `initial_weight_g` progress bar, and a **Low Stock Alert badge** if `remaining_weight_g <= low_stock_threshold`).
   - Provides a 1-click **"Assign / Change Spool"** selector dropdown that **auto-sorts local spools matching the slot's `tray_type` and closest hex color** at the top of the list so mounting a non-Bambu spool takes 2 seconds!
3. Shows an `"In AMS Slot A1"` / `"On External Holder"` badge directly on `FilamentCard.tsx` in the Inventory page so you immediately see which spools are currently loaded in the printer.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:**
   - Write frontend unit tests in `frontend/src/test/Printer.test.tsx` verifying:
     - `AmsSlotGrid` renders 4 AMS 2 Pro slots + External Spool slot with P2S humidity (`35%`) and temp (`26.9°C`).
     - When Slot A1 (`slot_index=0`) has a mounted local `Filament` with `remaining_weight_g = 120g` (below `200g` threshold), it renders the spool name, `"120g"`, active feeding indicator (`tray_now === "0"`), and `"Low Stock"` warning badge instead of Bambu's `-1%`.
     - Selecting a spool from the slot assignment dropdown calls `PUT /api/printer/{id}/slots/{slot_index}`.
2. **Green:**
   - Create `frontend/src/components/printer/AmsSlotGrid.tsx` (<200 lines) and wire it into `PrinterStatusViews.tsx` / `Printer.tsx`.
   - Add the `"Loaded in AMS A1"` indicator badge to `FilamentCard.tsx`.
3. **Refactor:** Verify all files pass ESLint (`max-lines: 300`, `max-lines-per-function: 100`, `complexity: 15`) and wrap slot details in `<PrivacyWrapper>`.

**Acceptance Criteria:**
- [ ] AMS 2 Pro Slots A1–A4 and External Spool Holder render both P2S hardware telemetry and the mounted local `Filament` spool's real remaining weight, color swatch, and low-stock warning.
- [ ] The currently active slot (`tray_now`) is visually highlighted during printing.
- [ ] Users can assign or swap any local `Filament` spool into any AMS 2 Pro slot or External Holder directly from the Printer page, with matching material/color spools suggested first.
- [ ] `FilamentCard` in the Inventory page shows a badge when a spool is currently mounted in a printer slot.

**Verification:**
- [ ] Frontend tests pass: `rtk bun run --cwd frontend test -- --run`
- [ ] Frontend lint & build pass: `rtk bun run --cwd frontend lint && rtk bun run --cwd frontend build`
- [ ] Backend tests pass: `rtk uv run --directory backend pytest`

**Dependencies:** Task 06, Task 08

**Files Likely Touched:**
- `frontend/src/components/printer/AmsSlotGrid.tsx` (new)
- `frontend/src/components/printer/PrinterStatusViews.tsx`
- `frontend/src/components/stock/FilamentCard.tsx`
- `frontend/src/test/Printer.test.tsx`

**Estimated Scope:** Medium (4 files)
