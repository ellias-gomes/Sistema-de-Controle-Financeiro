from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..database import get_db
from ..models import Transaction, Category
from ..services.statement_parser import process_statement_file

router = APIRouter(prefix="/import", tags=["import"])

class TransactionImportItem(BaseModel):
    date: str
    description: str
    amount: float
    type: str  # 'INCOME' | 'EXPENSE'
    sub_type: str = "REGULAR"
    category_id: int | None = None
    payment_method: str = "PIX"
    notes: str | None = None

class ImportConfirmRequest(BaseModel):
    transactions: List[TransactionImportItem]

@router.post("/parse")
async def parse_statement(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Receives an .ofx or .csv bank statement file, parses all transactions,
    suggests categories via keyword mapping, and flags duplicates.
    """
    filename = file.filename or "statement.csv"
    file_bytes = await file.read()
    
    if not file_bytes:
        raise HTTPException(status_code=400, detail="O arquivo enviado está vazio.")
        
    try:
        transactions = process_statement_file(file_bytes, filename, db)
        return {
            "filename": filename,
            "total_found": len(transactions),
            "transactions": transactions
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar extrato: {str(e)}")

@router.post("/confirm")
def confirm_import(
    payload: ImportConfirmRequest,
    db: Session = Depends(get_db)
):
    """
    Saves confirmed transactions into the database in batch.
    """
    if not payload.transactions:
        raise HTTPException(status_code=400, detail="Nenhuma transação selecionada para importação.")
        
    created_count = 0
    try:
        for item in payload.transactions:
            tx = Transaction(
                date=item.date,
                description=item.description,
                amount=item.amount,
                type=item.type,
                sub_type=item.sub_type or "REGULAR",
                category_id=item.category_id,
                payment_method=item.payment_method or "PIX",
                notes=item.notes or "Importado via Extrato Bancário"
            )
            db.add(tx)
            created_count += 1
            
        db.commit()
        return {
            "status": "success",
            "imported_count": created_count,
            "message": f"{created_count} transações importadas com sucesso!"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao salvar transações: {str(e)}")
