"""add_pending_job_fields

Revision ID: a1b2c3d4e5f6
Revises: 9a1b2c3d4e5f
Create Date: 2026-11-10 11:12:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "9a1b2c3d4e5f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("printjob", sa.Column("printer_id", sa.Integer(), nullable=True))
    op.add_column(
        "printjob",
        sa.Column("external_job_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )
    op.create_index(
        op.f("ix_printjob_external_job_id"),
        "printjob",
        ["external_job_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_printjob_external_job_id"), table_name="printjob")
    op.drop_column("printjob", "external_job_id")
    op.drop_column("printjob", "printer_id")
