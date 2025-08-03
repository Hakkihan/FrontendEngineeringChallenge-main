from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import insert, select
from sqlalchemy.orm import Session

from app.internal.db import get_db
import app.models as models
import app.schemas as schemas

router = APIRouter(prefix="/patent_entity", tags=["patent_entity"])


@router.get("/list", response_model=List[schemas.PatentEntityRead])
def get_patent_entity_list(db: Session = Depends(get_db)):
    """Get all patent entities"""
    stmt = select(models.PatentEntity)
    result = db.execute(stmt)
    items = result.scalars().all()
    return items


@router.get("/{patent_id}", response_model=schemas.PatentEntityRead)
def get_patent_entity(patent_id: int, db: Session = Depends(get_db)):
    """Get a specific patent entity by ID"""
    patent = db.scalar(select(models.PatentEntity).where(models.PatentEntity.id == patent_id))
    if patent is None:
        raise HTTPException(status_code=404, detail="Patent entity not found")
    return patent


@router.get("/{patent_id}/documents/first", response_model=Optional[schemas.DocumentRead])
def get_first_document_for_patent(
    patent_id: int,
    db: Session = Depends(get_db)
):
    """Get the first document for a given patent entity"""
    stmt = (
        select(models.Document)
        .where(models.Document.patent_entity_id == patent_id)
        .order_by(models.Document.id.asc())
        .limit(1)
    )
    doc = db.scalars(stmt).first()
    return doc


@router.get("/{patent_id}/documents/latest", response_model=Optional[schemas.DocumentRead])
def get_latest_document_for_patent(
    patent_id: int,
    db: Session = Depends(get_db)
):
    """Get the latest document for a given patent entity"""
    stmt = (
        select(models.Document)
        .where(models.Document.patent_entity_id == patent_id)
        .order_by(models.Document.id.desc())
        .limit(1)
    )
    doc = db.scalars(stmt).first()
    return doc


@router.get("/{patent_id}/documents", response_model=List[schemas.DocumentRead])
def get_all_documents_for_patent(
    patent_id: int,
    db: Session = Depends(get_db)
):
    """Get all documents for a given patent entity"""
    stmt = (
        select(models.Document)
        .where(models.Document.patent_entity_id == patent_id)
        .order_by(models.Document.id.desc())
    )
    docs = db.scalars(stmt).all()
    return docs


@router.post("/", response_model=schemas.EntityWithDocument)
def create_patent_entity(
    patent_entity: schemas.PatentEntityBase,
    db: Session = Depends(get_db)
):
    """Create a new PatentEntity in the database"""
    new_entity = models.PatentEntity(name=patent_entity.name)
    
    db.add(new_entity)
    db.flush()
    # Create blank document associated with the new patent entity
    new_document = models.Document(patent_entity_id=new_entity.id, content="Placeholder content")
    db.add(new_document)
    db.commit()
    db.refresh(new_entity)
    db.refresh(new_document)

    return {
        "entity": new_entity,
        "document": new_document 
    } 