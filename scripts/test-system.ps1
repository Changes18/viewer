# Complete System Test Script
# Полный тест системы анализа студенческих работ

param(
    [switch]$QuickTest,
    [switch]$SkipDemo,
    [string]$BotToken = ""
)

Write-Host "🧪 Запуск полного теста системы..." -ForegroundColor Green

# Функции для проверки статуса сервисов
function Test-ServiceHealth {
    param([string]$Url, [string]$ServiceName)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ ${ServiceName}: Работает" -ForegroundColor Green
            return $true
        }
    }
    catch {
        Write-Host "❌ ${ServiceName}: Недоступен" -ForegroundColor Red
        return $false
    }
}

function Test-ApiEndpoint {
    param([string]$Endpoint, [string]$Method = "GET", [object]$Body = $null)
    
    try {
        $params = @{
            Uri = "http://localhost:3001$Endpoint"
            Method = $Method
            TimeoutSec = 10
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

Write-Host "`n📋 Проверка предварительных условий..." -ForegroundColor Yellow

# Проверка Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js не установлен" -ForegroundColor Red
    exit 1
}

# Проверка структуры проекта
$requiredDirs = @("backend", "frontend", "bot", "scripts")
foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ Папка $dir найдена" -ForegroundColor Green
    } else {
        Write-Host "❌ Папка $dir не найдена" -ForegroundColor Red
        exit 1
    }
}

if (-not $QuickTest) {
    Write-Host "`n🔧 Установка зависимостей..." -ForegroundColor Yellow
    
    # Backend
    Write-Host "Установка backend зависимостей..."
    Set-Location backend
    npm install --silent
    Set-Location ..
    
    # Frontend
    Write-Host "Установка frontend зависимостей..."
    Set-Location frontend
    npm install --silent
    Set-Location ..
    
    # Bot
    Write-Host "Установка bot зависимостей..."
    Set-Location bot
    npm install --silent
    Set-Location ..
}

Write-Host "`n🚀 Запуск сервисов..." -ForegroundColor Yellow

# Запуск Backend
Write-Host "Запуск Backend API..."
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend
    npm start
}

Start-Sleep -Seconds 5

# Запуск Frontend
Write-Host "Запуск Frontend..."
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend  
    npm run dev
}

Start-Sleep -Seconds 5

# Условный запуск бота (если есть токен)
$botJob = $null
if ($BotToken -and $BotToken -ne "") {
    Write-Host "Запуск Telegram Bot..."
    $env:BOT_TOKEN = $BotToken
    $botJob = Start-Job -ScriptBlock {
        $env:BOT_TOKEN = $using:BotToken
        Set-Location $using:PWD\bot
        npm start
    }
    Start-Sleep -Seconds 3
}

Write-Host "`n🔍 Проверка работы сервисов..." -ForegroundColor Yellow

# Тестирование Backend API
Write-Host "`n📡 Тест Backend API:"
$apiTests = @(
    @{ Endpoint = "/api/stats"; Name = "Статистика" },
    @{ Endpoint = "/api/submissions"; Name = "Получение работ" }
)

foreach ($test in $apiTests) {
    if (Test-ApiEndpoint -Endpoint $test.Endpoint) {
        Write-Host "  ✅ $($test.Name)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($test.Name)" -ForegroundColor Red
    }
}

# Тест авторизации
Write-Host "`n🔐 Тест авторизации:"
$loginData = @{
    username = "teacher"
    password = "admin123"
}

if (Test-ApiEndpoint -Endpoint "/api/auth/login" -Method "POST" -Body $loginData) {
    Write-Host "  ✅ Авторизация работает" -ForegroundColor Green
} else {
    Write-Host "  ❌ Проблемы с авторизацией" -ForegroundColor Red
}

# Проверка веб-интерфейса
Write-Host "`n🌐 Проверка веб-интерфейса:"
if (Test-ServiceHealth -Url "http://localhost:5173" -ServiceName "Frontend") {
    Write-Host "  💡 Откройте http://localhost:5173 для проверки" -ForegroundColor Cyan
}

# Проверка бота (если запущен)
if ($botJob) {
    Write-Host "`n🤖 Проверка Telegram Bot:"
    Write-Host "  💡 Проверьте работу бота через Telegram" -ForegroundColor Cyan
    Write-Host "  📱 QR-код для бота должен быть в папке bot/" -ForegroundColor Cyan
}

# Генерация и загрузка демо данных (если не пропущено)
if (-not $SkipDemo) {
    Write-Host "`n🎭 Генерация демо данных..." -ForegroundColor Yellow
    
    # Запускаем генератор демо данных
    & ".\scripts\generate-demo.ps1"
    
    # Ждем немного и загружаем данные
    Start-Sleep -Seconds 2
    
    if (Test-Path "demo-data\Load-DemoData.ps1") {
        Write-Host "Загрузка демо данных в систему..."
        & ".\demo-data\Load-DemoData.ps1"
    }
}

Write-Host "`n📊 Отчет о тестировании:" -ForegroundColor Green
Write-Host "════════════════════════════════════════" -ForegroundColor Gray

# Проверка финального статуса
$backendOk = Test-ServiceHealth -Url "http://localhost:3001/api/stats" -ServiceName ""
$frontendOk = Test-ServiceHealth -Url "http://localhost:5173" -ServiceName ""

Write-Host "Backend API:     $(if($backendOk){'✅ Работает'}else{'❌ Проблемы'})" -ForegroundColor $(if($backendOk){'Green'}else{'Red'})
Write-Host "Frontend:        $(if($frontendOk){'✅ Работает'}else{'❌ Проблемы'})" -ForegroundColor $(if($frontendOk){'Green'}else{'Red'})
Write-Host "Telegram Bot:    $(if($botJob){'🤖 Запущен'}else{'⏸️ Не запущен (нет токена)'})" -ForegroundColor $(if($botJob){'Green'}else{'Yellow'})

Write-Host "`n🎯 Следующие шаги для тестирования:" -ForegroundColor Yellow
Write-Host "1. Откройте http://localhost:5173" -ForegroundColor Gray
Write-Host "2. Войдите как teacher/admin123" -ForegroundColor Gray
Write-Host "3. Проверьте демо данные на дашборде" -ForegroundColor Gray

if ($botJob) {
    Write-Host "4. Протестируйте бота через Telegram" -ForegroundColor Gray
    Write-Host "5. Отправьте тестовое изображение боту" -ForegroundColor Gray
}

Write-Host "`n⚡ Быстрые команды:" -ForegroundColor Cyan
Write-Host "• Логи backend:  Get-Job | Where-Object Name -eq 'Job*' | Receive-Job" -ForegroundColor Gray
Write-Host "• Остановить:    Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host "• Перезапуск:    .\scripts\test-system.ps1 -QuickTest" -ForegroundColor Gray

Write-Host "`n🏁 Тестирование завершено!" -ForegroundColor Green

# Держим сессию открытой
if (-not $QuickTest) {
    Write-Host "`nНажмите любую клавишу для завершения и остановки всех сервисов..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
    # Останавливаем все задачи
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    
    Write-Host "🛑 Все сервисы остановлены" -ForegroundColor Red
}
