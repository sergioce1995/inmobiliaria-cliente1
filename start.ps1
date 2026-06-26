# Script para iniciar el servidor limpiando el puerto 8000
Write-Host "🔧 Limpiando puerto 8000..." -ForegroundColor Yellow

$procPid = (Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
if ($procPid) {
    Write-Host "✅ Terminando proceso $procPid" -ForegroundColor Green
    Stop-Process -Id $procPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
npm run dev
