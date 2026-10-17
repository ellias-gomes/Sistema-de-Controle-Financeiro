from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from typing import Optional, List, Dict, Any
from . import models, schemas

# ==========================================
# CATEGORIES CRUD
# ==========================================

def get_category(db: Session, category_id: int):
    return db.query(models.Category).filter(models.Category.id == category_id).first()

def get_category_by_name(db: Session, name: str):
    return db.query(models.Category).filter(func.lower(models.Category.name) == func.lower(name)).first()

def get_categories(db: Session, type: Optional[str] = None):
    query = db.query(models.Category)
    if type:
        query = query.filter(models.Category.type == type.upper())
    return query.order_by(models.Category.name.asc()).all()

def create_category(db: Session, category: schemas.CategoryCreate):
    db_cat = models.Category(
        name=category.name.strip(),
        type=category.type.upper(),
        color=category.color,
        icon=category.icon,
        is_essential=category.is_essential
    )
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def update_category(db: Session, category_id: int, category_data: schemas.CategoryUpdate):
    db_cat = get_category(db, category_id)
    if not db_cat:
        return None
    data = category_data.model_dump(exclude_unset=True)
    if "type" in data and data["type"]:
        data["type"] = data["type"].upper()
    if "name" in data and data["name"]:
        data["name"] = data["name"].strip()
    for key, value in data.items():
        setattr(db_cat, key, value)
    db.commit()
    db.refresh(db_cat)
    return db_cat

def delete_category(db: Session, category_id: int):
    db_cat = get_category(db, category_id)
    if not db_cat:
        return False
    db.delete(db_cat)
    db.commit()
    return True


# ==========================================
# TRANSACTIONS CRUD
# ==========================================

def get_transaction(db: Session, transaction_id: int):
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()

def get_transactions(
    db: Session,
    month: Optional[str] = None, # YYYY-MM
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    type: Optional[str] = None,
    sub_type: Optional[str] = None,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    query = db.query(models.Transaction)

    if month:
        query = query.filter(models.Transaction.date.startswith(month))
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
    if type:
        query = query.filter(models.Transaction.type == type.upper())
    if sub_type:
        query = query.filter(models.Transaction.sub_type == sub_type.upper())
    if category_id:
        query = query.filter(models.Transaction.category_id == category_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Transaction.description.ilike(search_filter),
                models.Transaction.notes.ilike(search_filter)
            )
        )

    return query.order_by(desc(models.Transaction.date), desc(models.Transaction.id)).offset(offset).limit(limit).all()

