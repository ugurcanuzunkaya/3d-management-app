from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.dependencies import get_session, get_settings
from app.services.ai_service import AIService
from app.models.model3d import Model3D
from app.config import AppSettings

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=List[Model3D])
def list_models(session: Session = Depends(get_session)):
    return session.exec(select(Model3D)).all()


@router.post("/extract", response_model=Model3D)
async def extract_model(
    url: str,
    session: Session = Depends(get_session),
    settings: AppSettings = Depends(get_settings),
):
    ai_service = AIService(settings)
    markdown = ai_service.fetch_markdown(url)
    if not markdown:
        raise HTTPException(status_code=400, detail="Failed to fetch markdown from URL")

    tech_params = ai_service.extract_tech_params(markdown)

    model = Model3D(
        name=url.split("/")[-1] or "New Model",
        source_url=url,
        estimated_weight_g=tech_params.get("weight_g", 0.0),
        tech_details=tech_params,
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


@router.delete("/{model_id}")
def delete_model(model_id: int, session: Session = Depends(get_session)):
    model = session.get(Model3D, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    session.delete(model)
    session.commit()
    return {"status": "success"}
