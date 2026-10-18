from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
from ..database import get_db
from ..models import Category, Transaction, CategoryBudget
from ..schemas import CategoryBudgetCreate, CategoryBudgetOut, BudgetOverview, BudgetCategoryProgress

router = APIRouter(prefix="/budgets", tags=["budgets"])

@router.get("/summary", response_model=BudgetOverview)
def get_budgets_summary(
    month: Optional[str] = Query(None, description="Format YYYY-MM"),
    db: Session = Depends(get_db)
):
    if not month:
        now = datetime.now()
        month = f"{now.year}-{str(now.month).zfill(2)}"

    # Load all expense categories
    categories = db.query(Category).filter(Category.type == "EXPENSE").order_by(Category.name).all()

    # Query all expense transactions for the given month
    txs = db.query(Transaction).filter(
        Transaction.date.startswith(month),
        Transaction.type == "EXPENSE"
    ).all()

    # Sum spent amount per category
    spent_by_category = {}
    for tx in txs:
        cat_id = tx.category_id or 0
        spent_by_category[cat_id] = spent_by_category.get(cat_id, 0.0) + tx.amount

    items = []
    total_budgeted = 0.0
    total_spent_budgeted = 0.0
    categories_with_budget = 0
    categories_exceeded = 0
    categories_warning = 0

    for cat in categories:
        limit = cat.budget.monthly_limit if cat.budget else 0.0
        spent = round(spent_by_category.get(cat.id, 0.0), 2)
        has_budget = limit > 0

        if has_budget:
            total_budgeted += limit
            total_spent_budgeted += spent
            categories_with_budget += 1
            remaining = round(limit - spent, 2)
            pct = round((spent / limit) * 100, 1)

            if spent >= limit:
                status = "exceeded"
                categories_exceeded += 1
            elif spent >= 0.8 * limit:
                status = "warning"
                categories_warning += 1
            else:
                status = "ok"
        else:
            remaining = 0.0
            pct = 0.0
            status = "no_budget"

        items.append(BudgetCategoryProgress(
            category_id=cat.id,
            category_name=cat.name,
            category_type=cat.type,
            color=cat.color or "#6366F1",
            icon=cat.icon or "Tag",
            is_essential=bool(cat.is_essential),
            monthly_limit=limit,
            current_spent=spent,
            remaining_amount=remaining,
            percentage_used=pct,
            status=status,
            is_budget_set=has_budget
        ))

    # Sort: categories with budget first, ordered by percentage_used descending
    items.sort(key=lambda x: (not x.is_budget_set, -x.percentage_used, x.category_name))

    total_remaining_budgeted = round(total_budgeted - total_spent_budgeted, 2)
    overall_percentage = round((total_spent_budgeted / total_budgeted * 100), 1) if total_budgeted > 0 else 0.0

    return BudgetOverview(
        month=month,
        total_budgeted=round(total_budgeted, 2),
        total_spent_budgeted=round(total_spent_budgeted, 2),
        total_remaining_budgeted=total_remaining_budgeted,
        overall_percentage=overall_percentage,
        categories_with_budget=categories_with_budget,
        categories_exceeded=categories_exceeded,
        categories_warning=categories_warning,
        items=items
    )

@router.post("/", response_model=CategoryBudgetOut)
def set_category_budget(
    budget_in: CategoryBudgetCreate,
    db: Session = Depends(get_db)
):
    cat = db.query(Category).filter(Category.id == budget_in.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoria não encontrada.")
    if cat.type != "EXPENSE":
        raise HTTPException(status_code=400, detail="Limites de orçamento só podem ser aplicados a categorias de DESPESA.")

    existing = db.query(CategoryBudget).filter(CategoryBudget.category_id == budget_in.category_id).first()
    if existing:
        existing.monthly_limit = budget_in.monthly_limit
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        new_budget = CategoryBudget(
            category_id=budget_in.category_id,
            monthly_limit=budget_in.monthly_limit
        )
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        return new_budget

@router.delete("/{category_id}", status_code=204)
def delete_category_budget(
    category_id: int,
    db: Session = Depends(get_db)
):
    existing = db.query(CategoryBudget).filter(CategoryBudget.category_id == category_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Orçamento não encontrado para esta categoria.")
    db.delete(existing)
    db.commit()
    return None
