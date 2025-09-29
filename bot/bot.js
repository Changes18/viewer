const { Telegraf } = require('telegraf');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { createWorker } = require('tesseract.js');
const QRCode = require('qrcode');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Проверяем токен бота
if (!process.env.BOT_TOKEN) {
    console.error('❌ BOT_TOKEN не найден в .env файле');
    console.error('📁 Проверьте файл .env в корне проекта');
    process.exit(1);
}

console.log('✅ BOT_TOKEN найден');
const bot = new Telegraf(process.env.BOT_TOKEN);

// Конфигурация
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'bot');

// Создаем директорию для загрузок если её нет
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// OCR Worker - создаём один раз для переиспользования
let ocrWorker = null;

async function initializeOCR() {
    try {
        ocrWorker = await createWorker();
        await ocrWorker.loadLanguage('eng+rus');
        await ocrWorker.initialize('eng+rus');
        console.log('✅ OCR инициализирован');
    } catch (error) {
        console.error('❌ Ошибка инициализации OCR:', error);
    }
}

// Инициализируем OCR при запуске
initializeOCR();

// Заранее подготовленные сообщения для "ИИ анализа"
const motivationalMessages = [
    "🎨 Отличная креативность в подходе к решению задачи!",
    "✨ Видно понимание основ композиции и цвета!",
    "🌟 Интересное дизайнерское решение!",
    "🎯 Хорошее владение инструментами!",
    "💡 Творческий подход впечатляет!",
    "🚀 Профессиональное выполнение работы!",
    "🏆 Качественная проработка деталей!",
    "⭐ Превосходное техническое исполнение!",
    "🎪 Высокий уровень профессионализма!",
    "🌈 Отличное чувство пропорций и баланса!",
    "🎭 Великолепная цветовая гармония!",
    "🎪 Мастерское владение техникой!",
    "🔥 Впечатляющая детализация работы!",
    "⚡ Современный и актуальный подход!",
    "🎨 Безупречное качество исполнения!",
    "🏅 Работа демонстрирует высокие навыки!",
    "✨ Отличная концептуальная проработка!",
    "🌟 Профессиональный уровень мастерства!",
    "🎪 Креативное решение поставленной задачи!",
    "🚀 Инновационный подход к работе!",
    "🏆 Выдающееся художественное решение!",
    "💎 Высококачественная техническая подача!",
    "🌈 Гармоничное сочетание всех элементов!",
    "⭐ Мастерский уровень детализации!"
];

// Утилиты для работы с файлами
async function downloadTelegramFile(fileId, fileName) {
    try {
        const fileUrl = await bot.telegram.getFileLink(fileId);
        const response = await axios.get(fileUrl, { responseType: 'stream' });
        
        const filePath = path.join(UPLOAD_DIR, fileName);
        const writer = fs.createWriteStream(filePath);
        
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        throw error;
    }
}

// OCR обработка изображения
async function extractTextFromImage(imagePath) {
    try {
        if (!ocrWorker) {
            await initializeOCR();
        }
        
        const { data: { text } } = await ocrWorker.recognize(imagePath);
        return text.trim();
    } catch (error) {
        console.error('OCR ошибка:', error);
        return 'Текст не распознан';
    }
}

