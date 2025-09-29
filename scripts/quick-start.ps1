# Quick Start Script - Упрощенный запуск системы
Write-Host "🚀 Запуск системы анализа студенческих работ..." -ForegroundColor Green

# Проверяем, что все зависимости установлены
$allReady = $true

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "❌ Backend зависимости не установлены" -ForegroundColor Red
    $allReady = $false
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "❌ Frontend зависимости не установлены" -ForegroundColor Red
    $allReady = $false
}

if (-not (Test-Path "bot\node_modules")) {
    Write-Host "❌ Bot зависимости не установлены" -ForegroundColor Red
    $allReady = $false
}

if (-not $allReady) {
    Write-Host "Установите зависимости командой: .\setup.ps1" -ForegroundColor Yellow
    exit 1
}

# Создаем необходимые папки
@("uploads", "uploads\bot", "database", "demo-data") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

Write-Host "`n📦 Запуск сервисов..." -ForegroundColor Yellow

# Запуск Backend в отдельном окне
Write-Host "🔧 Запуск Backend API..."
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm start" -PassThru

Start-Sleep -Seconds 3

# Запуск Frontend в отдельном окне
Write-Host "🌐 Запуск Frontend..."
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -PassThru

Start-Sleep -Seconds 3

# Проверяем токен бота
$botToken = $env:BOT_TOKEN
if (-not $botToken) {
    $envContent = Get-Content ".env" -ErrorAction SilentlyContinue
    $tokenLine = $envContent | Where-Object { $_ -match "BOT_TOKEN=" }
    if ($tokenLine) {
        $botToken = ($tokenLine -split "=")[1]
    }
}

if ($botToken -and $botToken -ne "your-telegram-bot-token-here") {
    Write-Host "🤖 Запуск Telegram Bot..."
    $env:BOT_TOKEN = $botToken
    $botProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:BOT_TOKEN='$botToken'; cd '$PWD\bot'; npm start" -PassThru
} else {
    Write-Host "⚠️ Токен бота не найден. Обновите BOT_TOKEN в .env файле" -ForegroundColor Yellow
    $botProcess = $null
}

Start-Sleep -Seconds 5

Write-Host "`n🎉 Система запущена!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Green

# Проверяем статус сервисов
Write-Host "`n📋 Статус сервисов:" -ForegroundColor Yellow

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/stats" -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✅ Backend API: Работает (http://localhost:3001)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend API: Проблемы" -ForegroundColor Red
}

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend: Работает (http://localhost:5173)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend: Проблемы" -ForegroundColor Red
}

if ($botProcess) {
    Write-Host "✅ Telegram Bot: Запущен" -ForegroundColor Green
} else {
    Write-Host "⚠️ Telegram Bot: Не запущен (нет токена)" -ForegroundColor Yellow
}

Write-Host "`n🎯 Что делать дальше:" -ForegroundColor Cyan
Write-Host "1. Откройте браузер: http://localhost:5173" -ForegroundColor White
Write-Host "2. Войдите как: teacher / admin123" -ForegroundColor White
Write-Host "3. Проверьте панель управления" -ForegroundColor White

if ($botProcess) {
    Write-Host "4. Найдите QR-код для бота в папке: bot\bot_qr.png" -ForegroundColor White
    Write-Host "5. Протестируйте бота через Telegram: @viewvtkbot" -ForegroundColor White
}

Write-Host "`n⚡ Полезные команды:" -ForegroundColor Magenta
Write-Host "• Остановить все: Get-Process | Where-Object {`$_.ProcessName -eq 'node'} | Stop-Process" -ForegroundColor Gray
Write-Host "• Проверить порты: netstat -an | findstr :3001" -ForegroundColor Gray
Write-Host "• Перезапуск: .\scripts\quick-start.ps1" -ForegroundColor Gray

Write-Host "`n🌟 Система готова к использованию!" -ForegroundColor Green

# Сохраняем ID процессов для последующей остановки
@{
    Backend = $backendProcess.Id
    Frontend = $frontendProcess.Id
    Bot = if ($botProcess) { $botProcess.Id } else { $null }
} | ConvertTo-Json | Out-File "running-processes.json" -Encoding UTF8

Write-Host "`nПроцессы сохранены в running-processes.json"
Write-Host "Нажмите Ctrl+C для завершения этого скрипта (сервисы продолжат работать)" -ForegroundColor Yellow

# Ждем пока пользователь не прервет
try {
    while ($true) {
        Start-Sleep -Seconds 10
        # Проверяем, что процессы все еще работают
        if (-not (Get-Process -Id $backendProcess.Id -ErrorAction SilentlyContinue)) {
            Write-Host "⚠️ Backend процесс завершился" -ForegroundColor Yellow
            break
        }
    }
} catch {
    Write-Host "`n👋 Завершение мониторинга. Сервисы продолжают работать." -ForegroundColor Green
}
