from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, Field


class ClaudeModel(StrEnum):
    SONNET = "claude-sonnet"
    OPUS = "claude-opus"
    HAIKU = "claude-haiku"


class CharacterModel(StrEnum):
    BARBARIAN = "Barbarian"
    KNIGHT = "Knight"
    MAGE = "Mage"
    RANGER = "Ranger"
    ROGUE = "Rogue"
    ROGUE_HOODED = "Rogue_Hooded"


class SessionStatus(StrEnum):
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


class GridCell(BaseModel):
    x: int
    z: int


class Agent(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex[:8])
    name: str
    model: ClaudeModel = ClaudeModel.SONNET
    character_model: CharacterModel = CharacterModel.BARBARIAN


class Zone(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex[:8])
    name: str
    start_cell: GridCell
    end_cell: GridCell
    color: str = "#4a90d9"
    project_path: str | None = None


class Session(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex[:8])
    agent_id: str
    zone_id: str
    tmux_session_name: str = ""
    status: SessionStatus = SessionStatus.RUNNING
