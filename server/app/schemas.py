from pydantic import BaseModel, ConfigDict, Field
from typing import Literal
from datetime import datetime


class DocumentBase(BaseModel):
    content: str
    patent_entity_id: int 


class DocumentRead(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class DocumentUpdate(BaseModel):
    documentId: int
    content: str
    patent_entity_id: int


class DocumentBase(BaseModel):
    content: str
    patent_entity_id: int 


class DocumentRead(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime

from pydantic import BaseModel

class DocumentUpdate(BaseModel):
    documentId: int
    content: str
    patent_entity_id: int


class PatentEntityBase(BaseModel):
    name: str = Field(..., min_length=1, description="Patent entity name cannot be empty")

class PatentEntityRead(PatentEntityBase):
    id: int

    class Config:
        orm_mode = True

class EntityWithDocument(BaseModel):
    entity: PatentEntityRead
    document: DocumentRead


class SuggestionIssue(BaseModel):
    type: str
    severity: Literal["high", "medium", "low"]
    paragraph: int
    description: str
    suggestion: str


class Suggestions(BaseModel):
    issues: list[SuggestionIssue]


class SuggestionsRequest(BaseModel):
    content: str
    request_id: int


class SuggestionsResponse(BaseModel):
    suggestions: Suggestions
    request_id: int