# Quick System Status Check
Write-Host "Checking Student Work Analysis System Status..." -ForegroundColor Green

# Check Backend
try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/stats" -Method GET -TimeoutSec 5
    if ($backendResponse.StatusCode -eq 200) {
        Write-Host "✓ Backend API (port 3001): Running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend API (port 3001): Not running" -ForegroundColor Red
}

# Check Frontend
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✓ Frontend (port 5173): Running" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend (port 5173): Not running" -ForegroundColor Red
}

# Check Node processes
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✓ Node.js processes found: $($nodeProcesses.Count)" -ForegroundColor Green
} else {
    Write-Host "! Node.js processes not found" -ForegroundColor Yellow
}

Write-Host "`nAvailable URLs:" -ForegroundColor Yellow
Write-Host "  • Web Interface: http://localhost:5173" -ForegroundColor Cyan
Write-Host "  • API Endpoint: http://localhost:3001/api/stats" -ForegroundColor Cyan  
Write-Host "  • Telegram Bot: https://t.me/viewvtkbot" -ForegroundColor Cyan

Write-Host "`nLogin Credentials:" -ForegroundColor Yellow
Write-Host "  • Username: teacher" -ForegroundColor White
Write-Host "  • Password: admin123" -ForegroundColor White

Write-Host "`nNext Steps:" -ForegroundColor Green
Write-Host "  1. Open http://localhost:5173 in browser" -ForegroundColor Gray
Write-Host "  2. Login with credentials above" -ForegroundColor Gray
Write-Host "  3. Find @viewvtkbot in Telegram and send /start" -ForegroundColor Gray
Write-Host "  4. Upload a test image to the bot" -ForegroundColor Gray
Write-Host "  5. Check how the work appears in web interface" -ForegroundColor Gray

Write-Host "`nTo stop all services:" -ForegroundColor Red
Write-Host "  Get-Process -Name 'node' | Stop-Process" -ForegroundColor Gray
