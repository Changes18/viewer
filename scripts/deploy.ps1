# Production Deployment Script
# Скрипт для развертывания в продакшн среде

param(
    [string]$Environment = "production",
    [string]$Domain = "localhost",
    [switch]$UseDocker,
    [switch]$SetupSSL
)

Write-Host "🚀 Развертывание в продакшн..." -ForegroundColor Green

# Проверка окружения
if (-not (Test-Path ".env")) {
    Write-Host "❌ Файл .env не найден. Создайте его на основе .env файла" -ForegroundColor Red
    exit 1
}

# Сборка фронтенда
Write-Host "📦 Сборка фронтенда..." -ForegroundColor Yellow
Set-Location frontend
npm run build
Set-Location ..

# Проверка наличия всех необходимых файлов
$requiredFiles = @(
    "backend/package.json",
    "bot/package.json", 
    "frontend/dist/index.html"
)

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Файл $file не найден" -ForegroundColor Red
        exit 1
    }
}

if ($UseDocker) {
    Write-Host "🐳 Развертывание с Docker..." -ForegroundColor Yellow
    
    # Создание Dockerfile для backend
    $backendDockerfile = @"
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
"@
    $backendDockerfile | Out-File -FilePath "backend/Dockerfile" -Encoding UTF8
    
    # Создание Dockerfile для бота
    $botDockerfile = @"
FROM node:18-alpine
RUN apk add --no-cache python3 py3-pip make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "bot.js"]
"@
    $botDockerfile | Out-File -FilePath "bot/Dockerfile" -Encoding UTF8
    
    # Создание Dockerfile для фронтенда
    $frontendDockerfile = @"
FROM nginx:alpine
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
"@
    $frontendDockerfile | Out-File -FilePath "frontend/Dockerfile" -Encoding UTF8
    
    # Nginx конфигурация
    $nginxConf = @"
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name $Domain;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files `$uri `$uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:3001;
            proxy_set_header Host `$host;
            proxy_set_header X-Real-IP `$remote_addr;
        }
    }
}
"@
    $nginxConf | Out-File -FilePath "frontend/nginx.conf" -Encoding UTF8
    
    Write-Host "Запуск Docker Compose..." -ForegroundColor Yellow
    docker-compose up -d
    
} else {
    Write-Host "🔧 Обычное развертывание..." -ForegroundColor Yellow
    
    # Установка зависимостей в продакшн режиме
    Write-Host "Установка зависимостей backend..." -ForegroundColor Gray
    Set-Location backend
    npm ci --only=production
    Set-Location ..
    
    Write-Host "Установка зависимостей bot..." -ForegroundColor Gray
    Set-Location bot
    npm ci --only=production
    Set-Location ..
    
    # Создание systemd сервисов (для Linux серверов)
    $backendService = @"
[Unit]
Description=Student Analysis Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app/backend
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
"@
    
    $botService = @"
[Unit]
Description=Student Analysis Bot
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/your/app/bot
ExecStart=/usr/bin/node bot.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
"@
    
    $backendService | Out-File -FilePath "student-backend.service" -Encoding UTF8
    $botService | Out-File -FilePath "student-bot.service" -Encoding UTF8
    
    Write-Host "📋 Сервисные файлы созданы:" -ForegroundColor Green
    Write-Host "   • student-backend.service" -ForegroundColor Gray
    Write-Host "   • student-bot.service" -ForegroundColor Gray
}

# SSL сертификат (если нужен)
if ($SetupSSL -and $Domain -ne "localhost") {
    Write-Host "🔒 Настройка SSL..." -ForegroundColor Yellow
    Write-Host "Для настройки SSL сертификата выполните:" -ForegroundColor Gray
    Write-Host "   1. Установите Certbot" -ForegroundColor Gray
    Write-Host "   2. certbot --nginx -d $Domain" -ForegroundColor Gray
}

Write-Host "`n✅ Развертывание завершено!" -ForegroundColor Green
Write-Host "📋 Следующие шаги:" -ForegroundColor Yellow

if ($UseDocker) {
    Write-Host "   • Проверьте: docker-compose ps" -ForegroundColor Gray
    Write-Host "   • Логи: docker-compose logs -f" -ForegroundColor Gray
} else {
    Write-Host "   • Скопируйте .service файлы в /etc/systemd/system/" -ForegroundColor Gray
    Write-Host "   • sudo systemctl enable student-backend" -ForegroundColor Gray
    Write-Host "   • sudo systemctl enable student-bot" -ForegroundColor Gray
    Write-Host "   • sudo systemctl start student-backend student-bot" -ForegroundColor Gray
}

Write-Host "   • Настройте веб-сервер (Nginx/Apache) для статических файлов" -ForegroundColor Gray
Write-Host "   • Обновите BOT_TOKEN в .env файле" -ForegroundColor Gray
Write-Host "   • Настройте домен и SSL" -ForegroundColor Gray
