from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.dependencies import get_session
from app.services.job_service import JobService
from app.schemas.job import PrintJobRead, PrintJobCreate, PrintJobUpdate

router = APIRouter(prefix="/printjobs", tags=["jobs"])


@router.get("", response_model=List[PrintJobRead])
def list_jobs(status: Optional[str] = None, session: Session = Depends(get_session)):
    return JobService.list_jobs(session, status)


@router.post("", response_model=PrintJobRead)
def create_job(data: PrintJobCreate, session: Session = Depends(get_session)):
    return JobService.create_job(session, data)


@router.get("/{job_id}", response_model=PrintJobRead)
def get_job(job_id: int, session: Session = Depends(get_session)):
    return JobService.get_job(session, job_id)


@router.put("/{job_id}", response_model=PrintJobRead)
def update_job(
    job_id: int, data: PrintJobUpdate, session: Session = Depends(get_session)
):
    return JobService.update_job(session, job_id, data)


@router.delete("/all")
def delete_all_jobs(session: Session = Depends(get_session)):
    JobService.delete_all_jobs(session)
    return {"ok": True}


@router.delete("/{job_id}")
def delete_job(job_id: int, session: Session = Depends(get_session)):
    JobService.delete_job(session, job_id)
    return {"ok": True}
