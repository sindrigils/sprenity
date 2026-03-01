import asyncio
import os
import signal
import struct
import termios
from contextlib import suppress
from pathlib import Path

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect

from app.core.deps import DBDependency, TmuxDependency
from app.db.repositories import agents as agents_repo
from app.db.repositories import sessions as sessions_repo
from app.schemas.domain import Agent
from app.schemas.requests import CreateAgentRequest, UpdateAgentRequest

router = APIRouter(prefix="/api/agents", tags=["agents"])

_DEV_TERMINAL_PREFIX = "sprenity-dev-"


def _dev_session_name(agent_id: str) -> str:
    return f"{_DEV_TERMINAL_PREFIX}{agent_id}"


@router.get("")
async def list_agents(db: DBDependency) -> list[Agent]:
    return await agents_repo.list_agents(db)


@router.post("", status_code=201)
async def create_agent(body: CreateAgentRequest, db: DBDependency) -> Agent:
    agent = Agent(
        name=body.name,
        model=body.model,
        character_model=body.character_model,
    )
    return await agents_repo.add_agent(db, agent)


@router.get("/{agent_id}")
async def get_agent(agent_id: str, db: DBDependency) -> Agent:
    agent = await agents_repo.get_agent(db, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}")
async def update_agent(
    agent_id: str,
    body: UpdateAgentRequest,
    db: DBDependency,
) -> Agent:
    if not await agents_repo.get_agent(db, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")

    updated = await agents_repo.update_agent(
        db,
        agent_id,
        **body.model_dump(exclude_none=True),
    )
    assert updated is not None
    return updated


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(agent_id: str, db: DBDependency, tmux: TmuxDependency) -> None:
    if not await agents_repo.get_agent(db, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")

    for session in await sessions_repo.get_sessions_for_agent(db, agent_id):
        tmux.kill_session(session.tmux_session_name)
        await sessions_repo.delete_session(db, session.id)

    await agents_repo.delete_agent(db, agent_id)


@router.post("/{agent_id}/terminal/open")
async def open_agent_terminal(
    agent_id: str,
    db: DBDependency,
    tmux: TmuxDependency,
) -> dict[str, str]:
    if not await agents_repo.get_agent(db, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")

    session_name = _dev_session_name(agent_id)
    if tmux.session_exists(session_name):
        tmux.kill_session(session_name)

    tmux.create_session(
        session_name=session_name,
        working_dir=str(Path.cwd()),
    )
    return {"session_name": session_name}


@router.websocket("/{agent_id}/terminal/ws")
async def stream_agent_terminal(
    agent_id: str,
    websocket: WebSocket,
    db: DBDependency,
    tmux: TmuxDependency,
) -> None:
    if not await agents_repo.get_agent(db, agent_id):
        await websocket.close(code=4404, reason="Agent not found")
        return

    session_name = _dev_session_name(agent_id)
    if not tmux.session_exists(session_name):
        await websocket.close(code=4404, reason="Terminal session not found")
        return

    await websocket.accept()

    master_fd, slave_fd = os.openpty()
    process: asyncio.subprocess.Process | None = None
    try:
        env = dict(os.environ)
        env.pop("TMUX", None)
        env.setdefault("TERM", "xterm-256color")
        process = await asyncio.create_subprocess_exec(
            tmux.tmux_bin,
            "attach-session",
            "-t",
            session_name,
            stdin=slave_fd,
            stdout=slave_fd,
            stderr=slave_fd,
            env=env,
        )
    except Exception:
        with suppress(Exception):
            os.close(master_fd)
        with suppress(Exception):
            os.close(slave_fd)
        await websocket.close(code=1011, reason="Failed to attach tmux stream")
        return
    finally:
        with suppress(Exception):
            os.close(slave_fd)

    def set_pty_size(cols: int, rows: int) -> None:
        # Tell the tmux client PTY its new terminal dimensions.
        packed = struct.pack("HHHH", rows, cols, 0, 0)
        fcntl_request = termios.TIOCSWINSZ
        with suppress(OSError):
            import fcntl

            fcntl.ioctl(master_fd, fcntl_request, packed)

    write_lock = asyncio.Lock()

    async def write_pty(data: str) -> None:
        if not data:
            return
        payload = data.encode("utf-8", errors="replace")
        async with write_lock:
            await asyncio.to_thread(os.write, master_fd, payload)

    async def read_pty_output() -> None:
        while True:
            chunk = await asyncio.to_thread(os.read, master_fd, 4096)
            if not chunk:
                break
            await websocket.send_json(
                {"type": "output", "data": chunk.decode("utf-8", errors="replace")}
            )

    async def read_client_input() -> None:
        while True:
            message = await websocket.receive_json()
            if not isinstance(message, dict):
                continue

            msg_type = message.get("type")
            if msg_type == "input":
                data = message.get("data")
                if isinstance(data, str) and data:
                    await write_pty(data)
                continue

            if msg_type == "resize":
                cols = message.get("cols")
                rows = message.get("rows")
                if not isinstance(cols, int) or not isinstance(rows, int):
                    continue
                if cols < 2 or rows < 2:
                    continue

                set_pty_size(cols=cols, rows=rows)
                if process.returncode is None:
                    with suppress(ProcessLookupError):
                        process.send_signal(signal.SIGWINCH)

    output_task = asyncio.create_task(read_pty_output())
    input_task = asyncio.create_task(read_client_input())
    try:
        done, pending = await asyncio.wait(
            {output_task, input_task},
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in pending:
            task.cancel()
        for task in pending:
            with suppress(asyncio.CancelledError):
                await task
        for task in done:
            with suppress(WebSocketDisconnect, asyncio.CancelledError):
                task.result()
    except WebSocketDisconnect:
        pass
    finally:
        with suppress(Exception):
            os.close(master_fd)
        if process.returncode is None:
            with suppress(ProcessLookupError):
                process.terminate()
            with suppress(asyncio.TimeoutError):
                await asyncio.wait_for(process.wait(), timeout=0.25)
            if process.returncode is None:
                with suppress(ProcessLookupError):
                    process.kill()
                with suppress(Exception):
                    await process.wait()


@router.delete("/{agent_id}/terminal", status_code=204)
async def close_agent_terminal(
    agent_id: str,
    db: DBDependency,
    tmux: TmuxDependency,
) -> None:
    if not await agents_repo.get_agent(db, agent_id):
        raise HTTPException(status_code=404, detail="Agent not found")

    session_name = _dev_session_name(agent_id)
    if tmux.session_exists(session_name):
        tmux.kill_session(session_name)
