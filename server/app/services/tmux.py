import subprocess


class TmuxService:
    def __init__(self, tmux_bin: str) -> None:
        self.tmux_bin = tmux_bin

    def session_exists(self, session_name: str) -> bool:
        result = subprocess.run(
            [self.tmux_bin, "has-session", "-t", session_name],
            capture_output=True,
        )
        return result.returncode == 0

    def create_session(
        self,
        session_name: str,
        working_dir: str,
        command: str | None = None,
    ) -> None:
        cmd = [
            self.tmux_bin,
            "new-session",
            "-d",
            "-s",
            session_name,
            "-c",
            working_dir,
        ]
        if command:
            cmd.append(command)

        subprocess.run(
            cmd,
            check=True,
            capture_output=True,
        )

    def kill_session(self, session_name: str) -> None:
        subprocess.run(
            [self.tmux_bin, "kill-session", "-t", session_name],
            capture_output=True,
        )

    def capture_output(
        self,
        session_name: str,
        lines: int | None = 50,
        *,
        preserve_trailing: bool = False,
    ) -> str:
        cmd = [
            self.tmux_bin,
            "capture-pane",
            "-t",
            session_name,
            "-p",
        ]
        if preserve_trailing:
            cmd.append("-N")
        if lines is not None:
            cmd.extend(["-S", str(-lines)])

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
        )
        return result.stdout if result.returncode == 0 else ""

    def send_keys(self, session_name: str, keys: str, *, literal: bool = False) -> None:
        cmd = [self.tmux_bin, "send-keys", "-t", session_name]
        if literal:
            cmd.append("-l")
        cmd.append(keys)

        subprocess.run(
            cmd,
            check=True,
            capture_output=True,
        )

    def list_sessions(self) -> list[str]:
        result = subprocess.run(
            [self.tmux_bin, "list-sessions", "-F", "#{session_name}"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            return []

        return [
            line
            for line in result.stdout.strip().splitlines()
            if line.startswith("sprenity-")
        ]
