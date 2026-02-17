"""
FastAPI backend for BizMatch.
Simple API with SQLite demonstrating patterns for future Snowflake integration.
"""

import json
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_db

app = FastAPI(title="BizMatch API", version="1.0.0")

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class ConfigCreate(BaseModel):
    name: str
    source_table: str
    column_mapping: dict


class RunCreate(BaseModel):
    config_id: int


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "BizMatch API", "version": "1.0.0"}


@app.get("/api/v1/configs")
def get_configs():
    """Get all configs."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, source_table, column_mapping, created_at
            FROM configs
            ORDER BY created_at DESC
        """)
        configs = [dict(row) for row in cursor.fetchall()]

        # Parse column_mapping JSON
        for config in configs:
            config["column_mapping"] = json.loads(config["column_mapping"])

        return {"configs": configs}


@app.post("/api/v1/configs")
def create_config(config: ConfigCreate):
    """Create a new config."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO configs (name, source_table, column_mapping)
            VALUES (?, ?, ?)
        """, (config.name, config.source_table, json.dumps(config.column_mapping)))

        config_id = cursor.lastrowid

        return {
            "id": config_id,
            "name": config.name,
            "source_table": config.source_table,
            "column_mapping": config.column_mapping
        }


@app.get("/api/v1/runs")
def get_runs(status: Optional[str] = Query(None)):
    """Get all runs, optionally filtered by status."""
    with get_db() as conn:
        cursor = conn.cursor()

        if status:
            cursor.execute("""
                SELECT r.*, c.name as config_name, c.source_table
                FROM runs r
                JOIN configs c ON r.config_id = c.id
                WHERE r.status = ?
                ORDER BY r.started_at DESC
            """, (status,))
        else:
            cursor.execute("""
                SELECT r.*, c.name as config_name, c.source_table
                FROM runs r
                JOIN configs c ON r.config_id = c.id
                ORDER BY r.started_at DESC
            """)

        runs = [dict(row) for row in cursor.fetchall()]
        return {"runs": runs}


@app.post("/api/v1/runs")
def create_run(run_data: RunCreate):
    """
    Create a new run and execute simple matching logic.
    In production, this would call a Snowflake stored procedure.
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify config exists
        cursor.execute("SELECT id FROM configs WHERE id = ?", (run_data.config_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Config not found")

        # Create run record
        cursor.execute("""
            INSERT INTO runs (config_id, status, input_count, matched_count, match_rate, started_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (run_data.config_id, "completed", 100, 0, 0.0, datetime.now().isoformat()))

        run_id = cursor.lastrowid

        # Simple matching logic (demonstration)
        # In production, this would be: CALL snowflake_match_procedure(?)
        cursor.execute("""
            SELECT id, business_name, zip
            FROM reference_businesses
            LIMIT 100
        """)
        ref_businesses = cursor.fetchall()

        matched_count = 0
        results = []

        for i, ref in enumerate(ref_businesses):
            # Simulate 70% match rate
            is_matched = (i % 10) < 7

            if is_matched:
                matched_count += 1
                confidence_score = 5 if i % 2 == 0 else 4
                results.append((
                    run_id,
                    f"CLIENT_{run_id}_{i+1}",
                    ref[1],  # business_name
                    ref[2],  # zip
                    ref[1],  # matched_efx_business
                    f"EFX_{ref[0]:06d}",
                    confidence_score,
                    "Exact match on business name and zip"
                ))
            else:
                results.append((
                    run_id,
                    f"CLIENT_{run_id}_{i+1}",
                    ref[1],
                    ref[2],
                    None,
                    None,
                    0,
                    "No match found"
                ))

        cursor.executemany("""
            INSERT INTO match_results (
                run_id, client_id, business_name, input_zip,
                matched_efx_business, efx_id, confidence_score, match_reason
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, results)

        # Update run stats
        match_rate = (matched_count / 100) * 100
        cursor.execute("""
            UPDATE runs
            SET input_count = ?, matched_count = ?, match_rate = ?, completed_at = ?, status = ?
            WHERE id = ?
        """, (100, matched_count, match_rate, datetime.now().isoformat(), "completed", run_id))

        return {"id": run_id, "status": "completed", "matched_count": matched_count}


@app.get("/api/v1/runs/{run_id}")
def get_run(run_id: int):
    """Get a single run by ID."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.*, c.name as config_name, c.source_table
            FROM runs r
            JOIN configs c ON r.config_id = c.id
            WHERE r.id = ?
        """, (run_id,))

        run = cursor.fetchone()
        if not run:
            raise HTTPException(status_code=404, detail="Run not found")

        return dict(run)


@app.get("/api/v1/runs/{run_id}/results")
def get_run_results(
    run_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    min_score: Optional[int] = Query(None, ge=0, le=5),
    search: Optional[str] = Query(None),
    show_unmatched: Optional[bool] = Query(None)
):
    """Get paginated match results for a run with optional filters."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Build query with filters
        where_clauses = ["run_id = ?"]
        params = [run_id]

        if min_score is not None:
            where_clauses.append("confidence_score >= ?")
            params.append(min_score)

        if search:
            where_clauses.append("(business_name LIKE ? OR matched_efx_business LIKE ?)")
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern])

        if show_unmatched:
            where_clauses.append("confidence_score = 0")

        where_clause = " AND ".join(where_clauses)

        # Get total count
        cursor.execute(f"""
            SELECT COUNT(*) FROM match_results
            WHERE {where_clause}
        """, params)
        total = cursor.fetchone()[0]

        # Get paginated results
        offset = (page - 1) * page_size
        cursor.execute(f"""
            SELECT *
            FROM match_results
            WHERE {where_clause}
            ORDER BY confidence_score DESC, id ASC
            LIMIT ? OFFSET ?
        """, params + [page_size, offset])

        results = [dict(row) for row in cursor.fetchall()]

        return {
            "results": results,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }


@app.get("/api/v1/runs/{run_id}/download")
def download_run_results(run_id: int):
    """Generate CSV export of run results."""
    with get_db() as conn:
        cursor = conn.cursor()

        # Verify run exists
        cursor.execute("SELECT id FROM runs WHERE id = ?", (run_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Run not found")

        # Get all results
        cursor.execute("""
            SELECT client_id, business_name, input_zip,
                   matched_efx_business, efx_id, confidence_score, match_reason
            FROM match_results
            WHERE run_id = ?
            ORDER BY confidence_score DESC
        """, (run_id,))

        results = cursor.fetchall()

        # Generate CSV
        csv_lines = ["Client ID,Business Name,Input Zip,Matched EFX Business,EFX ID,Confidence Score,Match Reason"]
        for row in results:
            csv_lines.append(",".join([
                str(row[0]),
                f'"{row[1]}"',
                str(row[2] or ""),
                f'"{row[3] or ""}"',
                str(row[4] or ""),
                str(row[5]),
                f'"{row[6]}"'
            ]))

        return {
            "filename": f"bizmatch_results_run_{run_id}.csv",
            "content": "\n".join(csv_lines)
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
