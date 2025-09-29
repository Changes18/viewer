# Smart System Starter - Improved version
# Скрипт для умного запуска системы с проверкой портов

param(
    [switch]$KillExisting,
    [switch]$ShowLogs
)

Write-Host "=== Student Work Analysis System ===" -ForegroundColor Cyan
Write-Host "Starting smart system launcher..." -ForegroundColor Green

# Функция для проверки порта
function Test-Port {
    param([int]$Port)
    
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return $connection -ne $null
}

# Функция для освобождения порта
function Free-Port {
    param([int]$Port)
    
    Write-Host "Port $Port is busy. Finding process..." -ForegroundColor Yellow
    
    $netstat = netstat -ano | findstr ":$Port"
    if ($netstat) {
        $pid = ($netstat -split '\s+')[-1]
        Write-Host "Killing process $pid using port $Port..." -ForegroundColor Yellow
        taskkill /PID $pid /F | Out-Null
        Start-Sleep -Seconds 2
        return $true
    }
    return $false
}

# Проверка и освобождение портов
$ports = @(3001, 5173)
foreach ($port in $ports) {
    if (Test-Port -Port $port) {
        if ($KillExisting) {
            Free-Port -Port $port
        } else {
            Write-Host "Warning: Port $port is in use!" -ForegroundColor Red
            Write-Host "Run with -KillExisting to automatically free ports" -ForegroundColor Yellow
            return
        }
    }
}

Write-Host "All ports are free. Starting services..." -ForegroundColor Green

# Запуск Backend
Write-Host "`n[1/3] Starting Backend API (port 3001)..." -ForegroundColor Yellow
$backendJob = Start-Job -Name "Backend" -ScriptBlock {
    Set-Location "c:\Users\Wave\Desktop\numberone\backend"
    npm start
}

Start-Sleep -Seconds 3
Write-Host "Backend started with Job ID: $($backendJob.Id)" -ForegroundColor Green

# Запуск Frontend
Write-Host "`n[2/3] Starting Frontend (port 5173)..." -ForegroundColor Yellow
$frontendJob = Start-Job -Name "Frontend" -ScriptBlock {
    Set-Location "c:\Users\Wave\Desktop\numberone\frontend"
    npm run dev
}

Start-Sleep -Seconds 3
Write-Host "Frontend started with Job ID: $($frontendJob.Id)" -ForegroundColor Green

# Запуск Bot
Write-Host "`n[3/3] Starting Telegram Bot..." -ForegroundColor Yellow
$botJob = Start-Job -Name "TelegramBot" -ScriptBlock {
    Set-Location "c:\Users\Wave\Desktop\numberone\bot"
    npm start
}

Start-Sleep -Seconds 2
Write-Host "Bot started with Job ID: $($botJob.Id)" -ForegroundColor Green

# Проверка статуса
Write-Host "`n=== System Status ===" -ForegroundColor Cyan
Start-Sleep -Seconds 5

$jobs = Get-Job
foreach ($job in $jobs) {
    $status = if ($job.State -eq "Running") { "✅ Running" } else { "❌ $($job.State)" }
    Write-Host "$($job.Name): $status" -ForegroundColor $(if ($job.State -eq "Running") { "Green" } else { "Red" })
}

# Показ логов если запрошено
if ($ShowLogs) {
    Write-Host "`n=== Recent Logs ===" -ForegroundColor Cyan
    foreach ($job in $jobs) {
        if ($job.State -eq "Running") {
            Write-Host "`n--- $($job.Name) ---" -ForegroundColor Yellow
            Receive-Job $job.Id | Select-Object -Last 5
        }
    }
}

Write-Host "`n🚀 System is ready!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🤖 Telegram Bot: Ready for students" -ForegroundColor Cyan

Write-Host "`n💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "• Check status: Get-Job" -ForegroundColor Gray
Write-Host "• View logs: Get-Job | Receive-Job" -ForegroundColor Gray  
Write-Host "• Stop all: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Gray
Write-Host "• Test system: Invoke-WebRequest http://localhost:3001/api/stats" -ForegroundColor Gray

Write-Host "`n🎓 Login credentials:" -ForegroundColor Magenta
Write-Host "Username: teacher" -ForegroundColor White
Write-Host "Password: admin123" -ForegroundColor White

Write-Host "`nPress Ctrl+C to stop monitoring. Services will continue running in background." -ForegroundColor Gray

# Мониторинг в реальном времени
try {
    while ($true) {
        Start-Sleep -Seconds 10
        
        $runningJobs = (Get-Job | Where-Object { $_.State -eq "Running" }).Count
        $totalJobs = (Get-Job).Count
        
        Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Running: $runningJobs/$totalJobs services" -ForegroundColor Green
        
        # Проверка портов
        $backendOk = Test-Port -Port 3001
        $frontendOk = Test-Port -Port 5173
        
        if (-not $backendOk) { Write-Host "⚠️ Backend port 3001 not responding" -ForegroundColor Yellow }
        if (-not $frontendOk) { Write-Host "⚠️ Frontend port 5173 not responding" -ForegroundColor Yellow }
    }
}
catch {
    Write-Host "`nMonitoring stopped. Services continue running." -ForegroundColor Yellow
}
