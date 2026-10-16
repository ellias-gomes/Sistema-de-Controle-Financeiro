from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base
from .routers import categories, transactions, dashboard, projections
from .seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Seed default data if database is fresh
    seed_database()
    yield

app = FastAPI(
    title="Controle Financeiro Pessoal API",
    description="API local e rápida com SQLite para gestão financeira e projeção de inflação",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prevent browser/client caching of API responses
@app.middleware("http")
async def add_no_cache_header(request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

# Register routers
app.include_router(dashboard.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(projections.router, prefix="/api")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "app": "Controle Financeiro Pessoal", "version": "1.0.0"}
