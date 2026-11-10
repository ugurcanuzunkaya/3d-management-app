from typing import Any
from sqlalchemy import event, inspect, text
from sqlalchemy.engine import Engine
from sqlmodel import create_engine, SQLModel, Session
from app.config import get_settings

DATABASE_URL = get_settings().database_url

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)

if DATABASE_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_connection: Any, _connection_record: Any) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA temp_store=MEMORY")
        cursor.close()


SQLITE_COLUMN_MIGRATIONS: dict[str, list[tuple[str, str]]] = {
    "filament": [
        ("brand", "VARCHAR"),
        ("initial_weight_g", "FLOAT NOT NULL DEFAULT 1000.0"),
        ("empty_spool_weight_g", "FLOAT NOT NULL DEFAULT 200.0"),
    ],
    "printjob": [
        ("printer_id", "INTEGER"),
        ("external_job_id", "VARCHAR"),
        ("status", "VARCHAR NOT NULL DEFAULT 'completed'"),
    ],
    "settings": [
        ("markup_multiplier", "FLOAT NOT NULL DEFAULT 3.0"),
        ("machine_hourly_rate", "FLOAT NOT NULL DEFAULT 0.0"),
        ("failure_rate_pct", "FLOAT NOT NULL DEFAULT 0.0"),
        ("currency", "VARCHAR NOT NULL DEFAULT 'TRY'"),
    ],
    "stocksettings": [
        ("low_stock_threshold", "FLOAT NOT NULL DEFAULT 200.0"),
    ],
}


def _ensure_sqlite_columns(target_engine: Engine) -> None:
    insp = inspect(target_engine)
    existing_tables = set(insp.get_table_names())
    with target_engine.begin() as conn:
        for table_name, columns in SQLITE_COLUMN_MIGRATIONS.items():
            if table_name not in existing_tables:
                continue
            existing_cols = {c["name"] for c in insp.get_columns(table_name)}
            for col_name, col_ddl in columns:
                if col_name not in existing_cols:
                    conn.execute(
                        text(
                            f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_ddl}"
                        )
                    )


def init_db():
    from app import models

    _ = models.__all__
    SQLModel.metadata.create_all(engine)
    _ensure_sqlite_columns(engine)


def get_session():
    with Session(engine) as session:
        yield session
