from typing import List
from sqlmodel import Session, select
from app.models.privacy_preset import PrivacyPreset
from app.schemas.privacy_preset import PrivacyPresetCreate


class PrivacyPresetService:
    @staticmethod
    def get_presets_by_page(session: Session, page_path: str) -> List[PrivacyPreset]:
        statement = select(PrivacyPreset).where(PrivacyPreset.page_path == page_path)
        return list(session.exec(statement).all())

    @staticmethod
    def get_all_presets(session: Session) -> List[PrivacyPreset]:
        statement = select(PrivacyPreset)
        return list(session.exec(statement).all())

    @staticmethod
    def create_preset(
        session: Session, preset_data: PrivacyPresetCreate
    ) -> PrivacyPreset:
        db_preset = PrivacyPreset(
            name=preset_data.name,
            page_path=preset_data.page_path,
            settings=preset_data.settings,
        )
        session.add(db_preset)
        session.commit()
        session.refresh(db_preset)
        return db_preset

    @staticmethod
    def delete_preset(session: Session, preset_id: int) -> bool:
        db_preset = session.get(PrivacyPreset, preset_id)
        if not db_preset:
            return False
        session.delete(db_preset)
        session.commit()
        return True
