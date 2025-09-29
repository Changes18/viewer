# Demo Data Generator
# Скрипт для создания демонстрационных данных

Write-Host "🎭 Генерация демонстрационных данных..." -ForegroundColor Green

# Создание тестовых изображений с помощью placeholder API
$demoImages = @(
    @{
        name = "design_project_1.jpg"
        url = "https://picsum.photos/800/600?random=1"
        student = "Иван Петров"
    },
    @{
        name = "poster_design.jpg"
        url = "https://picsum.photos/800/600?random=2"
        student = "Анна Сидорова"
    },
    @{
        name = "logo_concept.jpg"
        url = "https://picsum.photos/800/600?random=3"
        student = "Михаил Козлов"
    },
    @{
        name = "ui_mockup.jpg"
        url = "https://picsum.photos/800/600?random=4"
        student = "Елена Волкова"
    },
    @{
        name = "typography_work.jpg"
        url = "https://picsum.photos/800/600?random=5"
        student = "Дмитрий Соколов"
    }
)

# Создаем папку для демо данных
if (-not (Test-Path "demo-data")) {
    New-Item -ItemType Directory -Path "demo-data" | Out-Null
}

# Генерируем JSON с демонстрационными работами
$demoSubmissions = @()

foreach ($image in $demoImages) {
    $submission = @{
        id = [System.Guid]::NewGuid().ToString()
        studentId = [Math]::Abs((Get-Random))
        studentName = $image.student
        fileName = $image.name
        fileUrl = "/uploads/demo/" + $image.name
        fileType = "image"
        extractedText = "Дизайн проект студента. Творческая работа по заданию преподавателя."
        aiScore = Get-Random -Minimum 75 -Maximum 98
        aiComment = "Отличная креативная работа! Хорошее понимание композиции и цветовых решений. Видно развитое чувство стиля и внимание к деталям."
        teacherGrade = $null
        teacherComment = $null
        status = "pending"
        createdAt = (Get-Date).AddHours(-(Get-Random -Maximum 48)).ToString("o")
        assessedAt = $null
        assessedBy = $null
        telegramFileId = "demo_" + [System.Guid]::NewGuid().ToString()
    }
    
    $demoSubmissions += $submission
}

# Сохраняем в JSON файл
$demoSubmissions | ConvertTo-Json -Depth 10 | Out-File -FilePath "demo-data/submissions.json" -Encoding UTF8

Write-Host "✅ Демонстрационные данные созданы:" -ForegroundColor Green
Write-Host "   • $($demoSubmissions.Count) работ студентов" -ForegroundColor Gray
Write-Host "   • Файл: demo-data/submissions.json" -ForegroundColor Gray

# Создание демо скрипта для отправки данных в API
$apiScript = @"
# API Demo Data Loader
import json
import requests
import time

# Загружаем демо данные
with open('demo-data/submissions.json', 'r', encoding='utf-8') as f:
    submissions = json.load(f)

API_BASE = 'http://localhost:3001'

print('🚀 Загрузка демо данных в API...')

for i, submission in enumerate(submissions):
    try:
        response = requests.post(f'{API_BASE}/api/webhook/submission', json=submission)
        if response.status_code == 200:
            print(f'✅ Загружена работа {i+1}: {submission["studentName"]}')
        else:
            print(f'❌ Ошибка загрузки работы {i+1}: {response.status_code}')
        
        time.sleep(1)  # Пауза между запросами
        
    except Exception as e:
        print(f'❌ Ошибка: {e}')

print('✅ Загрузка завершена!')
"@

$apiScript | Out-File -FilePath "demo-data/load_demo_data.py" -Encoding UTF8

Write-Host "📋 Для загрузки данных в API:" -ForegroundColor Yellow
Write-Host "   1. Запустите backend сервер" -ForegroundColor Gray
Write-Host "   2. python demo-data/load_demo_data.py" -ForegroundColor Gray

# Создание PowerShell версии скрипта загрузки
$psScript = @"
# PowerShell версия загрузки демо данных
`$demoData = Get-Content -Path "demo-data/submissions.json" -Encoding UTF8 | ConvertFrom-Json
`$apiBase = "http://localhost:3001"

Write-Host "🚀 Загрузка демо данных в API..." -ForegroundColor Green

for (`$i = 0; `$i -lt `$demoData.Length; `$i++) {
    `$submission = `$demoData[`$i]
    
    try {
        `$response = Invoke-RestMethod -Uri "`$apiBase/api/webhook/submission" -Method POST -Body (`$submission | ConvertTo-Json -Depth 10) -ContentType "application/json"
        Write-Host "✅ Загружена работа `$(`$i+1): `$(`$submission.studentName)" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Ошибка загрузки работы `$(`$i+1): `$_" -ForegroundColor Red
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "✅ Загрузка завершена!" -ForegroundColor Green
"@

$psScript | Out-File -FilePath "demo-data/Load-DemoData.ps1" -Encoding UTF8

Write-Host "💡 Альтернативно (PowerShell):" -ForegroundColor Cyan
Write-Host "   .\demo-data\Load-DemoData.ps1" -ForegroundColor Gray
