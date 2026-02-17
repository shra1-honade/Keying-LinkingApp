"""Data quality check service for pre-launch validation."""

import re
import random
from faker import Faker
from sqlalchemy.orm import Session
from app.models.reference_business import ReferenceBusiness
from app.schemas.data_quality import (
    FieldStats,
    MappingCompleteness,
    DuplicateInfo,
    QualityWarning,
    QualityCheckResponse,
)

EFX_FIELDS = ["business_name", "address", "city", "state", "zip", "client_id"]

ZIP_PATTERN = re.compile(r"^\d{5}(-\d{4})?$")
STATE_PATTERN = re.compile(r"^[A-Z]{2}$")


def generate_sample_data(
    column_mapping: dict[str, str],
    source_table: str,
    db: Session,
    sample_size: int = 50,
) -> list[dict]:
    """Generate synthetic sample records with intentional quality issues."""
    fake = Faker()
    Faker.seed(42)
    random.seed(42)

    # Fetch reference data for realistic samples
    ref_rows = db.query(ReferenceBusiness).limit(200).all()
    ref_data = [
        {
            "business_name": r.business_name,
            "address": r.address,
            "city": r.city,
            "state": r.state,
            "zip": r.zip,
            "client_id": r.client_id,
        }
        for r in ref_rows
    ]

    records: list[dict] = []
    match_count = min(int(sample_size * 0.7), len(ref_data))
    ref_sample = random.sample(ref_data, match_count) if ref_data else []

    for i, ref in enumerate(ref_sample):
        record: dict[str, str | None] = {"client_id": f"SAMPLE-{i+1:04d}"}

        for efx_field in EFX_FIELDS:
            if efx_field == "client_id":
                continue
            if efx_field in column_mapping:
                val = ref.get(efx_field, "")
                # Introduce quality issues for demo
                r = random.random()
                if r < 0.05:
                    val = None  # ~5% null values
                elif r < 0.10 and efx_field == "zip":
                    val = "ABCDE"  # bad zip format
                elif r < 0.15 and efx_field == "state":
                    val = "California"  # full state name instead of abbrev
                elif r < 0.20 and efx_field == "business_name":
                    val = ref["business_name"].upper()  # case variant
                record[efx_field] = val
            else:
                record[efx_field] = None

        records.append(record)

    # Add faker-generated records (won't match)
    for i in range(sample_size - len(ref_sample)):
        record = {"client_id": f"SAMPLE-{match_count + i + 1:04d}"}
        for efx_field in EFX_FIELDS:
            if efx_field == "client_id":
                continue
            if efx_field in column_mapping:
                r = random.random()
                if r < 0.08:
                    record[efx_field] = None
                elif efx_field == "business_name":
                    record[efx_field] = fake.company()
                elif efx_field == "address":
                    record[efx_field] = fake.street_address()
                elif efx_field == "city":
                    record[efx_field] = fake.city()
                elif efx_field == "state":
                    record[efx_field] = fake.state_abbr()
                elif efx_field == "zip":
                    record[efx_field] = fake.zipcode()
            else:
                record[efx_field] = None
        records.append(record)

    # Inject a few duplicates by name+zip
    if len(records) >= 5:
        for dup_idx in range(3):
            src = records[dup_idx]
            dup = dict(src)
            dup["client_id"] = f"SAMPLE-DUP-{dup_idx+1:04d}"
            records.append(dup)

    random.shuffle(records)
    return records


