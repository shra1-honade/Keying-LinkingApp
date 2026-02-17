"""ReferenceBusiness model for mock EFX reference data."""
from sqlalchemy import Column, String
from app.database import Base


class ReferenceBusiness(Base):
    __tablename__ = "reference_businesses"

    client_id = Column(String(50), primary_key=True)
    business_name = Column(String(500), index=True, nullable=False)
    normalized_name = Column(String(500), index=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(10), index=True, nullable=True)
    zip = Column(String(20), index=True, nullable=True)
