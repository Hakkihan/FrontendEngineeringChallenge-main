from contextlib import asynccontextmanager
import re

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import insert, select, update
from sqlalchemy.orm import Session

from app.internal.ai import AI, get_ai
from app.internal.data import DOCUMENT_1, DOCUMENT_2
from app.internal.db import Base, SessionLocal, engine, get_db

import app.models as models
import app.schemas as schemas


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    # Insert seed data
    with SessionLocal() as db:
        db.execute(insert(models.PatentEntity).values(id=1, name="Wireless optogenetic device for remotely controlling neural activitiies"))
        db.execute(insert(models.PatentEntity).values(id=2, name="Microfluidic Device for Blood Oxygenation"))
        db.execute(insert(models.Document).values(id=1, patent_entity_id=1 , content=DOCUMENT_1))
        db.execute(insert(models.Document).values(id=2, patent_entity_id=2, content=DOCUMENT_2))
        db.commit()
    yield


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/document/{document_id}")
def get_document(
    document_id: int, db: Session = Depends(get_db)
) -> schemas.DocumentRead:
    """Get a document from the database"""
    return db.scalar(select(models.Document).where(models.Document.id == document_id))




@app.post("/entity", response_model=schemas.EntityWithDocument)
def create_patent_entity(
    patent_entity: schemas.PatentEntityBase,
    db: Session = Depends(get_db)
):
    """Create a new PatentEntity in the database"""
    new_entity = models.PatentEntity(name=patent_entity.name)
    
    db.add(new_entity)
    db.flush()
    #   create blank document associated with the new patent entity
    new_document = models.Document(patent_entity_id = new_entity.id, content="Placeholder content")
    db.add(new_document)
    db.commit()
    db.refresh(new_entity)
    db.refresh(new_document)

    return {
        "entity": new_entity,
        "document": new_document 
    }
    


@app.post("/save/{document_id}")
def save(
    document_id: int, 
    document: schemas.DocumentBase,
    db: Session = Depends(get_db)
):
    entity = db.get(models.PatentEntity, document.patent_entity_id)
    if(entity) is None:
        raise HTTPException(
            status_code=400,
            detail=f"PatentEntity with id {document.patent_entity_id} does not exist"
        )

    """Save the document to the database"""
    db.execute(
        update(models.Document)
        .where(models.Document.id == document_id)
        .values(content=document.content, 
                patent_entity_id = document.patent_entity_id
            )
    )
    db.commit();
    return {
        "document_id": document_id,
        "content": document.content,
        "patent_entity_id": document.patent_entity_id
    }



async def get_suggestions(
    document: str,
    ai: AI
) -> schemas.Suggestions:
    """ Get AI suggestions for the passed document. """
    ai_response = ""
    async for chunk in ai.review_document(document):
        if chunk is None:
            break
        ai_response += chunk
    return schemas.Suggestions.model_validate_json(ai_response)


@app.websocket("/ws")
async def websocket(websocket: WebSocket, ai: AI = Depends(get_ai)):
    await websocket.accept()
    while True:
        try:
            request = await websocket.receive_text()
            parsed_request = schemas.SuggestionsRequest.parse_raw(request)
            html_text = re.sub(r'<[^>]*>', '', parsed_request.content)
            suggestions = await get_suggestions(html_text, ai)
            await websocket.send_json(schemas.SuggestionsResponse(
                suggestions=suggestions,
                request_id=parsed_request.request_id
            ).model_dump())
        except WebSocketDisconnect:
            break
        except Exception as e:
            print(f"Error occurred: {e}")
            continue
