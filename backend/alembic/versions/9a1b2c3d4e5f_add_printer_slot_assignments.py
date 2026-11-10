"""add_printer_slot_assignments

Revision ID: 9a1b2c3d4e5f
Revises: 6eb672772864
Create Date: 2026-11-10 11:02:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9a1b2c3d4e5f"
down_revision: Union[str, Sequence[str], None] = "6eb672772864"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "printerslotassignment",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("printer_id", sa.Integer(), nullable=False),
        sa.Column("slot_index", sa.Integer(), nullable=False),
        sa.Column("filament_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["printer_id"], ["printer.id"]),
        sa.ForeignKeyConstraint(["filament_id"], ["filament.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_printerslotassignment_printer_id"),
        "printerslotassignment",
        ["printer_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_printerslotassignment_slot_index"),
        "printerslotassignment",
        ["slot_index"],
        unique=False,
    )
    op.create_index(
        op.f("ix_printerslotassignment_filament_id"),
        "printerslotassignment",
        ["filament_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_printerslotassignment_filament_id"),
        table_name="printerslotassignment",
    )
    op.drop_index(
        op.f("ix_printerslotassignment_slot_index"),
        table_name="printerslotassignment",
    )
    op.drop_index(
        op.f("ix_printerslotassignment_printer_id"),
        table_name="printerslotassignment",
    )
    op.drop_table("printerslotassignment")
