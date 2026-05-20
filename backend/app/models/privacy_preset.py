from datetime import datetime, timezone
from typing import Optional, Dict
from sqlmodel import SQLModel, Field, JSON, Column


class PrivacyPreset(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    page_path: str = Field(index=True)
    settings: Dict[str, bool] = Field(default={}, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
