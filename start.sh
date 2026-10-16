#!/usr/bin/env bash

# FinFlow - Script de Inicialização Unificada (Linux / macOS)
# Encerra processos em segundo plano ao fechar com Ctrl+C
trap 'kill $(jobs -p) 2>/dev/null; exit' EXIT SIGINT SIGTERM

echo "====================================================="
echo "   🚀 Iniciando FinFlow - Controle Financeiro Local   "
echo "====================================================="

# 1. Verifica ou cria o ambiente virtual Python se necessário
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..."
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install -r backend/requirements.txt
fi

# 2. Inicia o Backend FastAPI
echo "⚙️  Iniciando Backend FastAPI (Porta 8000)..."
./venv/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# Aguarda 2 segundos para o backend inicializar
sleep 2

# 3. Inicia o Frontend Vite
echo "🎨 Iniciando Frontend Vite (Porta 5173)..."
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!
cd ..

echo "====================================================="
echo "✅ FinFlow está rodando com sucesso!"
echo "👉 Frontend (Interface): http://localhost:5173"
echo "👉 Backend (Documentação Swagger): http://localhost:8000/docs"
echo "👉 Banco de Dados: backend/financeiro.db"
echo "Pressione Ctrl+C para encerrar o sistema."
echo "====================================================="

wait
