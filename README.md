# 🚀 3D Management App

A premium, comprehensive management system for 3D printing workflows, specifically optimized for **Bambu Lab P2S** printers. This application streamlines inventory management, print job tracking, and cost calculation with a sleek, modern interface.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=3D+Management+App+Dashboard)

## ✨ Features

- **Inventory 2.0**: Normalized tracking of filaments by type, color (with hex swatches), and status.
- **Visual Stock Summary**: At-a-glance metrics for total weight, inventory value, and low stock alerts.
- **Real-time MQTT Tracking**: Integration with Bambu Lab printers for automatic job logging (In Progress).
- **AI-Assisted Specs**: Extract technical parameters (weight, temp, time) from Makerworld/Printables URLs.
- **Smart Cost Engine**: Calculates total production cost based on electricity, power usage, and filament price with customizable markups.
- **Modular Settings**: Manage filament types, colors, and system-wide inventory defaults.

## 🏗 Architecture

The project is built with a modern, decoupled architecture:

- **Frontend**: [React 19](frontend/README.md) + [Vite](frontend/README.md) + [Tailwind 4](frontend/README.md)
- **Backend**: [FastAPI](backend/README.md) + [SQLModel](backend/README.md) + [Alembic](backend/alembic/) + [PostgreSQL](backend/README.md)
- **Infrastructure**: [Docker Compose](docker-compose.yml)

## 🚀 Quick Start

### 🐳 Option 1: Running with Docker (Recommended)

```bash
docker compose up --build -d
```

The application will be available at:

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/docs`

### 💻 Option 2: Running Locally (Without Docker)

This is often faster for active development.

**1. Backend Setup:**

```bash
cd backend
# Create/Edit .env: DATABASE_URL=sqlite:///./3d_management.db
uv sync
uv run uvicorn app.main:app --reload --port 8001
```

**2. Frontend Setup:**

```bash
cd frontend
bun install
bun run dev
```

The local dev app will be at `http://localhost:5173`.

## 🛠 Development

For detailed development instructions, please refer to the sub-project READMEs:

- 🐍 [Backend Development](backend/README.md)
- ⚛️ [Frontend Development](frontend/README.md)

## 🗺 Roadmap

- [x] **Phase 1**: Core Inventory & CRUD (Completed)
- [x] **Phase 2**: MQTT Bambu Lab Integration (Completed)
- [ ] **Phase 3**: Advanced Analytics & Reporting (Active)
- [ ] **Phase 4**: Mobile Companion App (PWA)
- [ ] **Phase 5**: Multi-printer Support & Queue Management

## 🤝 Contributing

1. Fork the project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📝 License

Distributed under the Apache License 2.0. See `LICENSE` for more information.
