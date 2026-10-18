from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime

# --- Categories ---
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., pattern="^(INCOME|EXPENSE)$")
    color: str = Field(default="#6366F1")
    icon: str = Field(default="Tag")
    is_essential: bool = Field(default=False)

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = Field(None, pattern="^(INCOME|EXPENSE)$")
    color: Optional[str] = None
    icon: Optional[str] = None
    is_essential: Optional[bool] = None

class CategoryOut(CategoryBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Transactions ---
class TransactionBase(BaseModel):
    description: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., gt=0)
    date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")  # YYYY-MM-DD
    type: str = Field(..., pattern="^(INCOME|EXPENSE)$")
    sub_type: str = Field(default="REGULAR", pattern="^(REGULAR|SALARY|ADVANCE|EXTRA)$")
    category_id: Optional[int] = None
    payment_method: Optional[str] = "PIX"
    notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[float] = Field(None, gt=0)
    date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    type: Optional[str] = Field(None, pattern="^(INCOME|EXPENSE)$")
    sub_type: Optional[str] = Field(None, pattern="^(REGULAR|SALARY|ADVANCE|EXTRA)$")
    category_id: Optional[int] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class TransactionOut(TransactionBase):
    id: int
    created_at: Optional[datetime] = None
    category: Optional[CategoryOut] = None

    class Config:
        from_attributes = True


# --- Dashboard Schemas ---
class IncomeBreakdown(BaseModel):
    salary: float = 0.0
    advance: float = 0.0
    extra: float = 0.0
    regular: float = 0.0

class CategoryExpenseSummary(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    color: str
    total_amount: float
    percentage: float
    is_essential: bool

class MonthlySummaryItem(BaseModel):
    month: str  # YYYY-MM
    income: float
    expense: float
    net: float
    salary: float
    advance: float
    extra: float

class DashboardOverview(BaseModel):
    current_month: str
    total_balance: float
    month_income: float
    month_expense: float
    month_net: float
    savings_rate: float
    income_breakdown: IncomeBreakdown
    essential_expense_total: float
    lifestyle_expense_total: float
    categories_breakdown: List[CategoryExpenseSummary]
    monthly_trend: List[MonthlySummaryItem]
    recent_transactions: List[TransactionOut]


# --- Inflation Projection Schemas ---
class InflationProjectionRequest(BaseModel):
    annual_rate: float = Field(..., ge=0, le=100, description="Annual inflation rate in percentage, e.g. 4.5")
    months_ahead: int = Field(default=12, ge=1, le=60)
    lookback_months: int = Field(default=3, ge=0, le=60, description="Number of past months to compute baseline average, or 0 for all available history")
    include_discretionary: bool = Field(default=True, description="Whether to project total living cost or only essential categories")
    baseline_mode: Optional[str] = Field(default="average_months", description="latest_month, average_months, or custom")
    selected_month: Optional[str] = None
    custom_baseline: Optional[float] = None
    exclude_current_month: bool = Field(default=False, description="Exclude in-progress current month from historical average")

class ProjectionMonth(BaseModel):
    month_index: int
    month_label: str  # e.g. 'Mês +1', 'Mês +2'
    projected_essential_cost: float
    projected_total_cost: float
    inflation_impact: float

class CategoryProjection(BaseModel):
    category_name: str
    color: str
    is_essential: bool
    baseline_average: float
    projected_final_cost: float
    increase_amount: float
    increase_percentage: float
    total_period_amount: Optional[float] = None
    monthly_sums: Optional[Dict[str, float]] = None

class InflationProjectionResponse(BaseModel):
    annual_rate: float
    monthly_effective_rate: float
    lookback_months: int
    months_ahead: int
    baseline_mode: str
    baseline_essential_avg: float
    baseline_total_avg: float
    baseline_cost_used: float
    months_analyzed: List[str]
    months_count: int = 1
    monthly_totals: Optional[Dict[str, float]] = None
    projected_months: List[ProjectionMonth]
    categories_projections: List[CategoryProjection]
    total_extra_cost_period: float


# --- Budgeting Schemas ---
class CategoryBudgetBase(BaseModel):
    category_id: int
    monthly_limit: float = Field(..., gt=0, description="Monthly spending limit in BRL")

class CategoryBudgetCreate(CategoryBudgetBase):
    pass

class CategoryBudgetOut(CategoryBudgetBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class BudgetCategoryProgress(BaseModel):
    category_id: int
    category_name: str
    category_type: str
    color: str
    icon: str
    is_essential: bool
    monthly_limit: float
    current_spent: float
    remaining_amount: float
    percentage_used: float
    status: str  # 'ok' (< 80%), 'warning' (80-99.9%), 'exceeded' (>= 100%)
    is_budget_set: bool

class BudgetOverview(BaseModel):
    month: str
    total_budgeted: float
    total_spent_budgeted: float
    total_remaining_budgeted: float
    overall_percentage: float
    categories_with_budget: int
    categories_exceeded: int
    categories_warning: int
    items: List[BudgetCategoryProgress]


# --- Emergency Fund Schemas ---
class EmergencyFundTarget(BaseModel):
    months: int
    profile_label: str
    target_amount: float
    coverage_gap: float
    is_reached: bool
    projected_12m: float
    projected_24m: float

class EmergencyFundOverview(BaseModel):
    lookback_months: int
    monthly_essential_avg: float
    monthly_total_avg: float
    current_liquid_assets: float
    months_covered_essential: float
    months_covered_total: float
    annual_inflation_rate: float
    targets: List[EmergencyFundTarget]

