"""Config model for connection and column mapping configurations."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, JSON, DateTime
from sqlalchemy.orm import relationship
from app.database import Base


class Config(Base):
    __tablename__ = "configs"

    config_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String(100), index=True, default="demo_org")
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), default="sqlite")
    source_table = Column(String(255), nullable=False)
    column_mapping = Column(JSON)
    run_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    runs = relationship("Run", back_populates="config")
