FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Copy only requirements to cache them
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application
COPY . .

# Final sync to install the project itself
RUN uv sync --frozen --no-dev

# Expose the port
EXPOSE 8000

# Run the application (run migrations first, then start the server)
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
