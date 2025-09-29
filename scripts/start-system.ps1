# Simple System Starter
Write-Host "Starting Student Work Analysis System..." -ForegroundColor Green

# Check dependencies
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "ERROR: Backend dependencies not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "ERROR: Frontend dependencies not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "bot\node_modules")) {
    Write-Host "ERROR: Bot dependencies not installed" -ForegroundColor Red
    exit 1
}

# Create directories
@("uploads", "uploads\bot", "database") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}

Write-Host "Starting services..." -ForegroundColor Yellow

# Start Backend
Write-Host "Starting Backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Backend starting...'; npm start"

Start-Sleep -Seconds 3

# Start Frontend  
Write-Host "Starting Frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Frontend starting...'; npm run dev"

Start-Sleep -Seconds 3

# Start Bot (if token exists)
$envPath = ".env"
$botToken = ""
if (Test-Path $envPath) {
    $envContent = Get-Content $envPath
    $tokenLine = $envContent | Where-Object { $_ -match "BOT_TOKEN=" }
    if ($tokenLine) {
        $botToken = ($tokenLine -split "=", 2)[1].Trim()
    }
}

if ($botToken -and $botToken -ne "your-telegram-bot-token-here") {
    Write-Host "Starting Telegram Bot..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:BOT_TOKEN='$botToken'; cd '$PWD\bot'; Write-Host 'Bot starting...'; npm start"
} else {
    Write-Host "WARNING: Bot token not found in .env file" -ForegroundColor Yellow
}

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "=== SYSTEM STARTED ===" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Login: teacher / admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Check the opened PowerShell windows for service logs" -ForegroundColor Gray
Write-Host "Press any key to exit this script (services will continue running)..."

$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host "Monitoring stopped. Services are still running." -ForegroundColor Green
