"""UserPreferences model for per-org user settings."""
from sqlalchemy import Column, String, Integer, Boolean
from app.database import Base


class UserPreferences(Base):
    __tablename__ = "user_preferences"

    org_id = Column(String(100), primary_key=True)
    email_notifications = Column(Boolean, default=True)
    notify_on_completion = Column(Boolean, default=True)
    notify_on_error = Column(Boolean, default=True)
    notification_email = Column(String(255), nullable=True, default=None)
    retention_days = Column(Integer, default=90)
    auto_archive = Column(Boolean, default=False)
    default_page_size = Column(Integer, default=25)