def run_quality_checks(
    records: list[dict],
    column_mapping: dict[str, str],
) -> QualityCheckResponse:
    """Run all quality checks on sample data and return a structured report."""
    total = len(records)
    warnings: list[QualityWarning] = []
    recommendations: list[str] = []

    # 1. Mapping completeness
    mapped_fields = [f for f in EFX_FIELDS if f in column_mapping and column_mapping[f]]
    unmapped = [f for f in EFX_FIELDS if f not in column_mapping or not column_mapping[f]]
    mapping_pct = round((len(mapped_fields) / len(EFX_FIELDS)) * 100, 1)

    mapping_completeness = MappingCompleteness(
        mapped_count=len(mapped_fields),
        total_fields=len(EFX_FIELDS),
        percent=mapping_pct,
        unmapped_fields=unmapped,
    )

    if unmapped:
        sev = "error" if len(unmapped) >= 3 else "warning"
        warnings.append(QualityWarning(
            severity=sev,
            message=f"{len(unmapped)} field(s) not mapped: {', '.join(unmapped)}",
        ))
        recommendations.append(f"Map the {', '.join(unmapped)} field(s) to improve match accuracy.")

    # 2. Per-field null/empty stats + format validation
    field_stats: list[FieldStats] = []

    for field in EFX_FIELDS:
        mapped_to = column_mapping.get(field)
        values = [r.get(field) for r in records]
        populated = sum(1 for v in values if v is not None and str(v).strip())
        null_count = total - populated
        null_pct = round((null_count / total) * 100, 1) if total else 0

        format_errors = 0
        if field == "zip":
            for v in values:
                if v is not None and str(v).strip() and not ZIP_PATTERN.match(str(v)):
                    format_errors += 1
        elif field == "state":
            for v in values:
                if v is not None and str(v).strip() and not STATE_PATTERN.match(str(v)):
                    format_errors += 1

        fmt_pct = round((format_errors / total) * 100, 1) if total else 0

        field_stats.append(FieldStats(
            field=field,
            mapped_to=mapped_to if mapped_to else None,
            total=total,
            populated=populated,
            null_or_empty=null_count,
            null_percent=null_pct,
            format_errors=format_errors,
            format_error_percent=fmt_pct,
        ))

        if null_pct > 20 and mapped_to:
            warnings.append(QualityWarning(
                severity="warning",
                message=f"{field}: {null_pct}% of values are null or empty",
            ))

        if format_errors > 0:
            warnings.append(QualityWarning(
                severity="warning",
                message=f"{field}: {format_errors} record(s) with invalid format",
            ))

    # 3. Duplicate detection by (business_name + zip)
    seen: dict[str, int] = {}
    for r in records:
        name = str(r.get("business_name") or "").strip().lower()
        zip_code = str(r.get("zip") or "").strip()
        key = f"{name}|{zip_code}"
        seen[key] = seen.get(key, 0) + 1

    dup_keys = {k: v for k, v in seen.items() if v > 1}
    dup_count = sum(v - 1 for v in dup_keys.values())
    dup_pct = round((dup_count / total) * 100, 1) if total else 0
    dup_examples = [k.split("|")[0] for k in list(dup_keys.keys())[:5]]

    duplicates = DuplicateInfo(
        count=dup_count,
        percent=dup_pct,
        examples=dup_examples,
    )

    if dup_count > 0:
        warnings.append(QualityWarning(
            severity="info" if dup_count <= 3 else "warning",
            message=f"{dup_count} potential duplicate(s) detected by name+zip",
        ))
        recommendations.append("Review duplicate records before launching to avoid redundant matches.")

    # 4. Overall score (0-100)
    # Weights: mapping 30%, nulls 30%, format 20%, duplicates 20%
    mapping_score = mapping_pct  # 0-100

    # Null score: average populated percentage across mapped fields
    mapped_stats = [fs for fs in field_stats if fs.mapped_to]
    if mapped_stats:
        null_score = sum((fs.populated / fs.total * 100) if fs.total else 100 for fs in mapped_stats) / len(mapped_stats)
    else:
        null_score = 0

    # Format score: percentage without format errors across all fields
    total_format_errors = sum(fs.format_errors for fs in field_stats)
    format_score = max(0, 100 - (total_format_errors / total * 100)) if total else 100

    # Duplicate score
    dup_score = max(0, 100 - dup_pct * 5)  # penalize duplicates heavily

    overall = round(
        mapping_score * 0.30
        + null_score * 0.30
        + format_score * 0.20
        + dup_score * 0.20
    )
    overall = max(0, min(100, overall))

    if overall >= 80:
        warnings.insert(0, QualityWarning(severity="info", message="Data quality looks good!"))
    elif overall >= 50:
        recommendations.append("Consider fixing the issues above before launching for best results.")

    return QualityCheckResponse(
        overall_score=overall,
        mapping_completeness=mapping_completeness,
        field_stats=field_stats,
        duplicates=duplicates,
        warnings=warnings,
        recommendations=recommendations,
        sample_size=total,
    )
