from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from app.internal.db import Base


class Document(Base):
    __tablename__ = "document"
    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    #F.K
    patent_entity_id = Column(Integer, ForeignKey("patent_entity.id"), nullable=False)
    patent_entity = relationship("PatentEntity", back_populates="documents")


# Include your models here, and they will automatically be created as tables in the database on start-up
#
#This is the core entity, which will have multiple documents associated with it
class PatentEntity(Base):
    __tablename__ = "patent_entity"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    #relation to Document
    documents = relationship("Document", back_populates="patent_entity")
    