@echo off
echo =====================================================
echo    FinFlow - Controle Financeiro Local (Windows)
echo =====================================================

REM 1. Verifica ou cria o venv
if not exist "venv" (
    echo Criando ambiente virtual Python...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install --upgrade pip
    pip install -r backend\requirements.txt
) else (
    call venv\Scripts\activate.bat
)

REM 2. Inicia o Backend em uma nova janela
echo Iniciando Backend FastAPI (Porta 8000)...
start "FinFlow Backend" cmd /k "venv\Scripts\activate.bat && uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

REM 3. Inicia o Frontend em uma nova janela
echo Iniciando Frontend Vite (Porta 5173)...
start "FinFlow Frontend" cmd /k "cd frontend && npm run dev"

echo =====================================================
echo FinFlow iniciado!
echo Acesse: http://localhost:5173
echo Docs API: http://localhost:8000/docs
echo =====================================================
pause
