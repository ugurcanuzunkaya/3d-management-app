"""add_filament_brand_and_tare

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-11-10 11:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "filament",
        sa.Column("brand", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.add_column(
        "filament",
        sa.Column(
            "initial_weight_g",
            sa.Float(),
            nullable=False,
            server_default="1000.0",
        ),
    )
    op.add_column(
        "filament",
        sa.Column(
            "empty_spool_weight_g",
            sa.Float(),
            nullable=False,
            server_default="200.0",
        ),
    )
    op.create_index(op.f("ix_filament_brand"), "filament", ["brand"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_filament_brand"), table_name="filament")
    op.drop_column("filament", "empty_spool_weight_g")
    op.drop_column("filament", "initial_weight_g")
    op.drop_column("filament", "brand")
