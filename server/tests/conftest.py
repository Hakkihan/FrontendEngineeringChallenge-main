# import pytest
# from fastapi.testclient import TestClient
# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker

# from app.__main__ import app
# from app.internal.db import get_db, Base

# # In-memory test DB
# SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"  # change to "sqlite:///:memory:" for pure memory

# engine = create_engine(
#     SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
# )
# TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # Override the DB dependency
# def override_get_db():
#     db = TestingSessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# @pytest.fixture(scope="session")
# def test_db():
#     # Create the database tables
#     Base.metadata.create_all(bind=engine)
#     yield
#     Base.metadata.drop_all(bind=engine)

# @pytest.fixture()
# def client(test_db):
#     app.dependency_overrides[get_db] = override_get_db
#     return TestClient(app)


# tests/conftest.py
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Disable optional routers (e.g., websocket) that may pull heavy deps like openai
os.environ["DISABLE_WS"] = "1"

from app.__main__ import app  # import after setting env var
from app.internal.db import get_db, Base
import app.models as models

# Use a file-based SQLite DB on Windows for reliability
TEST_DB_URL = "sqlite:///./test_app.db"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    # Create tables once per test session
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(autouse=True)
def _clean_and_seed():
    # Truncate between tests and seed one PatentEntity
    with engine.begin() as conn:
        for tbl in reversed(Base.metadata.sorted_tables):
            conn.exec_driver_sql(f"DELETE FROM {tbl.name}")
    db = TestingSessionLocal()
    try:
        pe = models.PatentEntity(name="Test Patent")
        db.add(pe)
        db.commit()
    finally:
        db.close()

@pytest.fixture()
def client():
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)
