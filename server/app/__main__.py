from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import insert
from datetime import datetime

from app.internal.data import DOCUMENT_1, DOCUMENT_2
from app.internal.db import Base, SessionLocal, engine

import app.models as models

# Import controllers
from app.controllers import patent_entity_controller, document_controller, websocket_controller


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create the database tables
    Base.metadata.create_all(bind=engine)
    # Insert seed data
    with SessionLocal() as db:
        db.execute(insert(models.PatentEntity).values(id=1, name="Wireless optogenetic device for remotely controlling neural activitiies"))
        db.execute(insert(models.PatentEntity).values(id=2, name="Microfluidic Device for Blood Oxygenation"))
        db.execute(insert(models.Document).values(id=1, patent_entity_id=1, content=DOCUMENT_1, created_at=datetime.utcnow()))
        db.execute(insert(models.Document).values(id=2, patent_entity_id=2, content=DOCUMENT_2, created_at=datetime.utcnow()))
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

# Include routers
app.include_router(patent_entity_controller.router)
app.include_router(document_controller.router)
app.include_router(websocket_controller.router)
