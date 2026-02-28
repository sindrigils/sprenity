from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class AgentModel(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    model: Mapped[str] = mapped_column(String, nullable=False, default="claude-sonnet")
    character_model: Mapped[str] = mapped_column(
        String, nullable=False, default="Barbarian"
    )


class ZoneModel(Base):
    __tablename__ = "zones"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    start_cell_x: Mapped[int] = mapped_column(nullable=False)
    start_cell_z: Mapped[int] = mapped_column(nullable=False)
    end_cell_x: Mapped[int] = mapped_column(nullable=False)
    end_cell_z: Mapped[int] = mapped_column(nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False, default="#4a90d9")
    project_path: Mapped[str | None] = mapped_column(String, nullable=True)


class SessionModel(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    agent_id: Mapped[str] = mapped_column(
        String, ForeignKey("agents.id"), nullable=False
    )
    zone_id: Mapped[str] = mapped_column(String, ForeignKey("zones.id"), nullable=False)
    tmux_session_name: Mapped[str] = mapped_column(String, nullable=False, default="")
    status: Mapped[str] = mapped_column(String, nullable=False, default="running")
