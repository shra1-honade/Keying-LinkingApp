"""Run service - business logic for runs."""

from sqlalchemy.orm import Session
from app.models.run import Run
from app.models.match_result import MatchResult
from app.schemas.run import RunCreate
import uuid


def get_runs(db: Session, org_id: str = "demo_org", status: str | None = None) -> list[dict]:
    query = db.query(Run).filter(Run.org_id == org_id)
    if status:
        query = query.filter(Run.status == status)
    runs = query.order_by(Run.started_at.desc()).all()

    result = []
    for run in runs:
        run_dict = {
            "run_id": run.run_id,
            "config_id": run.config_id,
            "org_id": run.org_id,
            "status": run.status,
            "input_count": run.input_count,
            "matched_count": run.matched_count,
            "match_rate": run.match_rate,
            "avg_confidence": run.avg_confidence,
            "error_message": run.error_message,
            "duration_seconds": run.duration_seconds,
            "started_at": run.started_at,
            "completed_at": run.completed_at,
            "config_name": run.config.name if run.config else None,
        }
        result.append(run_dict)
    return result


def get_run(db: Session, run_id: str) -> dict | None:
    run = db.query(Run).filter(Run.run_id == run_id).first()
    if not run:
        return None
    return {
        "run_id": run.run_id,
        "config_id": run.config_id,
        "org_id": run.org_id,
        "status": run.status,
        "input_count": run.input_count,
        "matched_count": run.matched_count,
        "match_rate": run.match_rate,
        "avg_confidence": run.avg_confidence,
        "error_message": run.error_message,
        "duration_seconds": run.duration_seconds,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "config_name": run.config.name if run.config else None,
    }


def create_run(db: Session, data: RunCreate) -> Run:
    run = Run(
        run_id=str(uuid.uuid4()),
        config_id=data.config_id,
        org_id=data.org_id,
        status="queued",
    )
    db.add(run)
    db.flush()
    return run


def get_run_results(
    db: Session,
    run_id: str,
    page: int = 1,
    page_size: int = 25,
    min_score: int | None = None,
    search: str | None = None,
    show_unmatched: bool | None = None,
) -> dict:
    query = db.query(MatchResult).filter(MatchResult.run_id == run_id)

    if min_score is not None:
        query = query.filter(MatchResult.confidence_score >= min_score)
    if search:
        query = query.filter(
            MatchResult.input_business_name.ilike(f"%{search}%")
            | MatchResult.matched_efx_business.ilike(f"%{search}%")
        )
    if show_unmatched:
        query = query.filter(MatchResult.confidence_score == 0)

    total = query.count()
    results = (
        query.order_by(MatchResult.confidence_score.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return {
        "results": results,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


def get_all_results_for_download(db: Session, run_id: str) -> list[MatchResult]:
    return (
        db.query(MatchResult)
        .filter(MatchResult.run_id == run_id)
        .order_by(MatchResult.confidence_score.desc())
        .all()
    )


def delete_run(db: Session, run_id: str) -> bool:
    run = db.query(Run).filter(Run.run_id == run_id).first()
    if not run:
        return False
    # Delete associated match results first
    db.query(MatchResult).filter(MatchResult.run_id == run_id).delete()
    db.delete(run)
    db.flush()
    return True
