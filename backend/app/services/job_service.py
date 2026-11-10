import logging
from typing import Any, Dict, List, Optional, cast
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select, col
from app.models.job import PrintJob, JobFilament
from app.models.filament import Filament
from app.models.model3d import Model3D
from app.models.printer import PrinterSlotAssignment
from app.schemas.job import PrintJobCreate, PrintJobUpdate
from app.services.cost_service import CostService
from app.exceptions import NotFoundException

logger = logging.getLogger(__name__)


class JobService:
    @staticmethod
    def list_jobs(session: Session, status: Optional[str] = None) -> List[PrintJob]:
        statement = (
            select(PrintJob)
            .options(
                selectinload(cast(Any, PrintJob.filaments)),
                selectinload(cast(Any, PrintJob.job_filaments)),
            )
            .order_by(col(PrintJob.created_at))
        )
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
        job_status = data.status or "completed"
        production_cost = data.production_cost
        total_cost = data.total_cost

        if (production_cost <= 0 or total_cost <= 0) and data.filaments:
            breakdown = CostService.calculate_job_breakdown(
                session=session,
                filaments=[
                    {"filament_id": f.filament_id, "grams_used": f.grams_used}
                    for f in data.filaments
                ],
                duration_minutes=data.duration_minutes,
            )
            if production_cost <= 0:
                production_cost = breakdown["production_cost"]
            if total_cost <= 0 and job_status == "completed":
                total_cost = breakdown["final_total_price"]

        job = PrintJob(
            name=data.name,
            job_type=data.job_type,
            model_id=data.model_id,
            printer_id=data.printer_id,
            external_job_id=data.external_job_id,
            duration_minutes=data.duration_minutes,
            total_cost=total_cost,
            production_cost=production_cost,
            status=job_status,
        )
        session.add(job)
        session.flush()

        for f_data in data.filaments:
            link = JobFilament(
                job_id=job.id,
                filament_id=f_data.filament_id,
                grams_used=f_data.grams_used,
            )
            session.add(link)

            if job_status == "completed":
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
        was_completed = job.status == "completed"

        # 1. If previously completed, revert old stock first
        if was_completed:
            for link in job.job_filaments:
                if link.filament_id is not None:
                    filament = session.get(Filament, link.filament_id)
                    if filament:
                        filament.remaining_weight_g += link.grams_used
                        session.add(filament)

        # 2. Update basic fields
        update_data = data.model_dump(exclude_unset=True, exclude={"filaments"})
        for key, value in update_data.items():
            setattr(job, key, value)

        # 3. Handle filaments update if provided
        if data.filaments is not None:
            existing_links = {
                link.filament_id: link
                for link in job.job_filaments
                if link.filament_id is not None
            }
            new_filament_data = {f.filament_id: f.grams_used for f in data.filaments}

            for fid, link in list(existing_links.items()):
                if fid not in new_filament_data:
                    job.job_filaments.remove(link)

            for fid, grams in new_filament_data.items():
                if fid in existing_links:
                    existing_links[fid].grams_used = grams
                else:
                    job.job_filaments.append(
                        JobFilament(
                            job_id=job.id,
                            filament_id=fid,
                            grams_used=grams,
                        )
                    )

        # 4. Recalculate production_cost and total_cost via CostService when needed
        if (
            data.production_cost is None
            and (
                job.production_cost <= 0
                or data.filaments is not None
                or data.duration_minutes is not None
            )
            and job.job_filaments
        ):
            breakdown = CostService.calculate_job_breakdown(
                session=session,
                filaments=[
                    {
                        "filament_id": link.filament_id or 0,
                        "grams_used": link.grams_used,
                    }
                    for link in job.job_filaments
                ],
                duration_minutes=job.duration_minutes,
            )
            job.production_cost = breakdown["production_cost"]
            if (
                data.total_cost is None
                and job.total_cost <= 0
                and job.status == "completed"
            ):
                job.total_cost = breakdown["final_total_price"]

        # 5. If now completed, deduct stock for all linked filaments
        if job.status == "completed":
            for link in job.job_filaments:
                if link.filament_id is not None:
                    filament = session.get(Filament, link.filament_id)
                    if filament:
                        filament.remaining_weight_g -= link.grams_used
                        session.add(filament)

        session.add(job)
        session.commit()
        session.refresh(job)
        return job

    @staticmethod
    def approve_pending_job(
        session: Session, job_id: int, data: Optional[PrintJobUpdate] = None
    ) -> PrintJob:
        payload = data.model_copy() if data is not None else PrintJobUpdate()
        payload.status = "completed"
        return JobService.update_job(session, job_id, payload)

    @staticmethod
    def create_pending_job_from_mqtt(
        session: Session, printer_id: int, status_data: Dict[str, Any]
    ) -> Optional[PrintJob]:
        external_job_id = str(
            status_data.get("subtask_id")
            or status_data.get("job_id")
            or status_data.get("task_id")
            or ""
        ).strip()

        if external_job_id:
            existing = session.exec(
                select(PrintJob).where(
                    PrintJob.printer_id == printer_id,
                    PrintJob.external_job_id == external_job_id,
                )
            ).first()
            if existing is not None:
                return existing

        raw_name = str(
            status_data.get("subtask_name")
            or status_data.get("gcode_file")
            or "Completed Print"
        ).strip()

        # Smart Model3D match by subtask_name
        matched_model: Optional[Model3D] = None
        default_grams: float = 0.0
        default_duration: int = 0
        models = session.exec(select(Model3D)).all()
        for m in models:
            if m.name and (
                m.name.lower() == raw_name.lower()
                or m.name.lower() in raw_name.lower()
                or raw_name.lower() in m.name.lower()
            ):
                matched_model = m
                default_grams = m.estimated_weight_g
                if isinstance(m.tech_details, dict):
                    raw_time = m.tech_details.get("print_time_minutes")
                    if isinstance(raw_time, (int, float)):
                        default_duration = int(raw_time)
                break

        # Active slot filament lookup
        ams_root = status_data.get("ams")
        tray_now = (
            str(ams_root.get("tray_now"))
            if isinstance(ams_root, dict) and ams_root.get("tray_now") is not None
            else None
        )
        target_slot_idx: Optional[int] = None
        if tray_now in ("0", "1", "2", "3"):
            target_slot_idx = int(tray_now)
        elif tray_now in ("254", "255"):
            target_slot_idx = 254

        assigned_filament_id: Optional[int] = None
        if target_slot_idx is not None:
            slot_row = session.exec(
                select(PrinterSlotAssignment).where(
                    PrinterSlotAssignment.printer_id == printer_id,
                    PrinterSlotAssignment.slot_index == target_slot_idx,
                )
            ).first()
            if slot_row and slot_row.filament_id is not None:
                assigned_filament_id = slot_row.filament_id

        if assigned_filament_id is None:
            fallback_row = session.exec(
                select(PrinterSlotAssignment).where(
                    PrinterSlotAssignment.printer_id == printer_id,
                    col(PrinterSlotAssignment.filament_id).is_not(None),
                )
            ).first()
            if fallback_row and fallback_row.filament_id is not None:
                assigned_filament_id = fallback_row.filament_id

        initial_production_cost: float = 0.0
        if assigned_filament_id is not None and (
            default_grams > 0 or default_duration > 0
        ):
            breakdown = CostService.calculate_job_breakdown(
                session=session,
                filaments=[
                    {"filament_id": assigned_filament_id, "grams_used": default_grams}
                ],
                duration_minutes=default_duration,
            )
            initial_production_cost = breakdown["production_cost"]

        job = PrintJob(
            name=raw_name,
            job_type="Completed Print",
            model_id=matched_model.id if matched_model else None,
            printer_id=printer_id,
            external_job_id=external_job_id or None,
            duration_minutes=default_duration,
            total_cost=0.0,
            production_cost=initial_production_cost,
            status="pending",
        )
        session.add(job)
        session.flush()

        if assigned_filament_id is not None and job.id is not None:
            session.add(
                JobFilament(
                    job_id=job.id,
                    filament_id=assigned_filament_id,
                    grams_used=default_grams,
                )
            )

        session.commit()
        session.refresh(job)
        return job

    @staticmethod
    def delete_job(session: Session, job_id: int) -> None:
        job = JobService.get_job(session, job_id)

        if job.status == "completed":
            for link in job.job_filaments:
                if link.filament_id is not None:
                    filament = session.get(Filament, link.filament_id)
                    if filament:
                        filament.remaining_weight_g += link.grams_used
                        session.add(filament)

        session.delete(job)
        session.commit()

    @staticmethod
    def delete_all_jobs(session: Session) -> None:
        jobs = session.exec(select(PrintJob)).all()
        completed_job_ids = {
            j.id for j in jobs if j.status == "completed" and j.id is not None
        }
        links = session.exec(select(JobFilament)).all()

        filament_updates: Dict[int, float] = {}
        for link in links:
            if link.job_id in completed_job_ids and link.filament_id is not None:
                filament_updates[link.filament_id] = (
                    filament_updates.get(link.filament_id, 0.0) + link.grams_used
                )

        if filament_updates:
            affected_ids = list(filament_updates.keys())
            filaments = session.exec(
                select(Filament).where(col(Filament.id).in_(affected_ids))
            ).all()
            for filament in filaments:
                if filament.id is not None:
                    filament.remaining_weight_g += filament_updates[filament.id]
                    session.add(filament)

        for job in jobs:
            session.delete(job)
        session.commit()
