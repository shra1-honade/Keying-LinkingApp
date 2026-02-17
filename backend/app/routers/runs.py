"""Runs API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.schemas.run import RunCreate, RunResponse
from app.schemas.match_result import MatchResultResponse, PaginatedResults
from app.services import run_service
from app.services.background_tasks import run_matching_job
from app.models.run import Run

router = APIRouter(prefix="/api/v1/runs", tags=["runs"])


@router.get("")
def list_runs(
    org_id: str = "demo_org",
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    runs = run_service.get_runs(db, org_id, status)
    return {"runs": runs}


@router.get("/{run_id}")
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = run_service.get_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("", status_code=201)
def create_run(data: RunCreate, db: Session = Depends(get_db)):
    # Verify config exists
    from app.models.config import Config
    config = db.query(Config).filter(Config.config_id == data.config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    run = run_service.create_run(db, data)
    db.commit()

    # Start background matching
    run_matching_job(run.run_id, data.config_id, data.org_id)

    return {
        "run_id": run.run_id,
        "config_id": run.config_id,
        "org_id": run.org_id,
        "status": run.status,
    }


@router.get("/{run_id}/results")
def get_run_results(
    run_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    min_score: Optional[int] = Query(None, ge=0, le=5),
    search: Optional[str] = Query(None),
    show_unmatched: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
):
    # Verify run exists
    run = db.query(Run).filter(Run.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    data = run_service.get_run_results(db, run_id, page, page_size, min_score, search, show_unmatched)

    return {
        "results": [MatchResultResponse.model_validate(r) for r in data["results"]],
        "total": data["total"],
        "page": data["page"],
        "page_size": data["page_size"],
        "total_pages": data["total_pages"],
    }


@router.delete("/{run_id}", status_code=204)
def delete_run(run_id: str, db: Session = Depends(get_db)):
    success = run_service.delete_run(db, run_id)
    if not success:
        raise HTTPException(status_code=404, detail="Run not found")
    return None


@router.get("/{run_id}/download")
def download_results(run_id: str, db: Session = Depends(get_db)):
    run = db.query(Run).filter(Run.run_id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    results = run_service.get_all_results_for_download(db, run_id)

    csv_lines = [
        "Client ID,Input Business Name,Input Address,Input City,Input State,Input Zip,"
        "Matched EFX Business,EFX ID,EFX Address,EFX City,EFX State,EFX Zip,"
        "Confidence Score,Name Similarity,Address Similarity,Match Reason"
    ]
    for r in results:
        csv_lines.append(",".join([
            str(r.client_id or ""),
            f'"{r.input_business_name or ""}"',
            f'"{r.input_address or ""}"',
            str(r.input_city or ""),
            str(r.input_state or ""),
            str(r.input_zip or ""),
            f'"{r.matched_efx_business or ""}"',
            str(r.efx_id or ""),
            f'"{r.efx_address or ""}"',
            str(r.efx_city or ""),
            str(r.efx_state or ""),
            str(r.efx_zip or ""),
            str(r.confidence_score),
            str(r.name_similarity or ""),
            str(r.address_similarity or ""),
            f'"{r.match_reason or ""}"',
        ]))

    return {
        "filename": f"bizmatch_results_{run_id[:8]}.csv",
        "content": "\n".join(csv_lines),
    }
