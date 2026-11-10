# Phase 03: Inventory & Manual Stock Control for Third-Party Filaments

## Goal
Because non-Bambu spools in the AMS 2 Pro and External Spool Holder do not report remaining weight via RFID, manual stock control must be fast, accurate, and integrated with the printer UI. This phase adds `brand`, `initial_weight_g`, and `empty_spool_weight_g` (tare weight) to `Filament` spools, provides a **Kitchen Scale Tare Calculator** (enter total weight on scale -> subtracts empty spool weight automatically) and **Quick `-10g / -50g / +50g` Adjustment** buttons on spool cards, and builds the interactive **AMS 2 Pro + External Holder Slot UI** showing local spool colors, exact remaining grams, low-stock warnings, and 1-click slot mounting.

## Tasks in This Phase
1. **[Task 08: Spool Brand, Tare Weight Calculator & Quick Gram Adjustments](./task-08-spool-brand-weight-and-taring.md)**
2. **[Task 09: AMS 2 Pro Visual Slot Cards, Color Match & Low-Stock Alerts](./task-09-ams-color-and-low-stock-sync.md)**

## Phase 03 Verification Checkpoint
- [ ] All backend (`pytest`, `ruff`, `ty`) and frontend (`vitest`, `eslint`, `tsc`, `vite build`) checks pass
- [ ] `Filament` supports `brand`, `initial_weight_g`, and `empty_spool_weight_g`
- [ ] Weighing a spool on a scale (e.g., gross weight `680g` minus empty spool tare `200g`) sets `remaining_weight_g = 480g`
- [ ] Quick `-10g / -50g / +50g` buttons on `FilamentCard` adjust weight in 1 click without opening the full edit modal
- [ ] AMS 2 Pro Slots 1–4 and External Spool Holder UI display the mounted local `Filament` spool's brand, color swatch, remaining grams/percentage, and low-stock alert badge
