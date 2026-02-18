"""User preferences API routes."""

import re
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user_preferences import UserPreferences
from app.schemas.preferences import PreferencesUpdate, PreferencesResponse


class TestEmailRequest(BaseModel):
    email: str

router = APIRouter(prefix="/api/v1/preferences", tags=["preferences"])


@router.get("/{org_id}")
def get_preferences(org_id: str, db: Session = Depends(get_db)):
    prefs = db.query(UserPreferences).filter(UserPreferences.org_id == org_id).first()
    if not prefs:
        # Create default preferences
        prefs = UserPreferences(org_id=org_id)
        db.add(prefs)
        db.flush()
    return PreferencesResponse.model_validate(prefs)


@router.put("/{org_id}")
def update_preferences(org_id: str, data: PreferencesUpdate, db: Session = Depends(get_db)):
    prefs = db.query(UserPreferences).filter(UserPreferences.org_id == org_id).first()
    if not prefs:
        prefs = UserPreferences(org_id=org_id)
        db.add(prefs)

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prefs, key, value)

    db.flush()
    return PreferencesResponse.model_validate(prefs)


@router.post("/{org_id}/test-email")
def send_test_email(org_id: str, body: TestEmailRequest, db: Session = Depends(get_db)):
    from app.services.email_service import send_email, is_configured
    from app.services.email_templates import test_email

    if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', body.email):
        raise HTTPException(status_code=400, detail="Invalid email address")

    if not is_configured():
        raise HTTPException(
            status_code=500,
            detail="SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD environment variables.",
        )

    try:
        send_email(
            to_email=body.email,
            subject="BizMatch - Test Notification",
            html_body=test_email(),
        )
        return {"success": True, "message": "Test email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
