from typing import Optional
from sqlalchemy.orm import Session
from app.adapters.base import DataSourceAdapter
from app.models.reference_business import ReferenceBusiness

class SQLiteAdapter(DataSourceAdapter):
    def __init__(self, db: Session):
        self.db = db

    def test_connection(self) -> dict:
        try:
            self.db.execute("SELECT 1")
            return {"success": True, "message": "Connected to SQLite database"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    def get_tables(self) -> list[str]:
        from sqlalchemy import text
        result = self.db.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        return [row[0] for row in result]

    def preview_data(self, table: str, limit: int = 10) -> list[dict]:
        from sqlalchemy import text
        result = self.db.execute(text(f"SELECT * FROM {table} LIMIT :limit"), {"limit": limit})
        columns = result.keys()
        return [dict(zip(columns, row)) for row in result]

    def fetch_table_data(self, table: str) -> list[dict]:
        from sqlalchemy import text
        result = self.db.execute(text(f"SELECT * FROM {table}"))
        columns = result.keys()
        return [dict(zip(columns, row)) for row in result]

    def fetch_reference_data(self, filters: Optional[dict] = None, limit: Optional[int] = None) -> list[dict]:
        query = self.db.query(ReferenceBusiness)
        if filters:
            if "state" in filters:
                query = query.filter(ReferenceBusiness.state == filters["state"])
            if "zip" in filters:
                query = query.filter(ReferenceBusiness.zip == filters["zip"])
        if limit:
            query = query.limit(limit)
        businesses = query.all()
        return [
            {
                "client_id": b.client_id,
                "business_name": b.business_name,
                "normalized_name": b.normalized_name,
                "address": b.address,
                "city": b.city,
                "state": b.state,
                "zip": b.zip,
            }
            for b in businesses
        ]
