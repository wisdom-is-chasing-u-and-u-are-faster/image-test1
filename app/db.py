"""Database connection and initialization module for Digital Savings Account Opening Platform."""

import os
import sqlite3
from typing import Optional, List, Dict, Any

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "digital_banking.db")


def get_db_path() -> str:
    """Returns database file path from environment or default."""
    db_url = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    if db_url.startswith("sqlite:///"):
        return db_url.replace("sqlite:///", "")
    return DEFAULT_DB_PATH


def get_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    """Returns an active SQLite database connection with row factory."""
    target_path = db_path or get_db_path()
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Optional[str] = None) -> None:
    """Initializes the database schema and default seeds."""
    target_path = db_path or get_db_path()
    base_dir = os.path.dirname(os.path.dirname(__file__))
    schema_file = os.path.join(base_dir, "db", "schema.sql")
    seed_file = os.path.join(base_dir, "db", "seed.sql")

    conn = get_connection(target_path)
    try:
        with conn:
            if os.path.exists(schema_file):
                with open(schema_file, "r", encoding="utf-8") as f:
                    conn.executescript(f.read())
            if os.path.exists(seed_file):
                with open(seed_file, "r", encoding="utf-8") as f:
                    conn.executescript(f.read())
    finally:
        conn.close()


def query_all(query: str, params: tuple = (), db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Helper to execute SELECT query and return list of dictionaries."""
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def query_one(query: str, params: tuple = (), db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Helper to execute SELECT query and return a single row dictionary."""
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def execute_sql(query: str, params: tuple = (), db_path: Optional[str] = None) -> int:
    """Helper to execute INSERT/UPDATE/DELETE statement."""
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.rowcount
    finally:
        conn.close()
