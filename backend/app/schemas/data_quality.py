"""Pydantic models for data quality check requests and responses."""

from pydantic import BaseModel


class QualityCheckPreviewRequest(BaseModel):
    column_mapping: dict[str, str]
    source_table: str = "reference_businesses"


class FieldStats(BaseModel):
    field: str
    mapped_to: str | None = None
    total: int
    populated: int
    null_or_empty: int
    null_percent: float
    format_errors: int = 0
    format_error_percent: float = 0.0


class MappingCompleteness(BaseModel):
    mapped_count: int
    total_fields: int
    percent: float
    unmapped_fields: list[str]


class DuplicateInfo(BaseModel):
    count: int
    percent: float
    examples: list[str]


class QualityWarning(BaseModel):
    severity: str  # "error" | "warning" | "info"
    message: str


class QualityCheckResponse(BaseModel):
    overall_score: int
    mapping_completeness: MappingCompleteness
    field_stats: list[FieldStats]
    duplicates: DuplicateInfo
    warnings: list[QualityWarning]
    recommendations: list[str]
    sample_size: int
