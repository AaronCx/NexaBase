"""
Error Logging Middleware

Catches unhandled exceptions, logs them locally, and optionally POSTs
the error payload to a configurable external endpoint (ERROR_LOG_ENDPOINT).
"""

import json
import logging
import traceback
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings

logger = logging.getLogger("nexabase.errors")


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            error_id = str(uuid.uuid4())
            tb = traceback.format_exc()

            error_payload = {
                "error_id": error_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "method": request.method,
                "path": str(request.url.path),
                "query": str(request.url.query),
                "exception_type": type(exc).__name__,
                "exception_message": str(exc),
                "traceback": tb,
                "app": settings.APP_NAME,
            }

            logger.error(
                "Unhandled exception [%s]: %s\n%s",
                error_id,
                exc,
                tb,
            )

            # Fire-and-forget POST to external logging endpoint
            if settings.ERROR_LOG_ENDPOINT:
                await self._post_error(error_payload)

            return JSONResponse(
                status_code=500,
                content={
                    "detail": "Internal server error",
                    "error_id": error_id,
                },
            )

    @staticmethod
    async def _post_error(payload: dict) -> None:
        headers = {"Content-Type": "application/json"}
        if settings.ERROR_LOG_API_KEY:
            headers["Authorization"] = f"Bearer {settings.ERROR_LOG_API_KEY}"

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.post(
                    settings.ERROR_LOG_ENDPOINT,
                    content=json.dumps(payload),
                    headers=headers,
                )
        except Exception as post_exc:
            logger.warning("Failed to POST error to logging endpoint: %s", post_exc)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every request with method, path, status code, and duration."""

    async def dispatch(self, request: Request, call_next) -> Response:
        import time

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "%s %s → %d (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response
