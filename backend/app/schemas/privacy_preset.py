from datetime import datetime
from typing import Dict
from sqlmodel import SQLModel


class PrivacyPresetBase(SQLModel):
    name: str
    page_path: str
    settings: Dict[str, bool]


class PrivacyPresetCreate(PrivacyPresetBase):
    pass


class PrivacyPresetRead(PrivacyPresetBase):
    id: int
    created_at: datetime
