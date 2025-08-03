import re
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.internal.ai import AI, get_ai
from app.internal.db import get_db
import app.schemas as schemas

router = APIRouter(tags=["websocket"])


async def get_suggestions(
    document: str,
    ai: AI
) -> schemas.Suggestions:
    """Get AI suggestions for the passed document."""
    ai_response = ""
    async for chunk in ai.review_document(document):
        if chunk is None:
            break
        ai_response += chunk
    return schemas.Suggestions.model_validate_json(ai_response)


@router.websocket("/ws")
async def websocket(websocket: WebSocket, ai: AI = Depends(get_ai)):
    """WebSocket endpoint for AI suggestions"""
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