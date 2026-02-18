from pydantic import BaseModel
from typing import Optional

class PreferencesUpdate(BaseModel):
    email_notifications: Optional[bool] = None
    notify_on_completion: Optional[bool] = None
    notify_on_error: Optional[bool] = None
    notification_email: Optional[str] = None
    retention_days: Optional[int] = None
    auto_archive: Optional[bool] = None
    default_page_size: Optional[int] = None

class PreferencesResponse(BaseModel):
    org_id: str
    email_notifications: bool
    notify_on_completion: bool
    notify_on_error: bool
    notification_email: Optional[str] = None
    retention_days: int
    auto_archive: bool
    default_page_size: int

    model_config = {"from_attributes": True}
