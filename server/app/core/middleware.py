import json
import re
from collections.abc import Callable
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

_SNAKE_RE = re.compile(r"_([a-z])")
_CAMEL_RE = re.compile(r"[A-Z]")


def _to_camel(key: str) -> str:
    return _SNAKE_RE.sub(lambda m: m.group(1).upper(), key)


def _to_snake(key: str) -> str:
    return _CAMEL_RE.sub(lambda m: "_" + m.group(0).lower(), key)


def _convert_keys(obj: Any, fn: Callable[[str], str]) -> Any:
    if isinstance(obj, dict):
        return {fn(k): _convert_keys(v, fn) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_keys(item, fn) for item in obj]
    return obj


class CamelSnakeMiddleware(BaseHTTPMiddleware):
    """Convert incoming camelCase JSON keys to snake_case,
    and outgoing snake_case JSON keys to camelCase."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.body()
            if body:
                data = json.loads(body)
                converted = _convert_keys(data, _to_snake)
                new_body = json.dumps(converted).encode()

                async def receive():
                    return {"type": "http.request", "body": new_body}

                request._receive = receive

        response = await call_next(request)

        resp_content_type = response.headers.get("content-type", "")
        if "application/json" in resp_content_type:
            chunks: list[bytes] = []
            async for chunk in response.body_iterator:  # ty: ignore
                if isinstance(chunk, str):
                    chunks.append(chunk.encode())
                else:
                    chunks.append(chunk)
            raw = b"".join(chunks)
            if raw:
                data = json.loads(raw)
                converted = _convert_keys(data, _to_camel)
                new_body = json.dumps(converted).encode()
                headers = {
                    k: v
                    for k, v in response.headers.items()
                    if k.lower() != "content-length"
                }
                return Response(
                    content=new_body,
                    status_code=response.status_code,
                    headers=headers,
                    media_type="application/json",
                )

        return response
