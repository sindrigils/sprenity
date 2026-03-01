import asyncio
from contextlib import suppress

_DEFAULT_TIMEOUT = 5.0


class TmuxService:
    def __init__(self, tmux_bin: str) -> None:
        self.tmux_bin = tmux_bin

    async def _run(
        self, *args: str, _timeout: float = _DEFAULT_TIMEOUT
    ) -> tuple[bytes, bytes, int]:
        proc = await asyncio.create_subprocess_exec(
            self.tmux_bin,
            *args,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(), timeout=_timeout
            )
        except TimeoutError:
            proc.kill()
            with suppress(TimeoutError):
                await asyncio.wait_for(proc.wait(), timeout=2)
            raise
        return stdout, stderr, proc.returncode or 0

    async def session_exists(self, session_name: str) -> bool:
        try:
            _, _, rc = await self._run("has-session", "-t", session_name)
        except TimeoutError:
            return False
        return rc == 0

    async def create_session(
        self,
        session_name: str,
        working_dir: str,
        command: str | None = None,
    ) -> None:
        cmd = ["new-session", "-d", "-s", session_name, "-c", working_dir]
        if command:
            cmd.append(command)

        _, stderr, rc = await self._run(*cmd)
        if rc != 0:
            raise RuntimeError(
                f"Failed to create tmux session '{session_name}': {stderr.decode()}"
            )

    async def kill_session(self, session_name: str) -> None:
        with suppress(TimeoutError):
            await self._run("kill-session", "-t", session_name)

    async def capture_output(
        self,
        session_name: str,
        lines: int | None = 50,
        *,
        preserve_trailing: bool = False,
    ) -> str:
        cmd = ["capture-pane", "-t", session_name, "-p"]
        if preserve_trailing:
            cmd.append("-N")
        if lines is not None:
            cmd.extend(["-S", str(-lines)])

        try:
            stdout, _, rc = await self._run(*cmd)
        except TimeoutError:
            return ""
        return stdout.decode() if rc == 0 else ""

    async def send_keys(
        self, session_name: str, keys: str, *, literal: bool = False
    ) -> None:
        cmd = ["send-keys", "-t", session_name]
        if literal:
            cmd.append("-l")
        cmd.append(keys)

        _, stderr, rc = await self._run(*cmd)
        if rc != 0:
            raise RuntimeError(
                f"Failed to send keys to tmux session '{session_name}': {stderr.decode()}"
            )

    async def list_sessions(self) -> list[str]:
        try:
            stdout, _, rc = await self._run("list-sessions", "-F", "#{session_name}")
        except TimeoutError:
            return []
        if rc != 0:
            return []

        return [
            line
            for line in stdout.decode().strip().splitlines()
            if line.startswith("sprenity-")
        ]
