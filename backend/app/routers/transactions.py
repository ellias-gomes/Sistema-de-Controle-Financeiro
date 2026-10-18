from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import schemas, crud
from ..database import get_db

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[schemas.TransactionOut])
def list_transactions(
    month: Optional[str] = Query(None, description="Filter by YYYY-MM"),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
    type: Optional[str] = Query(None, description="Filter by INCOME or EXPENSE"),
    sub_type: Optional[str] = Query(None, description="Filter by SALARY, ADVANCE, EXTRA, REGULAR"),
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search description or notes"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return crud.get_transactions(
        db=db,
        month=month,
        start_date=start_date,
        end_date=end_date,
        type=type,
        sub_type=sub_type,
        category_id=category_id,
        search=search,
        limit=limit,
        offset=offset
    )

@router.delete("/clear/all", status_code=status.HTTP_200_OK)
def clear_all_transactions(db: Session = Depends(get_db)):
    """Deletes all transactions to allow starting with a clean/empty database."""
    count = crud.clear_all_transactions(db)
    return {"message": f"{count} transações removidas com sucesso", "count": count}

@router.get("/{tx_id}", response_model=schemas.TransactionOut)
def read_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = crud.get_transaction(db, tx_id)
    if not tx:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return tx

@router.post("/", response_model=schemas.TransactionOut, status_code=status.HTTP_201_CREATED)
def create_transaction(tx: schemas.TransactionCreate, db: Session = Depends(get_db)):
    if tx.category_id:
        cat = crud.get_category(db, tx.category_id)
        if not cat:
            raise HTTPException(status_code=400, detail="Categoria informada não existe")
    return crud.create_transaction(db, tx)

@router.put("/{tx_id}", response_model=schemas.TransactionOut)
def update_transaction(tx_id: int, tx_data: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    if tx_data.category_id:
        cat = crud.get_category(db, tx_data.category_id)
        if not cat:
            raise HTTPException(status_code=400, detail="Categoria informada não existe")
    updated = crud.update_transaction(db, tx_id, tx_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return updated

@router.delete("/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    success = crud.delete_transaction(db, tx_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transação não encontrada")
    return None
