# Test Suite

This directory contains comprehensive tests for the FastAPI server controllers.

## Test Structure

- `conftest.py` - Pytest configuration and fixtures
- `test_document_controller.py` - Tests for document endpoints
- `test_patent_entity_controller.py` - Tests for patent entity endpoints  
- `test_websocket_controller.py` - Basic tests for websocket endpoints

## Running Tests

### Option 1: Using pytest directly
```bash
cd server
pytest -v tests/
```
python -m pytest -v for windows

### Option 2: Using the test runner script
```bash
cd server
python run_tests.py
```

### Option 3: Running specific test files
```bash
cd server
pytest -v tests/test_document_controller.py
pytest -v tests/test_patent_entity_controller.py
```

## Test Features

- **In-memory SQLite database** for fast, isolated tests
- **Automatic cleanup** between tests
- **Comprehensive coverage** of all controller endpoints
- **Error case testing** for 404, 400, etc.
- **Data validation** testing

## Test Coverage

### Document Controller Tests
- ✅ Get all documents (empty and with data)
- ✅ Get specific document by ID
- ✅ Create new document
- ✅ Create document version for patent
- ✅ Save/update document
- ✅ Delete document
- ✅ Error handling for invalid IDs
- ✅ Missing field validation
- ✅ Timestamp validation
- ✅ Document ordering

### Patent Entity Controller Tests
- ✅ Get all patent entities
- ✅ Get specific patent entity by ID
- ✅ Get first document for patent
- ✅ Get latest document for patent
- ✅ Get all documents for patent
- ✅ Create new patent entity
- ✅ Error handling for invalid IDs
- ✅ Missing field validation
- ✅ Patent-entity relationship testing
- ✅ Document ordering within patents

### WebSocket Controller Tests
- ✅ Basic endpoint existence test
- ✅ Function importability test
- ✅ Router configuration test
- ✅ Timeout constant validation
- ✅ Dependency injection testing
- ✅ Async function validation
- ✅ Schema import testing
- ✅ Error handling structure validation

## Windows Compatibility

The tests are designed to work on Windows:
- Uses SQLite in-memory database (no file system dependencies)
- Compatible with Windows path separators
- Test runner script for easy execution

## Adding New Tests

To add tests for new endpoints:

1. Create a new test file: `test_new_controller.py`
2. Import the necessary fixtures from `conftest.py`
3. Use the `client` fixture for HTTP requests
4. Use the `db_session` fixture for database operations
5. Follow the existing test patterns

Example:
```python
def test_new_endpoint(client, db_session):
    # Setup test data
    # Make request
    response = client.get("/new-endpoint/")
    # Assert results
    assert response.status_code == 200
``` 