# Quick System Status Check
Write-Host "🔍 Проверка статуса системы Student Work Analysis..." -ForegroundColor Green

# Проверка Backend
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/stats" -Method GET -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend API (порт 3001): Работает" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API (порт 3001): Не работает" -ForegroundColor Red
}

# Проверка Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend (порт 5173): Работает" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend (порт 5173): Не работает" -ForegroundColor Red
}

# Проверка процессов
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ Node.js процессы найдены: $($nodeProcesses.Count)" -ForegroundColor Green
} else {
    Write-Host "⚠️ Node.js процессы не найдены" -ForegroundColor Yellow
}

Write-Host "`n📋 Доступные URL:" -ForegroundColor Yellow
Write-Host "   • Веб-интерфейс: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   • API документация: http://localhost:3001/api/stats" -ForegroundColor Cyan  
Write-Host "   • Telegram бот: https://t.me/viewvtkbot" -ForegroundColor Cyan

Write-Host "`n🔐 Логин для веб-интерфейса:" -ForegroundColor Yellow
Write-Host "   • Пользователь: teacher" -ForegroundColor White
Write-Host "   • Пароль: admin123" -ForegroundColor White

Write-Host "`n💡 Следующие шаги:" -ForegroundColor Green
Write-Host "   1. Откройте http://localhost:5173 в браузере" -ForegroundColor Gray
Write-Host "   2. Войдите с указанными выше данными" -ForegroundColor Gray
Write-Host "   3. Найдите @viewvtkbot в Telegram и отправьте /start" -ForegroundColor Gray
Write-Host "   4. Загрузите тестовое изображение боту" -ForegroundColor Gray
Write-Host "   5. Проверьте, как работа появится в веб-интерфейсе" -ForegroundColor Gray

Write-Host "`n🛑 Для остановки всех сервисов:" -ForegroundColor Red
Write-Host "   Get-Process -Name 'node' | Stop-Process" -ForegroundColor Gray
