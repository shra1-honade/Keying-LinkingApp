"""Run model for job execution records."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Run(Base):
    __tablename__ = "runs"

    run_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    config_id = Column(String(36), ForeignKey("configs.config_id"), nullable=False)
    org_id = Column(String(100), index=True, default="demo_org")
    status = Column(String(20), default="queued")
    input_count = Column(Integer, default=0)
    matched_count = Column(Integer, default=0)
    match_rate = Column(Float, default=0.0)
    avg_confidence = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    config = relationship("Config", back_populates="runs")
    results = relationship("MatchResult", back_populates="run")
    audit_logs = relationship("AuditLog", back_populates="run")
