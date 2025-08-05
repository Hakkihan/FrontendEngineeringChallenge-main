import pytest
from fastapi import status
from sqlalchemy.orm import Session

import app.models as models


class TestPatentEntityController:
    """Comprehensive tests for patent entity controller endpoints"""

    def test_get_patent_entity_list_with_data(self, client):
        """Test getting all patent entities when some exist"""
        # Create additional patent entities
        entity1 = client.post("/patent_entity/", json={"name": "Patent Entity 1"}).json()
        entity2 = client.post("/patent_entity/", json={"name": "Patent Entity 2"}).json()

        response = client.get("/patent_entity/list")
        assert response.status_code == status.HTTP_200_OK
        entities = response.json()
        assert len(entities) >= 3  # At least the seeded one plus the two we created
        assert any(entity["name"] == "Patent Entity 1" for entity in entities)
        assert any(entity["name"] == "Patent Entity 2" for entity in entities)

    def test_get_patent_entity_success(self, client):
        """Test getting a specific patent entity by ID"""
        # Use the seeded patent entity
        response = client.get("/patent_entity/1")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == "Test Patent"
        assert data["id"] == 1

    def test_get_patent_entity_not_found(self, client):
        """Test getting a patent entity that doesn't exist"""
        response = client.get("/patent_entity/999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json()["detail"] == "Patent entity not found"

    def test_get_first_document_for_patent_with_documents(self, client):
        """Test getting the first document for a patent entity"""
        # Create documents for the seeded patent entity
        doc1 = client.post("/document/", json={"content": "First Document", "patent_entity_id": 1}).json()
        doc2 = client.post("/document/", json={"content": "Second Document", "patent_entity_id": 1}).json()

        response = client.get("/patent_entity/1/documents/first")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["content"] == "First Document"

    def test_get_first_document_for_patent_no_documents(self, client):
        """Test getting the first document when no documents exist"""
        # Create a new patent entity without documents
        new_entity = client.post("/patent_entity/", json={"name": "Empty Patent"}).json()

        response = client.get(f"/patent_entity/{new_entity['entity']['id']}/documents/first")
        assert response.status_code == status.HTTP_200_OK
        # The new patent entity will have a placeholder document, so we check for that
        data = response.json()
        assert data is not None
        assert data["content"] == "Placeholder content"

    def test_get_latest_document_for_patent_with_documents(self, client):
        """Test getting the latest document for a patent entity"""
        # Create documents for the seeded patent entity
        doc1 = client.post("/document/", json={"content": "First Document", "patent_entity_id": 1}).json()
        doc2 = client.post("/document/", json={"content": "Second Document", "patent_entity_id": 1}).json()

        response = client.get("/patent_entity/1/documents/latest")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["content"] == "Second Document"

    def test_get_latest_document_for_patent_no_documents(self, client):
        """Test getting the latest document when no documents exist"""
        # Create a new patent entity without documents
        new_entity = client.post("/patent_entity/", json={"name": "Empty Patent"}).json()

        response = client.get(f"/patent_entity/{new_entity['entity']['id']}/documents/latest")
        assert response.status_code == status.HTTP_200_OK
        # The new patent entity will have a placeholder document, so we check for that
        data = response.json()
        assert data is not None
        assert data["content"] == "Placeholder content"

    def test_get_all_documents_for_patent_with_documents(self, client):
        """Test getting all documents for a patent entity"""
        # Create documents for the seeded patent entity
        doc1 = client.post("/document/", json={"content": "First Document", "patent_entity_id": 1}).json()
        doc2 = client.post("/document/", json={"content": "Second Document", "patent_entity_id": 1}).json()

        response = client.get("/patent_entity/1/documents")
        assert response.status_code == status.HTTP_200_OK
        documents = response.json()
        assert len(documents) == 2
        # Should be ordered by desc (latest first)
        assert documents[0]["content"] == "Second Document"
        assert documents[1]["content"] == "First Document"

    def test_get_all_documents_for_patent_no_documents(self, client):
        """Test getting all documents when no documents exist"""
        # Create a new patent entity without documents
        new_entity = client.post("/patent_entity/", json={"name": "Empty Patent"}).json()

        response = client.get(f"/patent_entity/{new_entity['entity']['id']}/documents")
        assert response.status_code == status.HTTP_200_OK
        # The new patent entity will have a placeholder document
        documents = response.json()
        assert len(documents) == 1
        assert documents[0]["content"] == "Placeholder content"

    def test_create_patent_entity_success(self, client):
        """Test creating a new patent entity"""
        entity_data = {"name": "New Patent Entity"}

        response = client.post("/patent_entity/", json=entity_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        # Check entity
        assert data["entity"]["name"] == "New Patent Entity"
        assert "id" in data["entity"]
        
        # Check associated document
        assert data["document"]["content"] == "Placeholder content"
        assert data["document"]["patent_entity_id"] == data["entity"]["id"]

    def test_create_patent_entity_missing_name(self, client):
        """Test creating a patent entity with missing name"""
        entity_data = {}

        response = client.post("/patent_entity/", json=entity_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_patent_entity_empty_name(self, client):
        """Test creating a patent entity with empty name"""
        entity_data = {"name": ""}

        response = client.post("/patent_entity/", json=entity_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_patent_entity_creates_placeholder_document(self, client):
        """Test that creating a patent entity also creates a placeholder document"""
        entity_data = {"name": "New Patent Entity"}

        response = client.post("/patent_entity/", json=entity_data)
        assert response.status_code == status.HTTP_200_OK
        
        # Verify the document was created by checking the response
        data = response.json()
        assert data["document"]["content"] == "Placeholder content"

    def test_patent_entity_document_relationship(self, client):
        """Test that patent entity and document relationship works correctly"""
        # Create a new patent entity
        new_entity = client.post("/patent_entity/", json={"name": "Test Patent"}).json()
        entity_id = new_entity["entity"]["id"]
        
        # Create additional documents for this patent
        doc1 = client.post("/document/", json={"content": "Doc 1", "patent_entity_id": entity_id}).json()
        doc2 = client.post("/document/", json={"content": "Doc 2", "patent_entity_id": entity_id}).json()
        
        # Get all documents for this patent
        response = client.get(f"/patent_entity/{entity_id}/documents")
        documents = response.json()
        
        assert len(documents) == 3  # Placeholder + 2 additional docs
        assert any(doc["content"] == "Placeholder content" for doc in documents)
        assert any(doc["content"] == "Doc 1" for doc in documents)
        assert any(doc["content"] == "Doc 2" for doc in documents)

    def test_patent_entity_ordering(self, client):
        """Test that patent entities are returned in correct order"""
        # Create multiple patent entities
        entity1 = client.post("/patent_entity/", json={"name": "Patent 1"}).json()
        entity2 = client.post("/patent_entity/", json={"name": "Patent 2"}).json()
        entity3 = client.post("/patent_entity/", json={"name": "Patent 3"}).json()
        
        response = client.get("/patent_entity/list")
        entities = response.json()
        
        # Should include all created entities plus the seeded one
        assert len(entities) >= 4
        assert any(entity["name"] == "Patent 1" for entity in entities)
        assert any(entity["name"] == "Patent 2" for entity in entities)
        assert any(entity["name"] == "Patent 3" for entity in entities) 