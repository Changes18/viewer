# Student Work Analysis System

Комплексная система для анализа студенческих работ с использованием Telegram-бота и веб-интерфейса преподавателя.

## 🚀 Возможности

### Для студентов (Telegram бот):

- 📸 Загрузка фото работ (JPG, PNG)
- 📄 Загрузка PDF документов
- 🤖 Мгновенный анализ работ "ИИ"
- ⭐ Получение оценки и обратной связи (только положительные оценки 70-100)
- 🔍 OCR распознавание текста с изображений
- 📱 QR-код для быстрого доступа к боту

### Для преподавателей (Веб-интерфейс):

- 📊 Панель управления с статистикой
- 📋 Просмотр всех студенческих работ
- 🎯 Drag & Drop оценивание в 3 категории:
  - 🏆 Отлично
  - 👍 Хорошо
  - ⚠️ Требует доработки
- 💬 Добавление комментариев
- 🔄 Обновления в реальном времени
- 🌙 Темная/светлая тема
- 📱 Адаптивный дизайн

## 🛠️ Технический стек

**Backend:**

- Node.js + Express
- WebSocket для real-time обновлений
- JWT авторизация
- Multer для загрузки файлов
- SQLite база данных (in-memory для демо)

**Frontend:**

- React 18 + TypeScript
- Vite для сборки
- TailwindCSS + ShadCN UI
- Framer Motion для анимаций
- @dnd-kit для drag & drop
- SWR для управления состоянием
- React Router для навигации

**Telegram Bot:**

- Telegraf.js
- Tesseract.js для OCR
- QRCode генерация
- Axios для API запросов

## 🚀 Быстрый старт

### Автоматическая установка (Windows)

1. **Клонируйте репозиторий:**

```bash
git clone <repository-url>
cd student-work-analysis
```

2. **Запустите скрипт установки:**

```powershell
.\setup.ps1
```

3. **Получите токен Telegram бота:**

   - Напишите @BotFather в Telegram
   - Создайте нового бота: `/newbot`
   - Скопируйте полученный токен

4. **Настройте окружение:**

   - Откройте файл `.env`
   - Вставьте ваш `BOT_TOKEN`
   - При необходимости измените другие параметры

5. **Запустите все сервисы:**

```powershell
.\scripts\dev.ps1
```

### Ручная установка

<details>
<summary>Развернуть инструкцию по ручной установке</summary>

**Требования:**

- Node.js 18+
- npm или yarn
- Git

**Backend:**

```bash
cd backend
npm install
npm run dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

**Bot:**

```bash
cd bot
npm install
npm run dev
```

</details>

## 📱 Использование

### Настройка Telegram бота

1. После запуска бота будет создан QR-код в папке `bot/`
2. Поделитесь QR-кодом или ссылкой `t.me/your_bot_username` со студентами
3. Студенты начинают работу командой `/start`

### Веб-интерфейс преподавателя

1. Откройте http://localhost:5173
2. Войдите с учетными данными:
   - **Логин:** `teacher`
   - **Пароль:** `admin123`
3. Используйте панель управления для просмотра и оценки работ

## 🔧 Конфигурация

### Переменные окружения (.env)

```env
# Bot Configuration
BOT_TOKEN=your-telegram-bot-token-here
BOT_USERNAME=your_bot_username

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Security
JWT_SECRET=your-super-secret-jwt-key

# Upload Settings
MAX_FILE_SIZE=20971520  # 20MB
```

### Настройка оценок ИИ

Редактируйте файл `backend/server.js`, массив `aiGradeBook` для изменения предустановленных отзывов.

## 📦 Развертывание в продакшн

### Docker (рекомендуется)

```powershell
.\scripts\deploy.ps1 -UseDocker -Domain "yourdomain.com"
```

### Обычное развертывание

```powershell
.\scripts\deploy.ps1 -Domain "yourdomain.com" -SetupSSL
```

### Настройка веб-сервера (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Фронтенд
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Загруженные файлы
    location /uploads {
        proxy_pass http://localhost:3001;
    }
}
```

## 🔒 Безопасность

- JWT токены для авторизации преподавателей
- Проверка типов загружаемых файлов
- Ограничение размера файлов (20MB по умолчанию)
- Helmet.js для защиты Express приложения
- CORS настройки
- Валидация пользовательского ввода

## 🐛 Отладка

### Логи сервисов

```powershell
# Просмотр логов всех сервисов
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только bot
docker-compose logs -f bot
```

### Частые проблемы

**Бот не отвечает:**

- Проверьте правильность `BOT_TOKEN`
- Убедитесь что бот запущен: `/start` в @BotFather

**Файлы не загружаются:**

- Проверьте права доступа к папке `uploads/`
- Убедитесь что размер файла не превышает лимит

**Ошибки компиляции frontend:**

- Удалите `node_modules/` и выполните `npm install`
- Проверьте версию Node.js (требуется 18+)

## 📈 Мониторинг

Система включает:

- WebSocket подключения для real-time обновлений
- Статистика работ на дашборде
- Логирование всех операций
- Отслеживание ошибок

## 🤝 Разработка

### Структура проекта

```
├── backend/          # Express API сервер
├── frontend/         # React приложение
├── bot/             # Telegram бот
├── uploads/         # Загруженные файлы
├── scripts/         # Скрипты развертывания
└── docs/           # Документация
```

### Добавление новых функций

1. Backend API: `backend/server.js`
2. Frontend компоненты: `frontend/src/components/`
3. Telegram бот: `bot/bot.js`

## 📋 TODO / Будущие улучшения

- [ ] Интеграция с настоящими моделями ИИ
- [ ] Экспорт результатов в Excel/PDF
- [ ] Групповая оценка работ
- [ ] Email уведомления
- [ ] Система комментариев студентов
- [ ] Интеграция с LMS системами
- [ ] Мобильное приложение
- [ ] Аналитика и отчеты

## 📄 Лицензия

MIT License - смотрите файл LICENSE для деталей.

## 🆘 Поддержка

Если возникли вопросы или проблемы:

1. Проверьте раздел "Частые проблемы" выше
2. Создайте Issue в репозитории
3. Обратитесь к документации API

---

**Создано с ❤️ для образования и автоматизации рутинных процессов преподавания.**
