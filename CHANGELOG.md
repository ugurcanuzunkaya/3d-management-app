# 📋 CHANGELOG

All notable changes to this project are documented in this file.

---

## [2026-05-20]

### 🚀 Added
- **Overwhelming Privacy Mode (UI)**: Expanded the visibility masking framework to dynamically mask the application logo, navigation link labels, and page titles across the app.
- **Granular Job Log Table Privacy Settings (UI)**: Added individual toggles for masking Date, Type, Filaments, and Duration in the print jobs log history table.
- **Interactive Privacy Dual-Listbox Configurator**: Designed a premium, dual-column transfer list interface (`Masked Fields (Selected)` vs `Shown Fields (Unselected)`) with batch and single transfer actions, replacing checkboxes on the Settings page.
- **Custom Shimmer Page Skeletons**: Built tailored, layout-aware skeleton screen components for all pages (Dashboard, Printer, Filament Stock, Model Library, Jobs, and Settings) replacing generic spinners during asynchronous data fetch operations.
- **Multi-Printer Registry (Backend)**: Added database schema (`Printer` model), alembic migrations, and REST endpoints under `/api/printers` for dynamic CRUD operations on printers.
- **Asynchronous MQTT Registry Service**: Implemented `BambuMQTTService` registry class in backend to manage individual MQTT client connections dynamically, including startup polling and shutdown hooks.
- **Offline Health Check**: Implemented connection health validation that flags printers as `OFFLINE` if no telemetry data has been received within the configured timeout (10/15 seconds).
- **Master-Detail Fleet Management UI**: Introduced a multi-printer grid page under the Printers tab. Left panel displays fleet summary cards with state-aware HSL glow borders; right panel displays selected printer telemetry in detail.
- **Sliding Telemetry Carousel**: Designed a custom-themed sliding carousel widget on the main dashboard for quick navigation and monitoring of all registered printers.
- **Credentials Visibility Toggle**: Added an Eye/EyeOff toggle to hide/show sensitive details (IP address and Serial Numbers) across all views (cards, headers, status messages).
- **Automatic Database Migrations**: Configured the backend Docker container to run `alembic upgrade head` automatically on container start.

### 🔧 Fixed & Improved
- **Printers Tab Redundancy Cleanup**: De-duplicated the local "Show/Hide Info" button on the Printers tab to centralize state control via the global navigation header control.
- **State Selection Stability**: Refactored frontend pages to derive selected printer ID dynamically from the URL/Query state instead of using separate side-effecting `useEffect` blocks, eliminating infinite loops and race conditions.
- **Unified Status Parsing**: Synchronized status mapping across dashboard and fleet tabs to recognize and format `gcode_state` statuses (Online, Offline, Working, Idle, Stopped) correctly.

### 🧪 Tests
- **Multi-Printer Integration Tests**: Wrote comprehensive pytest test suite validating backend CRUD, service registry, connection lifecycle hooks, and mock MQTT message processing.
- **TDD Offline Tests**: Wrote automated tests verifying offline timeout transitions and flag injection logic.

---

## [2026-05-17]

### 🚀 Added
- **3D Model Library & Scanner**: Added model library CRUD view displaying card grids styled with MakerWorld (emerald-glow) and Printables (orange-glow) themes.
- **AI Slicing Spec Scanner**: Implemented Multi-Provider AI vision and link scraping scan engine. Automatically extracts estimated weight, print time, bed/nozzle temperatures, and physical dimensions using Gemini, Claude, OpenAI, local Ollama (`qwen3.5`, `gemma4`), or Playwright/Firecrawl scraper fallbacks.
- **Inline Creating on Forms**: Added support for inline custom type and color definition directly inside the filament creation modal.
- **Enhanced Stock Summary**: Implemented warehouse stock tracking showing total weight, inventory value, and low stock alarms.
- **Obsidian Black Status Monitors**: Crafted dark-themed telemetry widgets for nozzle/bed temperature, speed multipliers, and AMS humidity metrics.

### 🔧 Fixed & Improved
- **FastAPI Routing Alignment**: Resolved 422 routing issues by placing static endpoints before dynamic parameter routes in backend routers.
- **Filament Stock Styling**: Enhanced filament card layouts to adjust color brightness and prevent text dimming on grey/dark swatch card hover.
- **Print Job Deletion Actions**: Implemented "Delete All" and individual print job delete actions in backend and frontend.

---

## [2026-05-16]

### 🔧 Fixed & Improved
- **SQLModel Warnings**: Fixed database relationship warnings in backend models and updated corresponding test suites.

---

## [2026-05-15]

### 🚀 Added
- **Core Filament Stock Components**: Developed reusable stock management lists, forms, and statistics wrappers.

### 🔧 Fixed & Improved
- **Offline Detection Logic**: Improved timeout calculations for active MQTT printer terminal feedback.
- **Version Control Exclusions**: Cleaned up the repository by adding json data dumps to `.gitignore` and removing old cache records.

---

## [2026-04-30]

### 🚀 Added
- **Initial 3D Printing System**: Created database schemas and frontend UI for filaments, print jobs, and parameters.
- **Documentation**: Drafted initial main README with manual installation guidelines.

---

## [2026-04-27]

### 🚀 Added
- **Initial Commit**: Setup base React + FastAPI project structure.
