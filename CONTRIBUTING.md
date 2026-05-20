# Contributing to 3D Management App

First off, thank you for taking the time to contribute! 🎉

This document provides guidelines and instructions to help you contribute to the **3D Management App** project. Please review it carefully before submitting bug reports, feature requests, or code modifications.

---

## 📋 Code of Conduct

We expect all contributors to adhere to standard professional collaboration principles:
- Use welcoming and inclusive language.
- Be respectful of differing viewpoints and experiences.
- Gracefully accept constructive criticism.
- Focus on what is best for the community and project.

---

## 🐛 How Can I Contribute?

### Reporting Bugs
If you find a bug, please open an issue and include:
- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected vs. actual behavior.
- Screenshots, console log files, or terminal stack traces if applicable.
- Information about your operating system and environment.

### Suggesting Features
To suggest a new feature or enhancement:
- Open a feature request issue.
- Describe the feature's goal and use-cases.
- Outline any UI changes or backend schema revisions required.

### Submitting Pull Requests (PRs)
1. Fork the repository and create your branch from `main`.
2. Ensure your branch name follows our naming conventions (see below).
3. Implement your changes, following our coding standards.
4. Run the full test suite and quality diagnostics locally.
5. Update documentation (`README.md`, sub-project readmes, and `CHANGELOG.md`) to reflect your changes.
6. Submit a Pull Request targeting `main`.

---

## 🛠️ Development Setup

The project is divided into a FastAPI backend and a Vite+React frontend.

### Prerequisites
- **Python 3.13+**
- **uv** (Python package manager: `pip install uv`)
- **Bun** (JS runtime & package manager)
- **Docker & Docker Compose** (for containerized environments)

### 🐍 Backend Development Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Sync dependencies and set up the virtual environment:
   ```bash
   uv sync
   ```
3. Set up your environment variables:
   Copy `.env.example` or create a `.env` file:
   ```env
   DATABASE_URL=sqlite:///./3d_management.db
   ```
4. Run database migrations and seed data:
   ```bash
   uv run alembic upgrade head
   uv run python -m app.seed
   ```
5. Launch the development server:
   ```bash
   uv run uvicorn app.main:app --reload --port 8001
   ```

### ⚛️ Frontend Development Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install JS dependencies:
   ```bash
   bun install
   ```
3. Launch the Vite development server:
   ```bash
   bun run dev
   ```
   The local application will be available at `http://localhost:5173`.

---

## 🧪 Tests & Quality Diagnostics

Before submitting any Pull Request, you must verify that all quality diagnostics pass cleanly. We follow a strict **Test-Driven Development (TDD)** approach for security-sensitive modifications and core features.

### Backend Validation
Run all tests, linters, and type checkers from the `backend/` directory:
- **Pytest**:
  ```bash
  PYTHONPATH=. uv run pytest
  ```
- **Ruff Linter**:
  ```bash
  uv run ruff check .
  ```
- **Ruff Formatter**:
  ```bash
  uv run ruff format .
  ```
- **Type Checker**:
  ```bash
  uv run ty check
  ```

### Frontend Validation
Run tests, builds, and linters from the `frontend/` directory:
- **Vitest**:
  ```bash
  bun run test
  ```
- **Linter**:
  ```bash
  bun run lint
  ```
- **Production Build**:
  ```bash
  bun run build
  ```

---

## ✍️ Coding Standards

To maintain code quality, please adhere to these principles:

### General Rules
- **SOLID Principles**: Keep code modular, maintain single responsibilities, and prefer dependency injection.
- **DRY (Don't Repeat Yourself)**: Extract common database query patterns, calculations, and UI styling grids into reusable modules.
- **KISS (Keep It Simple, Stupid)**: Avoid over-engineering; keep business and layout structures simple.

### Python Backend
- Use **SQLModel** for database schema modeling and relationships.
- Enforce strict typing. Avoid using `Any` where possible.
- Use Pydantic schemas for request validation.

### TypeScript Frontend
- Keep frontend components focused and reusable.
- Follow our configuration guidelines:
  - Max file lines: 300 lines.
  - Max function lines: 100 lines.
  - Maximum cyclomatic complexity: 15.
- Centralize global states inside React Context modules (e.g. `PrivacyContext`).

---

## 🌿 Git Guidelines

### Branch Naming Conventions
- Features: `feature/short-description`
- Bug Fixes: `bugfix/short-description`
- Documentation: `docs/short-description`
- Refactoring: `refactor/short-description`

### Commit Message Formatting
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat`: A new feature (e.g., `feat(ui): add visual configuration panel to privacy mode`)
- `fix`: A bug fix (e.g., `fix(mqtt): prevent database connection pooling exhaustion`)
- `perf`: A code change that improves performance (e.g., `perf(ai): cache ollama client connection pool`)
- `docs`: Documentation-only changes (e.g., `docs: add contributing guidelines`)
- `style`: Changes that do not affect the meaning of the code (formatting, white-space)
- `test`: Adding missing tests or correcting existing tests

Example commit message:
```text
feat(backend): implement SSRF protection checks on URL scrapers
```
