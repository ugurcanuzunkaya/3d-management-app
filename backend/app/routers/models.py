from typing import List
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlmodel import Session, select
from app.dependencies import get_session, get_settings_dep
from app.services.ai_service import AIService
from app.models.model3d import Model3D
from app.schemas.model3d import Model3DCreate, Model3DUpdate, ModelExtractionResult
from app.config import AppSettings

router = APIRouter(prefix="/models", tags=["models"])


@router.get("", response_model=List[Model3D])
def list_models(session: Session = Depends(get_session)):
    """List all 3D models from the library, ordered alphabetically by name."""
    statement = select(Model3D).order_by(Model3D.name)
    return session.exec(statement).all()


@router.get("/{model_id}", response_model=Model3D)
def get_model(model_id: int, session: Session = Depends(get_session)):
    """Retrieve details of a specific 3D model."""
    model = session.get(Model3D, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.post("", response_model=Model3D)
def create_model(model_data: Model3DCreate, session: Session = Depends(get_session)):
    """Manually add a new 3D model to the library."""
    model = Model3D.model_validate(model_data)
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


@router.put("/{model_id}", response_model=Model3D)
def update_model(
    model_id: int, model_data: Model3DUpdate, session: Session = Depends(get_session)
):
    """Update details of an existing 3D model in the library."""
    model = session.get(Model3D, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")

    # Only update the fields that are explicitly provided in the request
    update_data = model_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(model, key, value)

    session.add(model)
    session.commit()
    session.refresh(model)
    return model


@router.delete("/{model_id}")
def delete_model(model_id: int, session: Session = Depends(get_session)):
    """Remove a 3D model from the library."""
    model = session.get(Model3D, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    session.delete(model)
    session.commit()
    return {"status": "success"}


@router.post("/analyze-link", response_model=ModelExtractionResult)
async def analyze_link(
    url: str,
    provider: str = "gemini",
    settings: AppSettings = Depends(get_settings_dep),
):
    """
    Fetch a website URL (Makerworld / Printables) using the 3-tiered scraper,
    then use the selected AI provider to extract technical model details without saving them.
    """
    ai_service = AIService(settings)

    # Scrape with tiered scraper
    scraped_text = await ai_service.fetch_markdown_or_text(url)
    if not scraped_text:
        raise HTTPException(
            status_code=400, detail="Failed to scrape content from the provided URL."
        )

    # Analyze scraped content
    try:
        extraction_result = ai_service.extract_tech_params_from_text(
            scraped_text, provider=provider
        )
        return extraction_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze-image", response_model=ModelExtractionResult)
async def analyze_image(
    file: UploadFile = File(...),
    provider: str = Form("gemini"),
    settings: AppSettings = Depends(get_settings_dep),
):
    """
    Upload a sliced model screenshot or physical 3D print image,
    then use the selected AI provider to extract technical model details without saving them.
    """
    ai_service = AIService(settings)

    # Ensure file is an image
    mime_type = file.content_type
    if not mime_type or not mime_type.startswith("image/"):
        raise HTTPException(
            status_code=400, detail="Uploaded file must be a valid image."
        )

    try:
        image_bytes = await file.read()
        extraction_result = ai_service.extract_tech_params_from_image(
            image_bytes, mime_type, provider=provider
        )
        return extraction_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/extract", response_model=Model3D)
async def extract_model(
    url: str,
    session: Session = Depends(get_session),
    settings: AppSettings = Depends(get_settings_dep),
):
    """
    Deprecated/Legacy immediate extraction endpoint. Included for backwards-compatibility.
    Scrapes URL, extracts parameters via Gemini, and automatically inserts into database.
    """
    ai_service = AIService(settings)
    scraped_text = await ai_service.fetch_markdown_or_text(url)
    if not scraped_text:
        raise HTTPException(status_code=400, detail="Failed to fetch markdown from URL")

    extraction = ai_service.extract_tech_params_from_text(
        scraped_text, provider="gemini"
    )

    # Combine extracted fields into legacy schema
    model = Model3D(
        name=extraction.name or url.split("/")[-1] or "New Model",
        source_url=url,
        estimated_weight_g=extraction.weight_g or 0.0,
        tech_details=extraction.model_dump(),
    )
    session.add(model)
    session.commit()
    session.refresh(model)
    return model
