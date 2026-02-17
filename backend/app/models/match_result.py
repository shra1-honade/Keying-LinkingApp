"""MatchResult model for individual match records."""
import uuid
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MatchResult(Base):
    __tablename__ = "match_results"

    result_id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    run_id = Column(String(36), ForeignKey("runs.run_id"), index=True, nullable=False)
    client_id = Column(String(100))
    input_business_name = Column(String(500))
    input_address = Column(String(500), nullable=True)
    input_city = Column(String(100), nullable=True)
    input_state = Column(String(10), nullable=True)
    input_zip = Column(String(20), nullable=True)
    matched_efx_business = Column(String(500), nullable=True)
    efx_id = Column(String(50), nullable=True)
    efx_address = Column(String(500), nullable=True)
    efx_city = Column(String(100), nullable=True)
    efx_state = Column(String(10), nullable=True)
    efx_zip = Column(String(20), nullable=True)
    confidence_score = Column(Integer, default=0)
    name_similarity = Column(Float, nullable=True)
    address_similarity = Column(Float, nullable=True)
    match_reason = Column(Text, nullable=True)
    flagged_for_review = Column(Boolean, default=False)

    run = relationship("Run", back_populates="results")
