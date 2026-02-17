"""AuditLog model for tracking events."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("runs.run_id"), nullable=True)
    org_id = Column(String(100), index=True)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, index=True, default=datetime.utcnow)

    run = relationship("Run", back_populates="audit_logs")
