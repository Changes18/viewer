# Development Server Startup Script
# Скрипт для запуска всех сервисов в режиме разработки

Write-Host "🚀 Запуск сервисов разработки..." -ForegroundColor Green

# Проверка наличия .env файла
if (-not (Test-Path ".env")) {
    Write-Host "❌ Файл .env не найден. Запустите setup.ps1 сначала." -ForegroundColor Red
    exit 1
}

# Функция для запуска сервиса в новом окне
function Start-ServiceInNewWindow {
    param(
        [string]$ServiceName,
        [string]$WorkingDirectory,
        [string]$Command
    )
    
    Write-Host "🔄 Запускаю $ServiceName..." -ForegroundColor Yellow
    
    $processArgs = @{
        FilePath = "powershell.exe"
        ArgumentList = @("-NoExit", "-Command", "cd '$WorkingDirectory'; $Command")
        WindowStyle = "Normal"
    }
    
    Start-Process @processArgs
}

# Запуск всех сервисов
Write-Host "Запускаю все сервисы в отдельных окнах..." -ForegroundColor Yellow

# Backend API
Start-ServiceInNewWindow -ServiceName "Backend API" -WorkingDirectory "$(Get-Location)\backend" -Command "npm run dev"

# Frontend React App  
Start-ServiceInNewWindow -ServiceName "Frontend" -WorkingDirectory "$(Get-Location)\frontend" -Command "npm run dev"

# Telegram Bot
Start-ServiceInNewWindow -ServiceName "Telegram Bot" -WorkingDirectory "$(Get-Location)\bot" -Command "npm run dev"

Write-Host "`n✅ Все сервисы запущены!" -ForegroundColor Green
Write-Host "📋 Доступные URL:" -ForegroundColor Yellow
Write-Host "   • Frontend: http://localhost:5173" -ForegroundColor Gray  
Write-Host "   • Backend API: http://localhost:3001" -ForegroundColor Gray
Write-Host "   • Bot работает в фоне" -ForegroundColor Gray
Write-Host "`n🛑 Для остановки всех сервисов закройте все окна PowerShell" -ForegroundColor Yellow
