from pydantic import BaseModel
from typing import Optional

class MatchResultResponse(BaseModel):
    result_id: str
    run_id: str
    client_id: str
    input_business_name: str
    input_address: Optional[str] = None
    input_city: Optional[str] = None
    input_state: Optional[str] = None
    input_zip: Optional[str] = None
    matched_efx_business: Optional[str] = None
    efx_id: Optional[str] = None
    efx_address: Optional[str] = None
    efx_city: Optional[str] = None
    efx_state: Optional[str] = None
    efx_zip: Optional[str] = None
    confidence_score: int
    name_similarity: Optional[float] = None
    address_similarity: Optional[float] = None
    match_reason: Optional[str] = None
    flagged_for_review: bool = False

    model_config = {"from_attributes": True}

class PaginatedResults(BaseModel):
    results: list[MatchResultResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
