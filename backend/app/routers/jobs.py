from typing import List, Optional
from fastapi import APIRouter, Body, Depends
from sqlmodel import Session
from app.dependencies import get_session
from app.services.cost_service import CostService
from app.services.job_service import JobService
from app.schemas.job import (
    CostBreakdownRead,
    CostCalculateRequest,
    PrintJobRead,
    PrintJobCreate,
    PrintJobUpdate,
)

router = APIRouter(prefix="/printjobs", tags=["jobs"])


@router.get("", response_model=List[PrintJobRead])
def list_jobs(status: Optional[str] = None, session: Session = Depends(get_session)):
    return JobService.list_jobs(session, status)


@router.post("", response_model=PrintJobRead)
def create_job(data: PrintJobCreate, session: Session = Depends(get_session)):
    return JobService.create_job(session, data)


@router.post("/calculate-cost", response_model=CostBreakdownRead)
def calculate_job_cost(
    data: CostCalculateRequest, session: Session = Depends(get_session)
):
    breakdown = CostService.calculate_job_breakdown(
        session=session,
        filaments=[
            {"filament_id": f.filament_id, "grams_used": f.grams_used}
            for f in data.filaments
        ],
        duration_minutes=data.duration_minutes,
        custom_costs=[{"name": c.name, "value": c.value} for c in data.custom_costs],
        markup_override=data.markup_multiplier,
    )
    return CostBreakdownRead(**breakdown)


@router.get("/{job_id}", response_model=PrintJobRead)
def get_job(job_id: int, session: Session = Depends(get_session)):
    return JobService.get_job(session, job_id)


@router.put("/{job_id}", response_model=PrintJobRead)
def update_job(
    job_id: int, data: PrintJobUpdate, session: Session = Depends(get_session)
):
    return JobService.update_job(session, job_id, data)


@router.post("/{job_id}/approve", response_model=PrintJobRead)
def approve_pending_job(
    job_id: int,
    data: Optional[PrintJobUpdate] = Body(default=None),
    session: Session = Depends(get_session),
):
    return JobService.approve_pending_job(session, job_id, data)


@router.delete("/all")
def delete_all_jobs(session: Session = Depends(get_session)):
    JobService.delete_all_jobs(session)
    return {"ok": True}


@router.delete("/{job_id}")
def delete_job(job_id: int, session: Session = Depends(get_session)):
    JobService.delete_job(session, job_id)
    return {"ok": True}
