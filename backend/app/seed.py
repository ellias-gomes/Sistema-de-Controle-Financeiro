from datetime import date
from dateutil.relativedelta import relativedelta
from .database import SessionLocal, Base, engine
from . import models

DEFAULT_CATEGORIES = [
    # Despesas Essenciais
    {"name": "Moradia & Contas", "type": "EXPENSE", "color": "#3B82F6", "icon": "Home", "is_essential": True},
    {"name": "Alimentação & Mercado", "type": "EXPENSE", "color": "#10B981", "icon": "ShoppingCart", "is_essential": True},
    {"name": "Transporte & Combustível", "type": "EXPENSE", "color": "#F59E0B", "icon": "Car", "is_essential": True},
    {"name": "Saúde & Farmácia", "type": "EXPENSE", "color": "#EF4444", "icon": "HeartPulse", "is_essential": True},
    {"name": "Educação & Cursos", "type": "EXPENSE", "color": "#8B5CF6", "icon": "GraduationCap", "is_essential": True},
    # Despesas Estilo de Vida / Lazer
    {"name": "Lazer & Restaurantes", "type": "EXPENSE", "color": "#EC4899", "icon": "Utensils", "is_essential": False},
    {"name": "Assinaturas & Serviços", "type": "EXPENSE", "color": "#06B6D4", "icon": "Tv", "is_essential": False},
    {"name": "Compras Pessoais", "type": "EXPENSE", "color": "#F97316", "icon": "ShoppingBag", "is_essential": False},
    {"name": "Outros Gastos", "type": "EXPENSE", "color": "#64748B", "icon": "MoreHorizontal", "is_essential": False},
    # Receitas
    {"name": "Salário Mensal", "type": "INCOME", "color": "#10B981", "icon": "Briefcase", "is_essential": False},
    {"name": "Adiantamento Salarial", "type": "INCOME", "color": "#14B8A6", "icon": "Coins", "is_essential": False},
    {"name": "Renda Extra & Freelance", "type": "INCOME", "color": "#6366F1", "icon": "Zap", "is_essential": False},
    {"name": "Rendimentos & Investimentos", "type": "INCOME", "color": "#84CC16", "icon": "TrendingUp", "is_essential": False},
]

def seed_database(populate_demo: bool = False):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if categories already exist
        existing_cats = db.query(models.Category).count()
        cat_map = {}

        if existing_cats == 0:
            print("Populando categorias padrão...")
            for cat_data in DEFAULT_CATEGORIES:
                cat = models.Category(**cat_data)
                db.add(cat)
                db.flush()
                cat_map[cat.name] = cat.id
            db.commit()
        else:
            for cat in db.query(models.Category).all():
                cat_map[cat.name] = cat.id

        # Only insert demonstration transactions if explicitly requested
        if populate_demo:
            existing_txs = db.query(models.Transaction).count()
            if existing_txs == 0:
                print("Populando dados de demonstração dos últimos 3 meses...")
                today = date.today()

            for i in range(2, -1, -1):
                month_date = today.replace(day=1) - relativedelta(months=i)
                m_str = month_date.strftime("%Y-%m")

                # Income: Salário
                db.add(models.Transaction(
                    description="Salário CLT Principal",
                    amount=5500.00,
                    date=f"{m_str}-05",
                    type="INCOME",
                    sub_type="SALARY",
                    category_id=cat_map.get("Salário Mensal"),
                    payment_method="Transferência Bancária"
                ))
                # Income: Adiantamento
                db.add(models.Transaction(
                    description="Adiantamento Quinzenal",
                    amount=1800.00,
                    date=f"{m_str}-20",
                    type="INCOME",
                    sub_type="ADVANCE",
                    category_id=cat_map.get("Adiantamento Salarial"),
                    payment_method="PIX"
                ))
                # Income: Renda Extra
                db.add(models.Transaction(
                    description="Consultoria & Freelance Web",
                    amount=850.00,
                    date=f"{m_str}-14",
                    type="INCOME",
                    sub_type="EXTRA",
                    category_id=cat_map.get("Renda Extra & Freelance"),
                    payment_method="PIX"
                ))

                # Expenses Essenciais
                db.add(models.Transaction(
                    description="Aluguel e Condomínio",
                    amount=2100.00,
                    date=f"{m_str}-06",
                    type="EXPENSE",
                    sub_type="REGULAR",
                    category_id=cat_map.get("Moradia & Contas"),
                    payment_method="Boleto"
                ))
                db.add(models.Transaction(
                    description="Supermercado Mensal",
                    amount=1250.00 + (i * 20),
                    date=f"{m_str}-08",
                    type="EXPENSE",
                    sub_type="REGULAR",
                    category_id=cat_map.get("Alimentação & Mercado"),
                    payment_method="Cartão de Crédito"
                ))
                db.add(models.Transaction(
                    description="Combustível e Manutenção Carro",
                    amount=480.00,
                    date=f"{m_str}-12",
                    type="EXPENSE",
                    sub_type="REGULAR",
                    category_id=cat_map.get("Transporte & Combustível"),
                    payment_method="Cartão de Débito"
                ))
                db.add(models.Transaction(
                    description="Plano de Saúde & Medicamentos",
                    amount=380.00,
                    date=f"{m_str}-15",
                    type="EXPENSE",
                    sub_type="REGULAR",
                    category_id=cat_map.get("Saúde & Farmácia"),
                    payment_method="PIX"
                ))

                # Expenses Lifestyle
                db.add(models.Transaction(
                    description="Jantar em Restaurante & Delivery",
                    amount=340.00,
                    date=f"{m_str}-18",
                    type="EXPENSE",
                    sub_type="REGULAR",
                    category_id=cat_map.get("Lazer & Restaurantes"),
                    payment_method="Cartão de Crédito"
                ))
                db.add(models.Transaction(
                    description="Streaming & Internet Fibra",
                    amount=189.90,
                    date=f"{m_str}-22",
                    type="EXPENSE",
                    sub_type="REGULAR",
                    category_id=cat_map.get("Assinaturas & Serviços"),
                    payment_method="Cartão de Crédito"
                ))

            db.commit()
            print("Dados de demonstração inseridos com sucesso!")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    with_demo = "--demo" in sys.argv
    seed_database(populate_demo=with_demo)
