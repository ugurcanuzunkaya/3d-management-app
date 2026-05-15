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

4. **Seed Data**:
    The database is automatically seeded on startup via the `lifespan` event, but you can run it manually:

    ```bash
    uv run python -m app.seed
    ```

## 📡 API Endpoints

- **Filaments**: `GET`, `POST`, `PUT`, `DELETE` on `/api/filaments`
- **Types & Colors**: `/api/filament-types`, `/api/filament-colors`
- **Print Jobs**: `/api/printjobs`
- **Settings**: `/api/stock-settings`, `/api/settings`
- **AI Extraction**: `POST /api/models/extract`

## 🧪 Testing & Quality

- **Run Tests**: `uv run pytest`
- **Linting**: `ruff check .`
- **Formatting**: `ruff format .`
- **Type Checking**: `uv run ty check`

## 📁 Project Structure

```text
app/
├── main.py          # FastAPI application & routes
├── models.py        # SQLModel database definitions
├── schemas.py       # Pydantic validation schemas
├── database.py      # Engine & session management
├── seed.py          # Data seeding & sequence management
└── services/        # Business logic (AI, MQTT, Costs)
```
