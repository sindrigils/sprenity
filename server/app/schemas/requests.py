from pydantic import BaseModel

from app.schemas.domain import CharacterModel, ClaudeModel, GridCell


class CreateAgentRequest(BaseModel):
    name: str
    model: ClaudeModel = ClaudeModel.SONNET
    character_model: CharacterModel = CharacterModel.BARBARIAN


class UpdateAgentRequest(BaseModel):
    name: str | None = None
    model: ClaudeModel | None = None
    character_model: CharacterModel | None = None


class CreateZoneRequest(BaseModel):
    name: str
    start_cell: GridCell
    end_cell: GridCell
    color: str = "#4a90d9"
    project_path: str | None = None


class UpdateZoneRequest(BaseModel):
    name: str | None = None
    start_cell: GridCell | None = None
    end_cell: GridCell | None = None
    color: str | None = None
    project_path: str | None = None


class AssignAgentRequest(BaseModel):
    agent_id: str
    zone_id: str


class SendKeysRequest(BaseModel):
    keys: str
