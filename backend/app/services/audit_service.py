"""Audit logging service."""

from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
import uuid


def log_event(db: Session, org_id: str, event_type: str, payload: dict = None, run_id: str = None):
    log = AuditLog(
        log_id=str(uuid.uuid4()),
        run_id=run_id,
        org_id=org_id,
        event_type=event_type,
        payload=payload,
    )
    db.add(log)
    db.flush()
    return log


def get_audit_logs(db: Session, org_id: str, run_id: str = None, limit: int = 100) -> list[AuditLog]:
    query = db.query(AuditLog).filter(AuditLog.org_id == org_id)
    if run_id:
        query = query.filter(AuditLog.run_id == run_id)
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
