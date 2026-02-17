from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ConfigBase(BaseModel):
    name: str
    source_type: str = "sqlite"
    source_table: str
    column_mapping: dict

class ConfigCreate(ConfigBase):
    org_id: str = "demo_org"

class ConfigUpdate(BaseModel):
    name: Optional[str] = None
    source_type: Optional[str] = None
    source_table: Optional[str] = None
    column_mapping: Optional[dict] = None

class ConfigResponse(ConfigBase):
    config_id: str
    org_id: str
    run_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
