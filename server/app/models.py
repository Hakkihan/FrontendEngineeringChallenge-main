from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.internal.db import Base


class Document(Base):
    __tablename__ = "document"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    patent_entity_id = Column(Integer, ForeignKey("patent_entity.id"), nullable=False)
    patent_entity = relationship("PatentEntity", back_populates="documents")


class PatentEntity(Base):
    __tablename__ = "patent_entity"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    documents = relationship("Document", back_populates="patent_entity")
    