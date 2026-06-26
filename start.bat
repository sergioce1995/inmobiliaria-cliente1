@echo off
echo 🔧 Limpiando puerto 8000...
netstat -ano | findstr :8000 >nul
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
        echo ✅ Terminando proceso %%a
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak
)

echo 🚀 Iniciando servidor...
npm run dev
