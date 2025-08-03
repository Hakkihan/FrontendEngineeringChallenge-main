# API Controllers

This directory contains the refactored API controllers for better organization and maintainability.

## Structure

### Patent Entity Controller (`patent_entity_controller.py`)
Handles all patent entity related operations:

- `GET /patent_entity/list` - Get all patent entities
- `GET /patent_entity/{patent_id}` - Get a specific patent entity
- `GET /patent_entity/{patent_id}/documents/first` - Get the first document for a patent
- `GET /patent_entity/{patent_id}/documents/latest` - Get the latest document for a patent
- `GET /patent_entity/{patent_id}/documents` - Get all documents for a patent
- `POST /patent_entity/` - Create a new patent entity

### Document Controller (`document_controller.py`)
Handles all document related operations:

- `GET /document/` - Get all documents
- `GET /document/{document_id}` - Get a specific document
- `POST /document/` - Create a new document
- `POST /document/{document_id}/save` - Save/update a document
- `DELETE /document/{document_id}` - Delete a document

### WebSocket Controller (`websocket_controller.py`)
Handles WebSocket connections for AI suggestions:

- `WS /ws` - WebSocket endpoint for AI suggestions

## Benefits of Refactoring

1. **Better Organization**: Each controller handles a specific domain
2. **Maintainability**: Easier to find and modify specific functionality
3. **Scalability**: Easy to add new endpoints to specific controllers
4. **Testing**: Controllers can be tested independently
5. **Documentation**: Clear separation of concerns makes API documentation more organized

## Migration Notes

The following endpoint changes were made:
- `/patent_entity_list` → `/patent_entity/list`
- `/patent/{patent_id}/documents/latest` → `/patent_entity/{patent_id}/documents/latest`
- `/save/{document_id}` → `/document/{document_id}/save`
- `/entity` → `/patent_entity/`

The client-side API calls have been updated to match these new endpoints. 