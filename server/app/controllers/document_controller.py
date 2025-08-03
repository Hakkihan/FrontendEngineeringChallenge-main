from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update, insert
from sqlalchemy.orm import Session

from app.internal.db import get_db
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/document", tags=["document"])


@router.get("/", response_model=List[schemas.DocumentRead])
def get_all_documents(db: Session = Depends(get_db)):
    """Get all documents"""
    stmt = select(models.Document).order_by(models.Document.id.desc())
    docs = db.scalars(stmt).all()
    return docs


@router.get("/{document_id}", response_model=schemas.DocumentRead)
def get_document(document_id: int, db: Session = Depends(get_db)):
    """Get a specific document by ID"""
    doc = db.scalar(select(models.Document).where(models.Document.id == document_id))
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.post("/", response_model=schemas.DocumentRead)
def create_document(
    document: schemas.DocumentBase,
    db: Session = Depends(get_db)
):
    """Create a new document"""
    # Verify the patent entity exists
    entity = db.get(models.PatentEntity, document.patent_entity_id)
    if entity is None:
        raise HTTPException(
            status_code=400,
            detail=f"PatentEntity with id {document.patent_entity_id} does not exist"
        )
    
    new_document = models.Document(
        content=document.content,
        patent_entity_id=document.patent_entity_id
    )
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    return new_document


@router.post("/patent/{patent_id}/new-version", response_model=schemas.DocumentRead)
def create_new_document_version(
    patent_id: int,
    document: schemas.DocumentBase,
    db: Session = Depends(get_db)
):
    """Create a new document version for a specific patent"""
    # Verify the patent entity exists
    entity = db.get(models.PatentEntity, patent_id)
    if entity is None:
        raise HTTPException(
            status_code=404,
            detail=f"PatentEntity with id {patent_id} does not exist"
        )
    
    # Create new document with the provided content
    new_document = models.Document(
        content=document.content,
        patent_entity_id=patent_id
    )
    db.add(new_document)
    db.commit()
    db.refresh(new_document)
    return new_document


@router.post("/{document_id}/save")
def save_document(
    document_id: int, 
    document: schemas.DocumentBase,
    db: Session = Depends(get_db)
):
    """Save/update a document"""
    entity = db.get(models.PatentEntity, document.patent_entity_id)
    if entity is None:
        raise HTTPException(
            status_code=400,
            detail=f"PatentEntity with id {document.patent_entity_id} does not exist"
        )

    db.execute(
        update(models.Document)
        .where(models.Document.id == document_id)
        .values(
            content=document.content, 
            patent_entity_id=document.patent_entity_id
        )
    )
    db.commit()
    updated = db.scalar(select(models.Document).where(models.Document.id == document_id))
    return updated


@router.delete("/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    """Delete a document"""
    doc = db.scalar(select(models.Document).where(models.Document.id == document_id))
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"} 