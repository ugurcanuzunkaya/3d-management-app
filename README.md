# 3D Printing Management System

A comprehensive management system for Bambu Lab P2S 3D printers, featuring real-time tracking, inventory management, and AI-assisted technical parameter extraction.

## 🚀 Features

- **Real-time Print Tracking:** Automatic print job logging via MQTT integration with Bambu Lab printers.
- **Inventory Management:** Detailed tracking of filament stock (grams remaining, series specs, color, and type).
- **AI-Assisted Spec Extraction:** Automatically extract model technical parameters (weight, suggested temp, time) from Makerworld or Printables URLs using LLMs (Ollama) and Firecrawl.
- **Financial Engine:** Automated cost calculation based on electricity price, printer wattage, and filament usage with a customizable markup formula (default: 3x).
- **Dashboard:** At-a-glance view of active stock, pending print approvals, and printer connectivity.
- **Pending Approvals:** Review and confirm completed print jobs to accurately deduct stock and finalize costs.

## 🛠 Tech Stack

- **Backend:** FastAPI (Python 3.13) with SQLModel & PostgreSQL.
- **Frontend:** React (TypeScript) with Bun, Tailwind CSS, and shadcn/ui.
- **Orchestration:** Docker Compose.
- **AI Infrastructure:** Ollama (Local LLM) and Firecrawl (Web Scraping).

## 📦 Setup & Installation

### Prerequisites

- Docker & Docker Compose
- Bun (for local frontend development)
- Python 3.13 & uv (for local backend development)

### Configuration

1. Clone the repository.
2. Configure the `.env` file in the root directory:

   ```env
   # Database
   POSTGRES_USER=admin
   POSTGRES_PASSWORD=password
   POSTGRES_DB=3d_management

   # Bambu Lab P2S
   BAMBU_PRINTER_IP=192.168.x.x
   BAMBU_PRINTER_SERIAL=your_serial
   BAMBU_PRINTER_ACCESS_CODE=your_code

   # AI Services
   FIRECRAWL_API_KEY=your_key
   OLLAMA_BASE_URL=http://host.docker.internal:11434
   ```

### Running with Docker

```bash
docker compose up --build -d
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Adminer (DB UI): `http://localhost:8080`

## 📊 Database Seeding

The system automatically seeds initial filament data from `backend/stock_data.json` upon first startup.

## 🧪 Testing

### Backend

```bash
cd backend
uv run pytest
```

### Frontend

```bash
cd frontend
bun run test
```

## 📝 License

MIT
