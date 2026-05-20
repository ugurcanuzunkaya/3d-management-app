FROM ghcr.io/astral-sh/uv:python3.13-bookworm-slim

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1

# Run OS updates to patch base image vulnerabilities (glibc, openssl, sqlite, etc.)
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*

# Create a non-root group and user
RUN groupadd -r appgroup && useradd -r -g appgroup -d /app -s /sbin/nologin appuser

# Copy only requirements to cache them
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

# Copy the rest of the application
COPY . .

# Final sync to install the project itself
RUN uv sync --frozen --no-dev

# Set ownership of /app to the non-root user
RUN chown -R appuser:appgroup /app

# Expose the port
EXPOSE 8000

# Switch to the non-root user
USER appuser

# Run the application (run migrations first, then start the server)
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn app.main:app --host 0.0.0.0 --port 8000"]
