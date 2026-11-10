# Task 02: Frontend ESLint Rules, Zero Suppressions & Tailwind Theme Fix

**Description:**
Add the required complexity and maintainability rules (`max-lines: 300`, `max-lines-per-function: 100`, `complexity: 15`) to `frontend/eslint.config.js`, fix the 3 unused-variable lint errors in `PrinterStatusWidget.test.tsx`, remove the `eslint-disable` comments in `ModelFormModal.tsx` and `PrivacyContext.tsx` by solving their underlying hook/export structure, fix the Tailwind v3 vs v4 CSS variable conflict in `frontend/src/index.css` (converting `oklch(...)` variables to valid HSL channels expected by `tailwind.config.ts` and removing the broken `@import "tw-animate-css"` / `@import "shadcn/tailwind.css"` imports), and add route lazy-loading in `App.tsx` to eliminate the >500 kB chunk warning.

**TDD Workflow (Red -> Green -> Refactor):**
1. **Red:** Add complexity/maintainability rules to `frontend/eslint.config.js` and run `rtk bun run --cwd frontend lint` to surface all lint errors and warnings. Write a test in `App.test.tsx` verifying lazy-loaded routes render properly.
2. **Green:**
   - Fix `PrinterStatusWidget.test.tsx` unused variables (`waitFor`, `spyGet`).
   - Extract `usePrivacy` hook or context types so `PrivacyContext.tsx` needs no `react-refresh/only-export-components` suppression.
   - Refactor `ModelFormModal.tsx` state initialization (using `key` prop reset or derived state) to eliminate `/* eslint-disable react-hooks/set-state-in-effect */`.
   - Fix `frontend/src/index.css` to use valid HSL triplets matching `tailwind.config.ts` (`hsl(var(--background))`) and remove unused `shadcn` / `tw-animate-css` runtime dependencies from `package.json`.
   - Split `Skeleton.tsx` (308 lines) or trim redundant lines so it stays under 300 lines, and use `React.lazy` + `Suspense` in `App.tsx`.
3. **Refactor:** Verify `bun run build` produces 0 LightningCSS warnings and 0 chunk size warnings.

**Acceptance Criteria:**
- [ ] `frontend/eslint.config.js` includes `'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }]`, `'max-lines-per-function': ['warn', { max: 100, skipBlankLines: true, skipComments: true }]`, and `'complexity': ['warn', 15]`.
- [ ] Zero `eslint-disable` comments exist anywhere in `frontend/src/`.
- [ ] `rtk bun run --cwd frontend build` completes with zero `[lightningcss minify] Unknown at rule` warnings and zero >500 kB chunk warnings.

**Verification:**
- [ ] Tests pass: `rtk bun run --cwd frontend test -- --run`
- [ ] Type check passes: `rtk bun run --cwd frontend tsc --noEmit`
- [ ] Build succeeds: `rtk bun run --cwd frontend build`

**Dependencies:** None

**Files Likely Touched:**
- `frontend/eslint.config.js`
- `frontend/package.json`
- `frontend/src/index.css`
- `frontend/src/App.tsx`
- `frontend/src/context/PrivacyContext.tsx`
- `frontend/src/components/models/ModelFormModal.tsx`
- `frontend/src/test/PrinterStatusWidget.test.tsx`

**Estimated Scope:** Medium (5–7 files)