def create_transaction(db: Session, tx: schemas.TransactionCreate):
    db_tx = models.Transaction(
        description=tx.description.strip(),
        amount=round(float(tx.amount), 2),
        date=tx.date,
        type=tx.type.upper(),
        sub_type=tx.sub_type.upper() if tx.sub_type else "REGULAR",
        category_id=tx.category_id,
        payment_method=tx.payment_method or "PIX",
        notes=tx.notes
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def update_transaction(db: Session, tx_id: int, tx_data: schemas.TransactionUpdate):
    db_tx = get_transaction(db, tx_id)
    if not db_tx:
        return None
    data = tx_data.model_dump(exclude_unset=True)
    if "type" in data and data["type"]:
        data["type"] = data["type"].upper()
    if "sub_type" in data and data["sub_type"]:
        data["sub_type"] = data["sub_type"].upper()
    if "amount" in data and data["amount"] is not None:
        data["amount"] = round(float(data["amount"]), 2)
    if "description" in data and data["description"]:
        data["description"] = data["description"].strip()

    for key, value in data.items():
        setattr(db_tx, key, value)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def delete_transaction(db: Session, tx_id: int):
    db_tx = get_transaction(db, tx_id)
    if not db_tx:
        return False
    db.delete(db_tx)
    db.commit()
    return True


# ==========================================
# DASHBOARD CALCULATIONS
# ==========================================

def get_dashboard_overview(db: Session, target_month: Optional[str] = None) -> schemas.DashboardOverview:
    today = date.today()
    if not target_month:
        target_month = today.strftime("%Y-%m")

    # 1. Total Balance all time
    all_income = db.query(func.coalesce(func.sum(models.Transaction.amount), 0.0))\
        .filter(models.Transaction.type == "INCOME").scalar()
    all_expense = db.query(func.coalesce(func.sum(models.Transaction.amount), 0.0))\
        .filter(models.Transaction.type == "EXPENSE").scalar()
    total_balance = round(float(all_income) - float(all_expense), 2)

    # 2. Month Income and breakdown
    month_income_txs = db.query(models.Transaction)\
        .filter(models.Transaction.type == "INCOME", models.Transaction.date.startswith(target_month))\
        .all()
    month_income = sum(t.amount for t in month_income_txs)

    income_breakdown = schemas.IncomeBreakdown(
        salary=round(sum(t.amount for t in month_income_txs if t.sub_type == "SALARY"), 2),
        advance=round(sum(t.amount for t in month_income_txs if t.sub_type == "ADVANCE"), 2),
        extra=round(sum(t.amount for t in month_income_txs if t.sub_type == "EXTRA"), 2),
        regular=round(sum(t.amount for t in month_income_txs if t.sub_type == "REGULAR"), 2)
    )

    # 3. Month Expense and breakdown
    month_expense_txs = db.query(models.Transaction)\
        .outerjoin(models.Category, models.Transaction.category_id == models.Category.id)\
        .filter(models.Transaction.type == "EXPENSE", models.Transaction.date.startswith(target_month))\
        .all()
    month_expense = sum(t.amount for t in month_expense_txs)

    essential_expense_total = sum(
        t.amount for t in month_expense_txs if t.category and t.category.is_essential
    )
    lifestyle_expense_total = month_expense - essential_expense_total

    # 4. Month Net & Savings Rate
    month_net = round(month_income - month_expense, 2)
    savings_rate = round((month_net / month_income * 100), 1) if month_income > 0 else 0.0

    # 5. Category Breakdown for current month
    cat_totals: Dict[Any, Dict[str, Any]] = {}
    for t in month_expense_txs:
        cat_id = t.category_id
        cat_name = t.category.name if t.category else "Sem Categoria"
        color = t.category.color if t.category else "#94A3B8"
        is_ess = t.category.is_essential if t.category else False

        if cat_name not in cat_totals:
            cat_totals[cat_name] = {
                "category_id": cat_id,
                "category_name": cat_name,
                "color": color,
                "total_amount": 0.0,
                "is_essential": is_ess
            }
        cat_totals[cat_name]["total_amount"] += t.amount

    categories_breakdown = []
    for item in sorted(cat_totals.values(), key=lambda x: x["total_amount"], reverse=True):
        pct = round((item["total_amount"] / month_expense * 100), 1) if month_expense > 0 else 0.0
        categories_breakdown.append(schemas.CategoryExpenseSummary(
            category_id=item["category_id"],
            category_name=item["category_name"],
            color=item["color"],
            total_amount=round(item["total_amount"], 2),
            percentage=pct,
            is_essential=item["is_essential"]
        ))

    # 6. Monthly Trend (last 6 months up to target_month)
    try:
        curr_year, curr_m = map(int, target_month.split("-"))
        ref_date = date(curr_year, curr_m, 1)
    except Exception:
        ref_date = date.today().replace(day=1)

    monthly_trend = []
    for i in range(5, -1, -1):
        m_date = ref_date - relativedelta(months=i)
        m_str = m_date.strftime("%Y-%m")

        txs = db.query(models.Transaction).filter(models.Transaction.date.startswith(m_str)).all()
        inc = sum(t.amount for t in txs if t.type == "INCOME")
        exp = sum(t.amount for t in txs if t.type == "EXPENSE")
        sal = sum(t.amount for t in txs if t.type == "INCOME" and t.sub_type == "SALARY")
        adv = sum(t.amount for t in txs if t.type == "INCOME" and t.sub_type == "ADVANCE")
        ext = sum(t.amount for t in txs if t.type == "INCOME" and t.sub_type == "EXTRA")

        monthly_trend.append(schemas.MonthlySummaryItem(
            month=m_str,
            income=round(inc, 2),
            expense=round(exp, 2),
            net=round(inc - exp, 2),
            salary=round(sal, 2),
            advance=round(adv, 2),
            extra=round(ext, 2)
        ))

    # 7. Recent transactions (last 8)
    recent_transactions = db.query(models.Transaction)\
        .order_by(desc(models.Transaction.date), desc(models.Transaction.id))\
        .limit(8)\
        .all()

    return schemas.DashboardOverview(
        current_month=target_month,
        total_balance=total_balance,
        month_income=round(month_income, 2),
        month_expense=round(month_expense, 2),
        month_net=month_net,
        savings_rate=savings_rate,
        income_breakdown=income_breakdown,
        essential_expense_total=round(essential_expense_total, 2),
        lifestyle_expense_total=round(lifestyle_expense_total, 2),
        categories_breakdown=categories_breakdown,
        monthly_trend=monthly_trend,
        recent_transactions=recent_transactions
    )


# ==========================================
# INFLATION & PROJECTION ENGINE
# ==========================================

def calculate_inflation_projection(
    db: Session,
    request: schemas.InflationProjectionRequest
) -> schemas.InflationProjectionResponse:
    today = date.today()
    annual_rate = request.annual_rate
    months_ahead = request.months_ahead

    # Effective monthly inflation rate compound: (1 + i_annual)^(1/12) - 1
    if annual_rate > 0:
        monthly_effective_rate = ((1.0 + (annual_rate / 100.0)) ** (1.0 / 12.0)) - 1.0
    else:
        monthly_effective_rate = 0.0

    # 1. Query distinct months with expenses available
    distinct_months = [
        row[0] for row in db.query(func.distinct(func.substr(models.Transaction.date, 1, 7)))
        .filter(models.Transaction.type == "EXPENSE")
        .order_by(desc(func.substr(models.Transaction.date, 1, 7)))
        .all()
    ]

    current_month_str = today.strftime("%Y-%m")
    target_months: List[str] = []
    mode = request.baseline_mode or ("latest_month" if request.lookback_months == 1 else "average_months")

    # 2. Determine target months according to baseline_mode
    if request.custom_baseline and request.custom_baseline > 0:
        mode = "custom"
        target_months = []
    elif mode == "selected_month" and request.selected_month:
        target_months = [request.selected_month]
    elif mode == "latest_month" or (request.lookback_months == 1 and mode != "average_months"):
        mode = "latest_month"
        candidates = distinct_months
        if request.exclude_current_month and current_month_str in candidates and len(candidates) > 1:
            candidates = [m for m in candidates if m != current_month_str]
        target_months = [candidates[0]] if candidates else []
    else:  # "average_months"
        mode = "average_months"
        candidates = distinct_months
        if request.exclude_current_month and current_month_str in candidates and len(candidates) > 1:
            candidates = [m for m in candidates if m != current_month_str]
        
        if request.lookback_months == 0:
            target_months = candidates
        else:
            target_months = candidates[:max(1, request.lookback_months)]

    # 3. Aggregate expenses across target_months
    # Calculating monthly sums per category to guarantee that the baseline average is
    # strictly based on the sum of monthly transactions per category (not transaction averages).
    cat_data: Dict[str, Dict[str, Any]] = {}
    monthly_totals: Dict[str, float] = {m: 0.0 for m in target_months}
    total_past_expense = 0.0
    essential_past_expense = 0.0

    num_months = max(1, len(target_months))

    if target_months:
        expense_txs = db.query(models.Transaction)\
            .outerjoin(models.Category, models.Transaction.category_id == models.Category.id)\
            .filter(
                models.Transaction.type == "EXPENSE",
                or_(*[models.Transaction.date.startswith(m) for m in target_months])
            ).all()

        for tx in expense_txs:
            tx_month = tx.date[:7]
            c_name = tx.category.name if tx.category else "Outros Gastos"
            c_color = tx.category.color if tx.category else "#94A3B8"
            c_essential = tx.category.is_essential if tx.category else False

            if c_name not in cat_data:
                cat_data[c_name] = {
                    "name": c_name,
                    "color": c_color,
                    "is_essential": c_essential,
                    "total": 0.0,
                    "monthly_sums": {m: 0.0 for m in target_months}
                }

            if tx_month in cat_data[c_name]["monthly_sums"]:
                cat_data[c_name]["monthly_sums"][tx_month] += tx.amount

            cat_data[c_name]["total"] += tx.amount
            total_past_expense += tx.amount

            if tx_month in monthly_totals:
                monthly_totals[tx_month] += tx.amount

            if c_essential:
                essential_past_expense += tx.amount

        baseline_total_avg = total_past_expense / num_months
        baseline_essential_avg = essential_past_expense / num_months
    elif mode == "custom":
        baseline_total_avg = float(request.custom_baseline or 0.0)
        baseline_essential_avg = float(request.custom_baseline or 0.0)
    else:
        baseline_total_avg = 0.0
        baseline_essential_avg = 0.0

    # Choose effective baseline depending on whether non-essential is included
    if mode == "custom":
        baseline_cost_used = baseline_total_avg
    else:
        baseline_cost_used = baseline_total_avg if request.include_discretionary else baseline_essential_avg

    # 4. Compute monthly compound projections for next N months
    projected_months = []
    total_extra_cost = 0.0

    for m in range(1, months_ahead + 1):
        compound_factor = (1.0 + monthly_effective_rate) ** m
        fut_date = today.replace(day=1) + relativedelta(months=m)
        month_label = fut_date.strftime("%b/%y").capitalize()

        proj_essential = baseline_essential_avg * compound_factor
        proj_total = baseline_total_avg * compound_factor
        
        chosen_baseline = baseline_cost_used
        chosen_projected = proj_total if request.include_discretionary else proj_essential
        extra_this_month = max(0.0, chosen_projected - chosen_baseline)
        total_extra_cost += extra_this_month

        projected_months.append(schemas.ProjectionMonth(
            month_index=m,
            month_label=month_label,
            projected_essential_cost=round(proj_essential, 2),
            projected_total_cost=round(proj_total, 2),
            inflation_impact=round(extra_this_month, 2)
        ))

    # 5. Category breakdown projections based on monthly sums per category
    category_projections = []
    final_compound = (1.0 + monthly_effective_rate) ** months_ahead

    for cat in cat_data.values():
        c_avg = cat["total"] / num_months
        c_final = c_avg * final_compound
        c_increase = c_final - c_avg
        c_pct = round(((final_compound - 1.0) * 100), 2)

        category_projections.append(schemas.CategoryProjection(
            category_name=cat["name"],
            color=cat["color"],
            is_essential=cat["is_essential"],
            baseline_average=round(c_avg, 2),
            projected_final_cost=round(c_final, 2),
            increase_amount=round(c_increase, 2),
            increase_percentage=c_pct,
            total_period_amount=round(cat["total"], 2),
            monthly_sums={m: round(v, 2) for m, v in cat["monthly_sums"].items()}
        ))

    category_projections.sort(key=lambda x: x.baseline_average, reverse=True)

    return schemas.InflationProjectionResponse(
        annual_rate=annual_rate,
        monthly_effective_rate=round(monthly_effective_rate * 100, 4),
        lookback_months=request.lookback_months,
        months_ahead=months_ahead,
        baseline_mode=mode,
        baseline_essential_avg=round(baseline_essential_avg, 2),
        baseline_total_avg=round(baseline_total_avg, 2),
        baseline_cost_used=round(baseline_cost_used, 2),
        months_analyzed=target_months if target_months else ([f"Manual (R$ {request.custom_baseline})"] if mode == "custom" else []),
        months_count=len(target_months),
        monthly_totals={m: round(v, 2) for m, v in monthly_totals.items()} if monthly_totals else {},
        projected_months=projected_months,
        categories_projections=category_projections,
        total_extra_cost_period=round(total_extra_cost, 2)
    )
