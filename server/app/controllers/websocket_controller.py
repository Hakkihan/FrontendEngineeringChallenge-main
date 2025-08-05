# import re
# from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
# from sqlalchemy.orm import Session

# from app.internal.ai import AI, get_ai
# from app.internal.db import get_db
# import app.schemas as schemas

# router = APIRouter(tags=["websocket"])


# async def get_suggestions(
#     document: str,
#     ai: AI
# ) -> schemas.Suggestions:
#     """Get AI suggestions for the passed document."""
#     ai_response = ""
#     async for chunk in ai.review_document(document):
#         if chunk is None:
#             break
#         ai_response += chunk
#     return schemas.Suggestions.model_validate_json(ai_response)


# @router.websocket("/ws")
# async def websocket(websocket: WebSocket, ai: AI = Depends(get_ai)):
#     """WebSocket endpoint for AI suggestions"""
#     await websocket.accept()
#     while True:
#         try:
#             request = await websocket.receive_text()
#             parsed_request = schemas.SuggestionsRequest.parse_raw(request)
#             html_text = re.sub(r'<[^>]*>', '', parsed_request.content)
#             suggestions = await get_suggestions(html_text, ai)
#             await websocket.send_json(schemas.SuggestionsResponse(
#                 suggestions=suggestions,
#                 request_id=parsed_request.request_id
#             ).model_dump())
#         except WebSocketDisconnect:
#             break
#         except Exception as e:
#             print(f"Error occurred: {e}")
#             continue 


import re
import asyncio
from contextlib import suppress
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from sqlalchemy.orm import Session  # (unused here, but kept if you need it)
from app.internal.ai import AI, get_ai
from app.internal.db import get_db  # (unused here)
import app.schemas as schemas

router = APIRouter(tags=["websocket"])

TIMEOUT_SECONDS = 10.0  # server-side cap per request

async def collect_ai_review(document: str, ai: AI) -> str:
    """Collect streaming AI review into a single JSON string."""
    chunks = []
    async for chunk in ai.review_document(document):
        if chunk is None:
            break
        chunks.append(chunk)
    return "".join(chunks)

@router.websocket("/ws")
async def websocket(websocket: WebSocket, ai: AI = Depends(get_ai)):
    """WebSocket endpoint for AI suggestions with server-side timeout & cancellation."""
    await websocket.accept()
    try:
        while True:
            try:
                request_text = await websocket.receive_text()
                parsed_request = schemas.SuggestionsRequest.parse_raw(request_text)

                # Optional: strip any HTML tags from the editor (as you had)
                html_text = re.sub(r"<[^>]*>", "", parsed_request.content)

                # Start AI work as a cancellable task
                ai_task = asyncio.create_task(collect_ai_review(html_text, ai))

                try:
                    # Enforce 5s cap
                    ai_response = await asyncio.wait_for(ai_task, timeout=TIMEOUT_SECONDS)
                    suggestions = schemas.Suggestions.model_validate_json(ai_response)

                    await websocket.send_json(
                        schemas.SuggestionsResponse(
                            suggestions=suggestions,
                            request_id=parsed_request.request_id,
                        ).model_dump()
                    )

                except asyncio.TimeoutError:
                    # Stop the work; avoid leaks
                    ai_task.cancel()
                    with suppress(asyncio.CancelledError):
                        await ai_task

                    # Send a structured "timeout" suggestion (adjust to your schema/UX)
                    timeout_issue = schemas.SuggestionIssue(
                        type="Timeout",
                        severity="high",
                        paragraph=0,
                        description=f"Analysis exceeded {int(TIMEOUT_SECONDS)} seconds.",
                        suggestion="Try again, shorten the text, or make another edit.",
                    )
                    await websocket.send_json(
                        schemas.SuggestionsResponse(
                            suggestions=schemas.Suggestions(issues=[timeout_issue]),
                            request_id=parsed_request.request_id,
                        ).model_dump()
                    )

            except WebSocketDisconnect:
                break
            except Exception as e:
                # Log and continue loop; optionally send an error-shaped suggestion
                print(f"Error occurred: {e}")
                continue
    finally:
        # Nothing special here; FastAPI will close the socket context
        pass