// Имитация ИИ анализа
function generateAIFeedback(extractedText = '', fileName = '') {
    // Базовые оценки (только высокие, не ниже 80)
    const scores = [80, 82, 84, 85, 87, 88, 90, 91, 92, 94, 95, 96, 97, 98, 99];
    const randomScore = scores[Math.floor(Math.random() * scores.length)];
    
    let feedback = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    
    // Добавляем "персонализированный" анализ на основе содержимого
    const analysisPoints = [];
    
    // Фейковый анализ на основе названия файла
    if (fileName.toLowerCase().includes('дизайн') || fileName.toLowerCase().includes('design')) {
        analysisPoints.push("📐 Обнаружены элементы графического дизайна");
    }
    if (fileName.toLowerCase().includes('проект') || fileName.toLowerCase().includes('project')) {
        analysisPoints.push("📋 Структурированный подход к проекту");
    }
    
    // Фейковый анализ на основе OCR текста
    if (extractedText && extractedText.length > 10) {
        const text = extractedText.toLowerCase();
        if (text.includes('цвет') || text.includes('color')) {
            analysisPoints.push("🎨 Хорошая работа с цветом");
        }
        if (text.includes('текст') || text.includes('шрифт') || text.includes('font')) {
            analysisPoints.push("✍️ Качественная типографика");
        }
        if (text.includes('композиция') || text.includes('layout')) {
            analysisPoints.push("🖼️ Грамотная композиция");
        }
    }
    
    // Общие позитивные моменты если ничего не найдено
    if (analysisPoints.length === 0) {
        const defaultPoints = [
            "✨ Креативное решение задачи",
            "🎯 Хорошее понимание требований",
            "💡 Оригинальный подход",
            "🚀 Качественное исполнение"
        ];
        analysisPoints.push(defaultPoints[Math.floor(Math.random() * defaultPoints.length)]);
    }
      const areas = [
        "Попробуйте поэкспериментировать с контрастом",
        "Рассмотрите возможность добавления больше белого пространства", 
        "Отлично! Продолжайте развивать свой стиль",
        "Хорошая основа для дальнейшего совершенствования"
    ];
    const randomArea = areas[Math.floor(Math.random() * areas.length)];
    
    // Определяем grade level на основе оценки для соответствия дашборду
    let gradeLevel = 'excellent'; // по умолчанию
    let gradeNumber = '1';
    let gradeText = 'Отлично';
    
    if (randomScore >= 95) {
        gradeLevel = 'excellent';
        gradeNumber = '1';
        gradeText = 'Отлично';
    } else if (randomScore >= 85) {
        gradeLevel = 'good';
        gradeNumber = '2';
        gradeText = 'Хорошо';
    } else {
        gradeLevel = 'needs_work';
        gradeNumber = '3';
        gradeText = 'Доработать';
    }
    
    return {
        score: randomScore,
        gradeLevel,
        gradeNumber,
        gradeText,
        feedback: `${feedback}\n\n📊 **Анализ работы:**\n${analysisPoints.join('\n')}\n\n💡 **Рекомендации:** ${randomArea}\n\n🎯 **Предварительная оценка: ${gradeNumber}/3 (${gradeText}) - ${randomScore}/100**\n\n⏳ *Окончательную оценку выставит преподаватель*`
    };
}

// Отправка данных в backend API
async function submitToAPI(submissionData) {
    try {
        const response = await axios.post(`${API_BASE_URL}/api/webhook/submission`, submissionData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Ошибка отправки в API:', error.message);
        throw error;
    }
}

// Команда /start
bot.start((ctx) => {
    const welcomeMessage = `
🎓 **Добро пожаловать в систему анализа студенческих работ!**

Я помогу вам получить обратную связь по вашему проекту от ИИ-анализатора.

📋 **Как это работает:**
1️⃣ Отправьте мне фото или PDF вашей работы
2️⃣ Я проанализирую её с помощью ИИ
3️⃣ Получите подробную обратную связь и оценку

📎 **Поддерживаемые форматы:**
• Изображения (JPG, PNG)
• PDF документы
• Максимальный размер: 20 МБ

🚀 **Готовы начать?** Просто отправьте мне свою работу!
    `;
    
    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [{ text: '📚 Примеры работ', callback_data: 'examples' }],
                [{ text: '❓ Часто задаваемые вопросы', callback_data: 'faq' }],
                [{ text: '📊 Критерии оценки', callback_data: 'criteria' }]
            ]
        }
    };
    
    ctx.reply(welcomeMessage, { 
        parse_mode: 'Markdown',
        ...keyboard
    });
});

