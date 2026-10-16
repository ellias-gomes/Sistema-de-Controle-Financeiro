from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=schemas.DashboardOverview)
def get_overview(
    month: Optional[str] = Query(None, description="Target month in YYYY-MM format, defaults to current month"),
    db: Session = Depends(get_db)
):
    return crud.get_dashboard_overview(db, target_month=month)
