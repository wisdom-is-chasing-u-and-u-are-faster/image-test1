"""Unit tests for Database Tier (DDL Schema and Seed Integration)."""

import os
import tempfile
import pytest
from app.db import init_db, get_connection, query_all, query_one, execute_sql


@pytest.fixture
def temp_db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    init_db(path)
    yield path
    if os.path.exists(path):
        os.remove(path)


def test_init_db_creates_tables_and_seeds(temp_db):
    """Verifies that init_db creates all required tables and seeds baseline records."""
    conn = get_connection(temp_db)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    conn.close()

    assert "customer_application" in tables
    assert "verification_audit_log" in tables
    assert "compliance_decision" in tables

    # Verify seed data
    apps = query_all("SELECT * FROM customer_application", db_path=temp_db)
    assert len(apps) >= 3


def test_query_one_and_execute_sql(temp_db):
    """Verifies query_one and execute_sql functions."""
    row = query_one("SELECT * FROM customer_application WHERE id = ?", ("app-seed-001",), db_path=temp_db)
    assert row is not None
    assert row["full_name"] == "Alex Rivera"
    assert row["status"] == "APPROVED"
    assert row["cif_number"] == "CIF-100293"

    # Insert a new record
    execute_sql(
        "INSERT INTO customer_application (id, full_name, email, ssn_masked, ssn_hash) VALUES (?, ?, ?, ?, ?)",
        ("test-id-123", "Test User", "test@example.com", "******999", "testhash"),
        db_path=temp_db
    )
    inserted = query_one("SELECT * FROM customer_application WHERE id = ?", ("test-id-123",), db_path=temp_db)
    assert inserted is not None
    assert inserted["full_name"] == "Test User"
