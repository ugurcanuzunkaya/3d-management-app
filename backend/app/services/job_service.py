import logging
from typing import List, Optional
from sqlmodel import Session, select, col
from app.models.job import PrintJob, JobFilament
from app.models.filament import Filament
from app.schemas.job import PrintJobCreate, PrintJobUpdate
from app.exceptions import NotFoundException

logger = logging.getLogger(__name__)


class JobService:
    @staticmethod
    def list_jobs(session: Session, status: Optional[str] = None) -> List[PrintJob]:
        statement = select(PrintJob).order_by(col(PrintJob.created_at))
        if status:
            statement = statement.where(PrintJob.status == status)
        return list(session.exec(statement).all())

    @staticmethod
    def get_job(session: Session, job_id: int) -> PrintJob:
        job = session.get(PrintJob, job_id)
        if not job:
            raise NotFoundException(f"Print job with id {job_id} not found")
        return job

    @staticmethod
    def create_job(session: Session, data: PrintJobCreate) -> PrintJob:
        # 1. Create job
        job = PrintJob(
            name=data.name,
            job_type=data.job_type,
            model_id=data.model_id,
            duration_minutes=data.duration_minutes,
            total_cost=data.total_cost,
            production_cost=data.production_cost,
            status="completed",
        )
        session.add(job)
        session.flush()  # Get job.id

        # 2. Add filaments and deduct stock
        for f_data in data.filaments:
            # Create link
            link = JobFilament(
                job_id=job.id,
                filament_id=f_data.filament_id,
                grams_used=f_data.grams_used,
            )
            session.add(link)

            # Deduct stock
            filament = session.get(Filament, f_data.filament_id)
            if filament:
                filament.remaining_weight_g -= f_data.grams_used
                session.add(filament)

        session.commit()
        session.refresh(job)
        return job

    @staticmethod
    def update_job(session: Session, job_id: int, data: PrintJobUpdate) -> PrintJob:
        job = JobService.get_job(session, job_id)

        # 1. Update basic fields
        update_data = data.model_dump(exclude_unset=True, exclude={"filaments"})
        for key, value in update_data.items():
            setattr(job, key, value)

        # 2. Handle filaments update if provided
        if data.filaments is not None:
            # Create a map of existing links for easy lookup
            existing_links = {link.filament_id: link for link in job.job_filaments}

            # Revert ALL old stock first to simplify logic
            for link in existing_links.values():
                filament = session.get(Filament, link.filament_id)
                if filament:
                    filament.remaining_weight_g += link.grams_used
                    session.add(filament)

            # Prepare new filament IDs
            new_filament_data = {f.filament_id: f.grams_used for f in data.filaments}

            # Remove links that are no longer present
            for fid, link in list(existing_links.items()):
                if fid not in new_filament_data:
                    job.job_filaments.remove(link)

            # Update or add new links
            for fid, grams in new_filament_data.items():
                if fid in existing_links:
                    link = existing_links[fid]
                    link.grams_used = grams
                else:
                    new_link = JobFilament(
                        job_id=job.id,
                        filament_id=fid,
                        grams_used=grams,
                    )
                    job.job_filaments.append(new_link)

                # Deduct new stock
                filament = session.get(Filament, fid)
                if filament:
                    filament.remaining_weight_g -= grams
                    session.add(filament)

        session.add(job)
        session.commit()
        session.refresh(job)
        return job

    @staticmethod
    def delete_job(session: Session, job_id: int) -> None:
        job = JobService.get_job(session, job_id)

        # 1. Revert stock
        for link in job.job_filaments:
            filament = session.get(Filament, link.filament_id)
            if filament:
                filament.remaining_weight_g += link.grams_used
                session.add(filament)

        # 2. Delete job (cascades will handle job_filaments deletion)
        session.delete(job)
        session.commit()

    @staticmethod
    def delete_all_jobs(session: Session) -> None:
        # 1. Fetch all JobFilament links
        links = session.exec(select(JobFilament)).all()

        # 2. Accumulate weight updates in memory
        filament_updates = {}
        for link in links:
            filament_updates[link.filament_id] = (
                filament_updates.get(link.filament_id, 0.0) + link.grams_used
            )

        # 3. Batch fetch all affected filaments
        if filament_updates:
            affected_ids = list(filament_updates.keys())
            filaments = session.exec(
                select(Filament).where(col(Filament.id).in_(affected_ids))
            ).all()
            for filament in filaments:
                filament.remaining_weight_g += filament_updates[filament.id]
                session.add(filament)

        # 4. Delete all print jobs
        jobs = session.exec(select(PrintJob)).all()
        for job in jobs:
            session.delete(job)
        session.commit()
