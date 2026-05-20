from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session
from typing import List, Optional
from app.dependencies import get_session
from app.services.privacy_preset_service import PrivacyPresetService
from app.schemas.privacy_preset import PrivacyPresetCreate, PrivacyPresetRead

router = APIRouter(prefix="/privacy-presets", tags=["privacy-presets"])


@router.get("", response_model=List[PrivacyPresetRead])
def get_presets(
    page_path: Optional[str] = Query(None, description="Filter presets by page path"),
    session: Session = Depends(get_session),
):
    if page_path is not None:
        return PrivacyPresetService.get_presets_by_page(session, page_path)
    return PrivacyPresetService.get_all_presets(session)


@router.post("", response_model=PrivacyPresetRead)
def create_preset(data: PrivacyPresetCreate, session: Session = Depends(get_session)):
    return PrivacyPresetService.create_preset(session, data)


@router.delete("/{preset_id}")
def delete_preset(preset_id: int, session: Session = Depends(get_session)):
    success = PrivacyPresetService.delete_preset(session, preset_id)
    if not success:
        raise HTTPException(status_code=404, detail="Preset not found")
    return {"message": "Preset deleted successfully"}
