# Student Work Analysis System - Setup Script
# Скрипт для автоматической настройки окружения разработки

param(
    [switch]$SkipNodeInstall,
    [switch]$SkipGitInit,
    [string]$BotToken = "",
    [string]$DatabaseUrl = "sqlite:./database.db",
    [switch]$RunDemo
)

Write-Host "🚀 Настройка Student Work Analysis System..." -ForegroundColor Green

# Проверка наличия Node.js
function Test-NodeJS {
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js найден: $nodeVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Node.js не найден" -ForegroundColor Red
        return $false
    }
}

# Установка Node.js через Chocolatey или Winget
function Install-NodeJS {
    Write-Host "🔧 Попытка установки Node.js..." -ForegroundColor Yellow
    
    # Сначала пробуем winget (встроен в Windows 10/11)
    try {
        winget install OpenJS.NodeJS
        refreshenv
        Write-Host "✅ Node.js установлен через winget" -ForegroundColor Green
        return
    }
    catch {
        Write-Host "⚠️ Winget недоступен, пробуем Chocolatey..." -ForegroundColor Yellow
    }
    
    # Если winget не работает, пробуем Chocolatey
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Устанавливаю Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        refreshenv
    }
    
    Write-Host "Устанавливаю Node.js через Chocolatey..." -ForegroundColor Yellow
    choco install nodejs -y
    refreshenv
}

# Создание структуры проекта
function New-ProjectStructure {
    Write-Host "📁 Проверка структуры проекта..." -ForegroundColor Yellow
    
    $folders = @(
        "uploads",
        "uploads\bot", 
        "database",
        "demo-data"
    )
    
    foreach ($folder in $folders) {
        if (-not (Test-Path $folder)) {
            New-Item -ItemType Directory -Path $folder -Force | Out-Null
            Write-Host "   ✓ Создана папка $folder" -ForegroundColor Gray
        }
    }
}

# Инициализация проектов
function Initialize-Projects {
    Write-Host "📦 Установка зависимостей..." -ForegroundColor Yellow
    
    $projects = @(
        @{Name = "Backend"; Path = "backend"},
        @{Name = "Frontend"; Path = "frontend"}, 
        @{Name = "Bot"; Path = "bot"}
    )
    
    foreach ($project in $projects) {
        if (Test-Path "$($project.Path)\package.json") {
            Write-Host "   🔄 $($project.Name)..." -ForegroundColor Gray
            Set-Location $project.Path
            npm install --silent
            Set-Location ..
            Write-Host "   ✅ $($project.Name) готов" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ $($project.Name): package.json не найден" -ForegroundColor Yellow
        }
    }
}

# Создание конфигурационных файлов
function New-ConfigFiles {
    Write-Host "⚙️ Настройка конфигурации..." -ForegroundColor Yellow
    
    # Обновляем .env файл
    if (Test-Path ".env") {
        $envContent = Get-Content ".env" -Raw
        
        if ($BotToken -and $BotToken -ne "") {
            $envContent = $envContent -replace "BOT_TOKEN=.*", "BOT_TOKEN=$BotToken"
            Write-Host "   ✓ Токен бота обновлен" -ForegroundColor Green
        }
        
        $envContent | Set-Content ".env" -Encoding UTF8
    } else {
        Write-Host "   ⚠️ Файл .env не найден" -ForegroundColor Yellow
    }
    
    # Проверяем наличие необходимых файлов
    $requiredFiles = @(
        "backend\server.js",
        "frontend\src\App.tsx",
        "bot\bot.js"
    )
    
    $missingFiles = @()
    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -gt 0) {
        Write-Host "   ❌ Не найдены критические файлы:" -ForegroundColor Red
        $missingFiles | ForEach-Object { Write-Host "      • $_" -ForegroundColor Red }
        return $false
    }
    
    return $true
}

# Главная функция
function Main {
    try {
        Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "  Student Work Analysis System Setup" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
        
        # Проверка и установка Node.js
        if (-not $SkipNodeInstall -and -not (Test-NodeJS)) {
            Install-NodeJS
        }
        
        if (-not (Test-NodeJS)) {
            Write-Host "❌ Не удалось установить Node.js. Прерываю выполнение." -ForegroundColor Red
            Write-Host "💡 Попробуйте установить вручную: https://nodejs.org/" -ForegroundColor Yellow
            exit 1
        }
        
        # Создание структуры
        New-ProjectStructure
        
        # Проверка конфигурации
        if (-not (New-ConfigFiles)) {
            Write-Host "❌ Критические файлы отсутствуют. Проверьте целостность проекта." -ForegroundColor Red
            exit 1
        }
        
        # Установка зависимостей
        Initialize-Projects
        
        # Git инициализация
        if (-not $SkipGitInit -and -not (Test-Path ".git")) {
            Write-Host "🔧 Инициализация Git репозитория..." -ForegroundColor Yellow
            git init
            git add .
            git commit -m "Initial project setup"
            Write-Host "   ✅ Git репозиторий создан" -ForegroundColor Green
        }
        
        Write-Host "`n🎉 Настройка завершена успешно!" -ForegroundColor Green
        Write-Host "════════════════════════════════════════" -ForegroundColor Green
        
        Write-Host "`n📋 Следующие шаги:" -ForegroundColor Yellow
        
        if (-not $BotToken -or $BotToken -eq "") {
            Write-Host "   1. 🤖 Создайте бота через @BotFather в Telegram:" -ForegroundColor Gray
            Write-Host "      • Отправьте /newbot" -ForegroundColor Gray  
            Write-Host "      • Выберите имя и username для бота" -ForegroundColor Gray
            Write-Host "      • Скопируйте полученный токен" -ForegroundColor Gray
            Write-Host "      • Обновите файл .env: BOT_TOKEN=ваш_токен" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "   2. 🚀 Запустите систему:" -ForegroundColor Gray
        Write-Host "      .\scripts\dev.ps1" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "   3. 🌐 Откройте веб-интерфейс:" -ForegroundColor Gray
        Write-Host "      http://localhost:5173" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "   4. 🔐 Используйте демо-аккаунт:" -ForegroundColor Gray
        Write-Host "      Логин: teacher" -ForegroundColor Cyan
        Write-Host "      Пароль: admin123" -ForegroundColor Cyan
        
        # Опция запуска демо
        if ($RunDemo) {
            Write-Host "`n🎭 Запуск с демо данными..." -ForegroundColor Magenta
            & ".\scripts\test-system.ps1" -BotToken $BotToken
        } else {
            Write-Host "`n💡 Дополнительные команды:" -ForegroundColor Cyan
            Write-Host "   • Тест системы:     .\scripts\test-system.ps1" -ForegroundColor Gray
            Write-Host "   • Генерация демо:   .\scripts\generate-demo.ps1" -ForegroundColor Gray
            Write-Host "   • Продакшн сборка:  .\scripts\deploy.ps1" -ForegroundColor Gray
        }
        
    }
    catch {
        Write-Host "❌ Ошибка при настройке: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 Попробуйте запустить с правами администратора" -ForegroundColor Yellow
        exit 1
    }
}

# Запуск главной функции
Main
