"""Audit log API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services import audit_service

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit"])


@router.get("")
def list_audit_logs(
    org_id: str = "demo_org",
    run_id: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    logs = audit_service.get_audit_logs(db, org_id, run_id=run_id, limit=limit)

    if event_type:
        logs = [log for log in logs if log.event_type == event_type]

    return {
        "logs": [
            {
                "log_id": log.log_id,
                "run_id": log.run_id,
                "org_id": log.org_id,
                "event_type": log.event_type,
                "payload": log.payload,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ]
    }
