from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    type = Column(String(20), nullable=False, default="EXPENSE")  # 'INCOME' or 'EXPENSE'
    color = Column(String(20), default="#6366F1")
    icon = Column(String(50), default="Tag")
    is_essential = Column(Boolean, default=False)  # For inflation projection (essential vs lifestyle)
    created_at = Column(DateTime, default=datetime.utcnow)

    transactions = relationship("Transaction", back_populates="category", cascade="all, delete-orphan")
    budget = relationship("CategoryBudget", back_populates="category", uselist=False, cascade="all, delete-orphan")


class CategoryBudget(Base):
    __tablename__ = "category_budgets"

    id = Column(Integer, primary_key=True, index=True)
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    monthly_limit = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    category = relationship("Category", back_populates="budget")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(String(10), nullable=False, index=True)  # Format YYYY-MM-DD
    type = Column(String(20), nullable=False)  # 'INCOME' or 'EXPENSE'
    sub_type = Column(String(30), nullable=False, default="REGULAR")  # 'SALARY', 'ADVANCE', 'EXTRA', 'REGULAR'
    payment_method = Column(String(50), nullable=True, default="PIX")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    category_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    category = relationship("Category", back_populates="transactions")
