"""Configuration API routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.config import ConfigCreate, ConfigUpdate, ConfigResponse
from app.schemas.data_quality import QualityCheckPreviewRequest, QualityCheckResponse
from app.services import config_service
from app.services.data_quality_service import generate_sample_data, run_quality_checks

router = APIRouter(prefix="/api/v1/configs", tags=["configs"])


@router.get("")
def list_configs(org_id: str = "demo_org", db: Session = Depends(get_db)):
    configs = config_service.get_configs(db, org_id)
    return {"configs": [ConfigResponse.model_validate(c) for c in configs]}


@router.post("/quality-check")
def quality_check_preview(
    payload: QualityCheckPreviewRequest,
    db: Session = Depends(get_db),
) -> QualityCheckResponse:
    """Generate sample data and run quality checks before launching a run."""
    records = generate_sample_data(payload.column_mapping, payload.source_table, db)
    report = run_quality_checks(records, payload.column_mapping)
    return report


@router.get("/{config_id}")
def get_config(config_id: str, db: Session = Depends(get_db)):
    config = config_service.get_config(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return ConfigResponse.model_validate(config)


@router.post("", status_code=201)
def create_config(data: ConfigCreate, db: Session = Depends(get_db)):
    config = config_service.create_config(db, data)
    return ConfigResponse.model_validate(config)


@router.put("/{config_id}")
def update_config(config_id: str, data: ConfigUpdate, db: Session = Depends(get_db)):
    config = config_service.update_config(db, config_id, data)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return ConfigResponse.model_validate(config)


@router.delete("/{config_id}", status_code=204)
def delete_config(config_id: str, db: Session = Depends(get_db)):
    success = config_service.delete_config(db, config_id)
    if not success:
        raise HTTPException(status_code=404, detail="Config not found")
    return None


@router.post("/{config_id}/duplicate", status_code=201)
def duplicate_config(config_id: str, db: Session = Depends(get_db)):
    config = config_service.duplicate_config(db, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return ConfigResponse.model_validate(config)
