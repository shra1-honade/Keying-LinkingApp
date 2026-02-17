"""CustomerBusiness model for customer-uploaded business data."""
from sqlalchemy import Column, Integer, String
from app.database import Base


class CustomerBusiness(Base):
    __tablename__ = "customer_businesses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(500), index=True, nullable=False)
    account_id = Column(String(50), nullable=True)
    street_address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)
    state_code = Column(String(10), index=True, nullable=True)
    postal_code = Column(String(20), index=True, nullable=True)
