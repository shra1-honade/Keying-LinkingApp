"""User preferences API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user_preferences import UserPreferences
from app.schemas.preferences import PreferencesUpdate, PreferencesResponse

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
