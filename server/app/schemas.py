from pydantic import BaseModel, ConfigDict
from typing import Literal


class DocumentBase(BaseModel):
    content: str
    patent_entity_id: int 


class DocumentRead(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

from pydantic import BaseModel

class DocumentUpdate(BaseModel):
    documentId: int
    content: str
    patent_entity_id: int  # Remove `| None` if it's mandatory


class PatentEntityBase(BaseModel):
    name: str

class PatentEntityRead(PatentEntityBase):
    id: int

    class Config:
        orm_mode = True

class EntityWithDocument(BaseModel):
    entity: PatentEntityRead
    document: DocumentRead

###############################################################################
# Suggestions
###############################################################################

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