// Обработка callback кнопок
bot.on('callback_query', (ctx) => {
    const action = ctx.callbackQuery.data;
    
    switch (action) {
        case 'examples':
            ctx.answerCbQuery();
            ctx.reply(`
📚 **Примеры качественных работ:**

🎨 **Графический дизайн:**
• Четкая композиция
• Гармоничные цвета
• Читаемая типографика

📱 **UI/UX дизайн:**
• Интуитивная навигация
• Адаптивность
• Пользовательский опыт

📊 **Презентации:**
• Структурированная информация
• Визуальная иерархия
• Качественные изображения
            `, { parse_mode: 'Markdown' });
            break;
            
        case 'faq':
            ctx.answerCbQuery();
            ctx.reply(`
❓ **Часто задаваемые вопросы:**

**Q: Какие файлы можно загружать?**
A: JPG, PNG изображения и PDF документы до 20 МБ

**Q: Как долго обрабатывается работа?**
A: Обычно 10-30 секунд

**Q: Можно ли загрузить работу повторно?**
A: Да, вы можете отправлять несколько вариантов

**Q: Кто увидит мою работу?**
A: Ваш преподаватель через веб-интерфейс системы
            `, { parse_mode: 'Markdown' });
            break;
            
        case 'criteria':
            ctx.answerCbQuery();
            ctx.reply(`
📊 **Критерии оценки ИИ:**

🎨 **Визуальные элементы (30%):**
• Композиция и баланс
• Цветовая гармония
• Типографика

💡 **Креативность (25%):**
• Оригинальность решения
• Инновационный подход

🎯 **Техническое исполнение (25%):**
• Качество работы
• Внимание к деталям

📋 **Соответствие заданию (20%):**
• Выполнение требований
• Целостность концепции
            `, { parse_mode: 'Markdown' });
            break;
    }
});

// Обработка фотографий
bot.on('photo', async (ctx) => {
    const processingMsg = await ctx.reply('🔄 Обрабатываю ваше изображение...\nЭто может занять несколько секунд');
    
    try {
        // Получаем изображение максимального качества
        const photos = ctx.message.photo;
        const bestPhoto = photos[photos.length - 1];
        
        // Генерируем имя файла
        const fileName = `photo_${Date.now()}_${ctx.from.id}.jpg`;
        
        // Загружаем файл
        await ctx.telegram.editMessageText(
            ctx.chat.id, 
            processingMsg.message_id, 
            null,
            '📥 Загружаю изображение...'
        );
        
        const filePath = await downloadTelegramFile(bestPhoto.file_id, fileName);
        
        // OCR обработка
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            processingMsg.message_id, 
            null,
            '🔍 Анализирую содержимое изображения...'
        );
        
        const extractedText = await extractTextFromImage(filePath);
        
        // Генерация ИИ фидбека
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            processingMsg.message_id,
            null, 
            '🤖 ИИ анализирует вашу работу...'
        );
          const aiResult = generateAIFeedback(extractedText, fileName);
        
        // Подготовка данных для API
        const submissionData = {
            studentId: ctx.from.id,
            studentName: `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim(),
            fileName,
            fileUrl: `/uploads/bot/${fileName}`,
            fileType: 'image',
            extractedText,
            telegramFileId: bestPhoto.file_id,
            aiScore: aiResult.score,
            aiComment: aiResult.feedback
        };
        
        // Отправляем в backend
        await submitToAPI(submissionData);
        
        // Удаляем сообщение об обработке
        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
          // Отправляем результат
        const resultMessage = `
🎉 **Анализ завершен!**

${aiResult.feedback}

📤 Ваша работа отправлена преподавателю для финальной оценки.
🏆 **Предварительная оценка ИИ: ${aiResult.gradeNumber}/3 (${aiResult.gradeText})**

🔄 Хотите отправить еще одну работу? Просто загрузите новый файл!
        `;
        
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📤 Загрузить еще работу', callback_data: 'upload_more' }],
                    [{ text: '📊 Критерии оценки', callback_data: 'criteria' }]
                ]
            }
        };
        
        await ctx.reply(resultMessage, { 
            parse_mode: 'Markdown',
            ...keyboard
        });
        
        console.log(`✅ Обработано изображение от ${submissionData.studentName} (${ctx.from.id})`);
        
    } catch (error) {
        console.error('Ошибка обработки фото:', error);
        
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            processingMsg.message_id,
            null,
            '❌ Произошла ошибка при обработке изображения. Попробуйте еще раз или обратитесь к преподавателю.'
        );
    }
});

// Обработка документов (PDF)
bot.on('document', async (ctx) => {
    const document = ctx.message.document;
    
    // Проверяем тип файла
    if (!document.mime_type.includes('pdf') && !document.mime_type.includes('image')) {
        return ctx.reply('❌ Поддерживаются только изображения (JPG, PNG) и PDF документы.');
    }
    
    // Проверяем размер файла (20MB лимит)
    if (document.file_size > 20 * 1024 * 1024) {
        return ctx.reply('❌ Размер файла не должен превышать 20 МБ.');
    }
    
    const processingMsg = await ctx.reply('📄 Обрабатываю ваш документ...');
    
    try {
        const fileName = document.file_name || `document_${Date.now()}_${ctx.from.id}.pdf`;
        
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            processingMsg.message_id,
            null,
            '📥 Загружаю документ...'
        );
        
        await downloadTelegramFile(document.file_id, fileName);
        
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            processingMsg.message_id,
            null,
            '🤖 ИИ анализирует документ...'
        );
          // Для PDF просто генерируем фидбек без OCR
        const aiResult = generateAIFeedback('', fileName);
        
        const submissionData = {
            studentId: ctx.from.id,
            studentName: `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim(),
            fileName,
            fileUrl: `/uploads/bot/${fileName}`,
            fileType: 'document',
            extractedText: 'PDF документ',
            telegramFileId: document.file_id,
            aiScore: aiResult.score,
            aiComment: aiResult.feedback
        };
        
        await submitToAPI(submissionData);
        
        await ctx.telegram.deleteMessage(ctx.chat.id, processingMsg.message_id);
        
        const resultMessage = `
📄 **PDF документ проанализирован!**

${aiResult.feedback}

📤 Документ отправлен преподавателю для оценки.
        `;
        
        await ctx.reply(resultMessage, { parse_mode: 'Markdown' });
        
        console.log(`✅ Обработан PDF от ${submissionData.studentName} (${ctx.from.id})`);
        
    } catch (error) {
        console.error('Ошибка обработки документа:', error);
        
        await ctx.telegram.editMessageText(
            ctx.chat.id,
            processingMsg.message_id,
            null,
            '❌ Произошла ошибка при обработке документа. Попробуйте еще раз.'
        );
    }
});

