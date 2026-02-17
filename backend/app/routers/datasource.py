"""Data source endpoints for table and column discovery."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.adapters.sqlite_adapter import SQLiteAdapter

router = APIRouter(prefix="/api/v1/datasource", tags=["datasource"])


@router.get("/tables")
def get_tables(
    source_type: str = Query("sqlite"),
    db: Session = Depends(get_db),
):
    if source_type == "sqlite":
        adapter = SQLiteAdapter(db)
        tables = adapter.get_tables()
        return {"tables": tables}
    return {"tables": [], "error": f"Unsupported source_type: {source_type}"}


@router.get("/tables/{table}/columns")
def get_table_columns(
    table: str,
    source_type: str = Query("sqlite"),
    db: Session = Depends(get_db),
):
    if source_type == "sqlite":
        from sqlalchemy import text
        result = db.execute(text(f"PRAGMA table_info({table})"))
        columns = [row[1] for row in result]
        return {"columns": columns}
    return {"columns": [], "error": f"Unsupported source_type: {source_type}"}
