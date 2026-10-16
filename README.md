# 💰 FinFlow • Controle Financeiro Pessoal Local

Um sistema completo, moderno e minimalista de **Controle Financeiro Pessoal**, projetado com uma interface *slim, smooth* (Tailwind CSS + React), gráficos interativos (Recharts), persistência em **SQLite local** (`financeiro.db`) e um **Módulo de Estimativas de Inflação e Custo de Vida Futuro**.

---

## 🛠️ Stack Tecnológico

* **Banco de Dados:** SQLite (`backend/financeiro.db`) com Foreign Keys e relacionamentos.
* **Backend:** Python 3.12 + FastAPI + SQLAlchemy + Pydantic v2.
* **Frontend:** React 18 + Vite + Tailwind CSS + Recharts + Lucide Icons.
* **Design System:** Suporte total a **Dark Mode / Light Mode**, tipografia Inter, transições suaves e espaçamento generoso (*whitespace*).

---

## 📂 Arquitetura de Pastas

```text
controle_financeiro/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # Inicialização FastAPI, CORS e Lifespan
│   │   ├── database.py          # Conexão SQLite e SessionLocal
│   │   ├── models.py            # Modelos Category e Transaction
│   │   ├── schemas.py           # Validações Pydantic (CRUD, Projeções)
│   │   ├── crud.py              # Consultas, agregações e projeção de inflação
│   │   ├── seed.py              # População inicial de categorias e transações
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── dashboard.py     # Endpoint /api/dashboard/overview
│   │       ├── transactions.py  # CRUD /api/transactions
│   │       ├── categories.py    # CRUD /api/categories
│   │       └── projections.py   # Simulações /api/projections/inflation
│   ├── financeiro.db            # Banco SQLite local
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Navegação em abas, seletor de mês e Dark Mode
│   │   │   ├── SummaryCards.jsx     # Cards de Saldo, Receitas detalhadas, Despesas
│   │   │   ├── ChartsSection.jsx    # Gráfico Donut de Categorias e Evolução Mensal
│   │   │   ├── TransactionsView.jsx # Tabela com filtros, busca e badges
│   │   │   ├── TransactionModal.jsx # Modal de criação/edição de transações
│   │   │   ├── CategoriesView.jsx   # Gestão de categorias com badge Essencial
│   │   │   └── InflationModule.jsx  # Simulador interativo de projeção de inflação
│   │   ├── utils/
│   │   │   └── formatters.js        # Formatação BRL (R$) e datas brasileiras
│   │   ├── api.js                   # Cliente HTTP (Fetch) para os endpoints
│   │   ├── App.jsx                  # Estado mestre e layout principal
│   │   ├── index.css                # Estilização Tailwind e scrollbars suaves
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── start.sh                     # Script de inicialização para Linux / macOS
├── start.bat                    # Script de inicialização para Windows
└── README.md
```

---

## 🚀 Como Executar Localmente

### Opção 1: Execução Automática com 1 Comando (Recomendado)

No terminal Linux / macOS:
```bash
./start.sh
```

No Windows:
```cmd
start.bat
```

O script irá:
1. Configurar o ambiente virtual Python se necessário.
2. Iniciar o servidor **FastAPI** na porta `8000`.
3. Iniciar o frontend **Vite** na porta `5173`.
4. Abrir as URLs:
   - Interface Web: [http://localhost:5173](http://localhost:5173)
   - Documentação Swagger da API: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧮 Lógica do Módulo de Estimativas de Inflação

O módulo de projeção permite simular o custo de vida para os próximos **6 a 24 meses**:

1. **Cálculo da Taxa Efetiva Mensal Composta:**
   $$i_{mensal} = \left(1 + \frac{i_{anual}}{100}\right)^{\frac{1}{12}} - 1$$

2. **Base Histórica Real:**
   O sistema calcula a média mensal dos últimos $N$ meses (ex: últimos 3 meses) das despesas cadastradas no banco SQLite.

3. **Filtro de Despesas Essenciais vs Estilo de Vida:**
   O usuário pode optar por projetar apenas as despesas essenciais (alimentação, moradia, saúde, transporte básico) ou o custo de vida total.

4. **Projeção Futura Mês a Mês:**
   Para cada mês futuro $m \in [1..N]$:
   $$\text{Custo Projetado}_m = \text{Custo Médio Base} \times (1 + i_{mensal})^m$$

5. **Impacto Acumulado no Período:**
   Calcula exatamente quanto a mais em R$ o usuário desembolsará acumuladamente ao longo de todo o período escolhido.

---

## 📊 Estrutura do Banco de Dados SQLite

### Tabela `categories`
* `id` (INTEGER, PK)
* `name` (VARCHAR, UNIQUE)
* `type` (VARCHAR: `INCOME` ou `EXPENSE`)
* `color` (VARCHAR, código hexadecimal ex: `#10B981`)
* `icon` (VARCHAR)
* `is_essential` (BOOLEAN): Marca categorias fundamentais para o cálculo de custo de vida mínimo.
* `created_at` (DATETIME)

### Tabela `transactions`
* `id` (INTEGER, PK)
* `description` (VARCHAR)
* `amount` (FLOAT)
* `date` (VARCHAR `YYYY-MM-DD`)
* `type` (VARCHAR: `INCOME` ou `EXPENSE`)
* `sub_type` (VARCHAR: `SALARY`, `ADVANCE`, `EXTRA`, `REGULAR`)
* `category_id` (INTEGER, FK -> `categories.id`)
* `payment_method` (VARCHAR: `PIX`, `Cartão de Crédito`, `Boleto`, etc.)
* `notes` (TEXT)
* `created_at` (DATETIME)