// Обработка текстовых сообщений
bot.on('text', (ctx) => {
    if (ctx.message.text.startsWith('/')) return; // Игнорируем команды
    
    ctx.reply(`
🤖 Я анализирую только изображения и PDF документы!

📋 **Что можно отправить:**
• 📸 Фотографии работ (JPG, PNG)
• 📄 PDF документы
• 📏 Максимальный размер: 20 МБ

💡 Просто прикрепите файл к сообщению и отправьте!
    `, { parse_mode: 'Markdown' });
});

// Обработка ошибок
bot.catch((err, ctx) => {
    console.error('Ошибка бота:', err);
    ctx.reply('❌ Произошла техническая ошибка. Попробуйте позже или обратитесь к администратору.');
});

// Graceful shutdown
process.once('SIGINT', async () => {
    console.log('🛑 Получен сигнал SIGINT. Завершаю работу бота...');
    if (ocrWorker) {
        await ocrWorker.terminate();
    }
    bot.stop('SIGINT');
});

process.once('SIGTERM', async () => {
    console.log('🛑 Получен сигнал SIGTERM. Завершаю работу бота...');
    if (ocrWorker) {
        await ocrWorker.terminate(); 
    }
    bot.stop('SIGTERM');
});

// Генерация QR-кода для бота
async function generateBotQR() {
    try {
        const botUsername = process.env.BOT_USERNAME || 'your_bot_username';
        const botUrl = `https://t.me/${botUsername}`;
        
        const qrPath = path.join(__dirname, 'bot_qr.png');
        await QRCode.toFile(qrPath, botUrl, {
            width: 400,
            margin: 2
        });
        
        console.log(`📱 QR-код сохранен: ${qrPath}`);
        console.log(`🔗 Ссылка на бота: ${botUrl}`);
    } catch (error) {
        console.error('Ошибка генерации QR-кода:', error);
    }
}

// Запуск бота
console.log('🚀 Запуск Telegram бота...');
generateBotQR();
bot.launch();

console.log('✅ Telegram бот запущен и готов к работе!');
console.log('📱 Студенты могут начать работу командой /start');
