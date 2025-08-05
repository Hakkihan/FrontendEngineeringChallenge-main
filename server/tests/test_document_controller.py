import pytest
from fastapi import status
from sqlalchemy.orm import Session

import app.models as models


class TestDocumentController:
    """Comprehensive tests for document controller endpoints"""

    def test_get_all_documents_empty(self, client):
        """Test getting all documents when none exist"""
        response = client.get("/document/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == []

    def test_get_all_documents_with_data(self, client):
        """Test getting all documents when some exist"""
        # Create documents
        doc1 = client.post("/document/", json={"content": "Document 1", "patent_entity_id": 1}).json()
        doc2 = client.post("/document/", json={"content": "Document 2", "patent_entity_id": 1}).json()

        response = client.get("/document/")
        assert response.status_code == status.HTTP_200_OK
        documents = response.json()
        assert len(documents) == 2
        # Should be ordered by desc (latest first)
        assert documents[0]["content"] == "Document 2"
        assert documents[1]["content"] == "Document 1"

    def test_get_document_success(self, client):
        """Test getting a specific document by ID"""
        created = client.post("/document/", json={"content": "Test Document", "patent_entity_id": 1}).json()

        response = client.get(f"/document/{created['id']}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["content"] == "Test Document"
        assert data["patent_entity_id"] == 1

    def test_get_document_not_found(self, client):
        """Test getting a document that doesn't exist"""
        response = client.get("/document/999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json()["detail"] == "Document not found"

    def test_create_document_success(self, client):
        """Test creating a new document"""
        document_data = {
            "content": "New Document Content",
            "patent_entity_id": 1
        }

        response = client.post("/document/", json=document_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["content"] == "New Document Content"
        assert data["patent_entity_id"] == 1
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_document_invalid_patent_entity(self, client):
        """Test creating a document with non-existent patent entity"""
        document_data = {
            "content": "New Document Content",
            "patent_entity_id": 999
        }

        response = client.post("/document/", json=document_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "PatentEntity with id 999 does not exist" in response.json()["detail"]

    def test_create_document_missing_content(self, client):
        """Test creating a document with missing content"""
        document_data = {
            "patent_entity_id": 1
        }

        response = client.post("/document/", json=document_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_document_missing_patent_entity_id(self, client):
        """Test creating a document with missing patent_entity_id"""
        document_data = {
            "content": "Test content"
        }

        response = client.post("/document/", json=document_data)
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_create_new_document_version_success(self, client):
        """Test creating a new document version for a patent"""
        document_data = {
            "content": "New Version Content",
            "patent_entity_id": 1
        }

        response = client.post("/document/patent/1/new-version", json=document_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["content"] == "New Version Content"
        assert data["patent_entity_id"] == 1

    def test_create_new_document_version_patent_not_found(self, client):
        """Test creating document version for non-existent patent"""
        document_data = {
            "content": "New Version Content",
            "patent_entity_id": 999
        }

        response = client.post("/document/patent/999/new-version", json=document_data)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "PatentEntity with id 999 does not exist" in response.json()["detail"]

    def test_save_document_success(self, client):
        """Test saving/updating a document"""
        created = client.post("/document/", json={"content": "Original Content", "patent_entity_id": 1}).json()

        update_data = {
            "content": "Updated Content",
            "patent_entity_id": 1
        }

        response = client.post(f"/document/{created['id']}/save", json=update_data)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["content"] == "Updated Content"

    def test_save_document_invalid_patent_entity(self, client):
        """Test saving document with invalid patent entity"""
        created = client.post("/document/", json={"content": "Original Content", "patent_entity_id": 1}).json()

        update_data = {
            "content": "Updated Content",
            "patent_entity_id": 999
        }

        response = client.post(f"/document/{created['id']}/save", json=update_data)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "PatentEntity with id 999 does not exist" in response.json()["detail"]

    def test_save_document_not_found(self, client):
        """Test saving a document that doesn't exist"""
        update_data = {
            "content": "Updated Content",
            "patent_entity_id": 1
        }

        response = client.post("/document/999/save", json=update_data)
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_document_success(self, client):
        """Test deleting a document"""
        created = client.post("/document/", json={"content": "Document to Delete", "patent_entity_id": 1}).json()

        response = client.delete(f"/document/{created['id']}")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["message"] == "Document deleted successfully"

        # Verify document is deleted
        get_response = client.get(f"/document/{created['id']}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_document_not_found(self, client):
        """Test deleting a document that doesn't exist"""
        response = client.delete("/document/999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json()["detail"] == "Document not found"

    def test_document_timestamps(self, client):
        """Test that created_at and updated_at are properly set"""
        created = client.post("/document/", json={"content": "Test Document", "patent_entity_id": 1}).json()
        
        assert "created_at" in created
        assert "updated_at" in created
        # For newly created documents, created_at and updated_at should be the same
        # (allowing for microsecond differences by checking they're close)
        from datetime import datetime
        created_time = datetime.fromisoformat(created["created_at"].replace('Z', '+00:00'))
        updated_time = datetime.fromisoformat(created["updated_at"].replace('Z', '+00:00'))
        time_diff = abs((created_time - updated_time).total_seconds())
        assert time_diff < 0.1  # Should be within 0.1 seconds

        # Update the document
        updated = client.post(f"/document/{created['id']}/save", 
                             json={"content": "Updated", "patent_entity_id": 1}).json()
        
        # The updated_at should be different after update
        updated_time_after = datetime.fromisoformat(updated["updated_at"].replace('Z', '+00:00'))
        time_diff_after = abs((updated_time_after - updated_time).total_seconds())
        assert time_diff_after > 0  # Should be different after update
        assert updated["content"] == "Updated"

    def test_document_ordering(self, client):
        """Test that documents are returned in correct order (newest first)"""
        # Create documents with delays to ensure different timestamps
        doc1 = client.post("/document/", json={"content": "First", "patent_entity_id": 1}).json()
        doc2 = client.post("/document/", json={"content": "Second", "patent_entity_id": 1}).json()
        doc3 = client.post("/document/", json={"content": "Third", "patent_entity_id": 1}).json()

        response = client.get("/document/")
        documents = response.json()
        
        # Should be ordered by id desc (newest first)
        assert documents[0]["id"] == doc3["id"]
        assert documents[1]["id"] == doc2["id"]
        assert documents[2]["id"] == doc1["id"]
