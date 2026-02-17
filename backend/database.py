"""
SQLite database connection setup for BizMatch.
This demonstrates the pattern that will be used with Snowflake in production.
"""

import sqlite3
from contextlib import contextmanager
from typing import Generator

DATABASE_PATH = "bizmatch.db"


def get_connection() -> sqlite3.Connection:
    """Get a database connection."""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Return rows as dictionaries
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for database connections."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    """Initialize database schema."""
    conn = get_connection()
    cursor = conn.cursor()

    # Configs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            source_table TEXT NOT NULL,
            column_mapping TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Runs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            config_id INTEGER NOT NULL,
            status TEXT NOT NULL,
            input_count INTEGER DEFAULT 0,
            matched_count INTEGER DEFAULT 0,
            match_rate REAL DEFAULT 0.0,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (config_id) REFERENCES configs(id)
        )
    """)

    # Match results table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS match_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id INTEGER NOT NULL,
            client_id TEXT NOT NULL,
            business_name TEXT NOT NULL,
            input_zip TEXT,
            matched_efx_business TEXT,
            efx_id TEXT,
            confidence_score INTEGER DEFAULT 0,
            match_reason TEXT,
            FOREIGN KEY (run_id) REFERENCES runs(id)
        )
    """)

    # Reference businesses table (mock EFX data)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reference_businesses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            business_name TEXT NOT NULL,
            address TEXT,
            city TEXT,
            state TEXT,
            zip TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()
