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

    def create_session(self, session_name: str, working_dir: str, command: str) -> None:
        subprocess.run(
            [
                self.tmux_bin,
                "new-session",
                "-d",
                "-s",
                session_name,
                "-c",
                working_dir,
                command,
            ],
            check=True,
            capture_output=True,
        )

    def kill_session(self, session_name: str) -> None:
        subprocess.run(
            [self.tmux_bin, "kill-session", "-t", session_name],
            capture_output=True,
        )

    def capture_output(self, session_name: str, lines: int = 50) -> str:
        result = subprocess.run(
            [
                self.tmux_bin,
                "capture-pane",
                "-t",
                session_name,
                "-p",
                "-S",
                str(-lines),
            ],
            capture_output=True,
            text=True,
        )
        return result.stdout if result.returncode == 0 else ""

    def send_keys(self, session_name: str, keys: str) -> None:
        subprocess.run(
            [self.tmux_bin, "send-keys", "-t", session_name, keys],
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
