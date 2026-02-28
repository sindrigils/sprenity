from fastapi import APIRouter, status

from app.core.deps import DBDependency
from app.e2e.bootstrap import reseed_e2e_data

router = APIRouter(prefix="/api/e2e", tags=["e2e"])


@router.post("/bootstrap", status_code=status.HTTP_204_NO_CONTENT)
async def bootstrap_e2e(db: DBDependency) -> None:
    await reseed_e2e_data(db)
