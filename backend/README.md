# 🐍 3D Management Backend

The backend engine for the 3D Management App, built with FastAPI and SQLModel. It handles data persistence, MQTT communication with Bambu Lab printers, and AI spec extraction.

## 🛠 Tech Stack

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **ORM**: [SQLModel](https://sqlmodel.tiangolo.com/) (Pydantic + SQLAlchemy)
- **Database**: PostgreSQL (Production) / SQLite (Local/Testing)
- **Task Runner**: [uv](https://github.com/astral-sh/uv)
- **Validation**: [Pydantic v2](https://docs.pydantic.dev/)

## 🚀 Getting Started

### Prerequisites

- Python 3.13
- [uv](https://github.com/astral-sh/uv) installed (`pip install uv`)

### Local Installation

1. **Sync Dependencies**:

    ```bash
    uv sync
    ```

2. **Environment Variables**:
    Create a `.env` file in this directory (or root):

    ```env
    DATABASE_URL=postgresql://admin:password@localhost:5432/3d_management
    # For local SQLite:
    # DATABASE_URL=sqlite:///./test.db
    ```

3. **Run Development Server**:

    ```bash
    uv run uvicorn app.main:app --reload --port 8001
    ```

4. **Database Migrations & Seeding**:
    We use Alembic for database migrations. To create the database schema, run:

    ```bash
    uv run alembic upgrade head
    ```

    After the schema is created, populate the database with initial seed data:

    ```bash
    uv run python -m app.seed
    ```

## 📡 API Endpoints

- **Filaments**: `GET`, `POST`, `PUT`, `DELETE` on `/api/filaments`
- **Types & Colors**: `/api/filament-types`, `/api/filament-colors`
- **Printers**: `GET`, `POST`, `PUT`, `DELETE` on `/api/printers` (Multi-machine registry) and `GET /api/printers/status` (Consolidated real-time state engine)
- **Print Jobs**: `/api/printjobs`
- **Settings**: `/api/stock-settings`, `/api/settings`
- **3D Models CRUD**: `/api/models` (Endpoints for listing, creating, editing, and deleting 3D models)
- **AI Scanners**: 
  - `POST /api/models/analyze-link` (Scrapes and extracts model specs from a URL)
  - `POST /api/models/analyze-image` (Performs vision-based extraction on slicer images or model screenshots)

## 🧪 Testing & Quality

- **Run Tests**: `PYTHONPATH=. uv run pytest`
- **Linting**: `uv run ruff check .`
- **Formatting**: `uv run ruff format .`
- **Type Checking**: `uv run ty check`
- **Security Scan**: `trivy config .` (Static audit of configuration files/Dockerfiles)

## 📁 Project Structure

```text
app/
├── main.py          # FastAPI application & routes
├── models/          # SQLModel database definitions
├── schemas/         # Pydantic validation schemas
├── routers/         # API endpoints
├── database.py      # Engine & session management
├── seed.py          # Data seeding & sequence management
└── services/        # Business logic (AI, MQTT, Costs)
```
