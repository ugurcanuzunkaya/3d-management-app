"""add_pricing_settings_fields

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-11-10 11:38:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "settings",
        sa.Column(
            "markup_multiplier",
            sa.Float(),
            nullable=False,
            server_default="3.0",
        ),
    )
    op.add_column(
        "settings",
        sa.Column(
            "machine_hourly_rate",
            sa.Float(),
            nullable=False,
            server_default="0.0",
        ),
    )
    op.add_column(
        "settings",
        sa.Column(
            "failure_rate_pct",
            sa.Float(),
            nullable=False,
            server_default="0.0",
        ),
    )
    op.add_column(
        "settings",
        sa.Column(
            "currency",
            sqlmodel.sql.sqltypes.AutoString(),
            nullable=False,
            server_default="TRY",
        ),
    )


def downgrade() -> None:
    op.drop_column("settings", "currency")
    op.drop_column("settings", "failure_rate_pct")
    op.drop_column("settings", "machine_hourly_rate")
    op.drop_column("settings", "markup_multiplier")
