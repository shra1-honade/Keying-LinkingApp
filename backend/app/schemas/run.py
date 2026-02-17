from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RunCreate(BaseModel):
    config_id: str
    org_id: str = "demo_org"

class RunResponse(BaseModel):
    run_id: str
    config_id: str
    org_id: str
    status: str
    input_count: int
    matched_count: int
    match_rate: float
    avg_confidence: Optional[float] = None
    error_message: Optional[str] = None
    duration_seconds: Optional[float] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    config_name: Optional[str] = None

    model_config = {"from_attributes": True}
