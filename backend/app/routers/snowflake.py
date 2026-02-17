"""Snowflake connection API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.adapters.snowflake_adapter import SnowflakeAdapter

router = APIRouter(prefix="/api/v1/snowflake", tags=["snowflake"])


class SnowflakeConnectionTest(BaseModel):
    account: str
    user: str
    password: str
    warehouse: str
    database: str
    schema_name: str = "PUBLIC"


@router.post("/test-connection")
def test_connection(data: SnowflakeConnectionTest):
    adapter = SnowflakeAdapter(
        account=data.account,
        user=data.user,
        password=data.password,
        warehouse=data.warehouse,
        database=data.database,
        schema=data.schema_name,
    )
    result = adapter.test_connection()
    return result


@router.get("/tables")
def get_tables():
    return {"tables": [], "message": "Snowflake adapter not yet implemented"}


@router.get("/preview/{table}")
def preview_table(table: str, limit: int = 10):
    return {"data": [], "message": "Snowflake adapter not yet implemented"}
