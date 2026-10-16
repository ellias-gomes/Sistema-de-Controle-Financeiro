from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/projections", tags=["Projections"])

@router.post("/inflation", response_model=schemas.InflationProjectionResponse)
def project_inflation_post(
    request: schemas.InflationProjectionRequest,
    db: Session = Depends(get_db)
):
    """
    Calculates cost of living projections based on historical essential expenses
    and projected compound inflation for the requested number of months ahead.
    """
    return crud.calculate_inflation_projection(db, request)

@router.get("/inflation", response_model=schemas.InflationProjectionResponse)
def project_inflation_get(
    annual_rate: float = Query(4.5, ge=0, le=100, description="Annual inflation rate in percentage, e.g. 4.5"),
    months_ahead: int = Query(12, ge=1, le=60, description="Number of months to project ahead"),
    lookback_months: int = Query(3, ge=1, le=24, description="Lookback months to calculate average baseline expenses"),
    include_discretionary: bool = Query(True, description="Whether to include non-essential expenses in total cost"),
    db: Session = Depends(get_db)
):
    request = schemas.InflationProjectionRequest(
        annual_rate=annual_rate,
        months_ahead=months_ahead,
        lookback_months=lookback_months,
        include_discretionary=include_discretionary
    )
    return crud.calculate_inflation_projection(db, request)
