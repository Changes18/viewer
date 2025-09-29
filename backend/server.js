console.log('=== Backend server started. Allowed origins:', [
    'http://localhost:5173',
    'https://viewer-plum-alpha.vercel.app'
]);
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
    'http://localhost:5173',
    'https://viewer-plum-alpha.vercel.app',
    'https://viewer-eoqhy1aps-changes18s-projects.vercel.app',
    'https://viewer-jszv-g3pg5ukp4-changes18s-projects.vercel.app',
    'https://viewer-jszv.vercel.app'
];
app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps, curl, etc)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files для загруженных изображений с CORS заголовками
app.use('/uploads', (req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// In-memory database для демо (в продакшене используйте настоящую БД)
let submissions = [];
let users = [
    {
        id: 1,
        username: 'teacher',
        password: '$2a$10$2YZiPOFuBJX2wEQ2CBdTpuakyBX6DW1LQAxWe8jEqKB9OrP/6rUbu', // password: admin123
        role: 'teacher'
    },
    {
        id: 2,
        username: 'student1',
        password: '$2a$10$2YZiPOFuBJX2wEQ2CBdTpuakyBX6DW1LQAxWe8jEqKB9OrP/6rUbu', // password: admin123
        role: 'student'
    },
    {
        id: 3,
        username: 'student2',
        password: '$2a$10$2YZiPOFuBJX2wEQ2CBdTpuakyBX6DW1LQAxWe8jEqKB9OrP/6rUbu', // password: admin123
        role: 'student'
    },
    {
        id: 4,
        username: 'student3',
        password: '$2a$10$2YZiPOFuBJX2wEQ2CBdTpuakyBX6DW1LQAxWe8jEqKB9OrP/6rUbu', // password: admin123
        role: 'student'
    }
];

// Хранилище для сокетов WebSocket
let connectedClients = [];

// Настройка Multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Недопустимый тип файла. Разрешены только JPEG, PNG и PDF.'));
        }
    }
});

// Middleware для проверки JWT токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Требуется токен авторизации' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
};

// Заранее подготовленные положительные отзывы ИИ
const aiGradeBook = [
    {
        score: 85,
        feedback: "Отличная работа! Ваш дизайн демонстрирует хорошее понимание композиции и цветовой гармонии. Сильные стороны: креативный подход к решению задачи. Возможные улучшения: добавить больше контраста в ключевых элементах."
    },
    {
        score: 92,
        feedback: "Превосходное выполнение задания! Видно глубокое понимание принципов дизайна. Особенно впечатляет работа с типографикой и пространством. Продолжайте в том же духе!"
    },
    {
        score: 80,
        feedback: "Хорошая работа с интересными идеями. Заметно внимание к деталям и качественное исполнение. Рекомендации: экспериментируйте больше с масштабом элементов для создания визуальной иерархии."
    },
    {
        score: 88,
        feedback: "Творческое и профессиональное решение! Отличное использование цвета и формы. Ваша работа показывает развитое чувство стиля. Небольшое улучшение: добавить больше воздуха в композицию."
    },
    {
        score: 95,
        feedback: "Исключительная работа! Все элементы гармонично взаимодействуют друг с другом. Прекрасное владение инструментами и техниками. Это пример качественного дизайнерского мышления."
    },
    {
        score: 82,
        feedback: "Сильная работа с хорошими концептуальными решениями. Видно понимание целевой аудитории. Области для роста: поработать над балансом между текстом и изображениями."
    },
    {
        score: 90,
        feedback: "Отличное техническое исполнение и креативность! Ваш подход к решению задачи впечатляет. Особенно удачно подобрана цветовая палитра. Продолжайте развивать свой уникальный стиль."
    },
    {
        score: 83,
        feedback: "Добротная работа с интересными находками. Хорошо проработаны детали и общая концепция. Совет: попробуйте поэкспериментировать с более смелыми композиционными решениями."
    },
    {
        score: 87,
        feedback: "Великолепное понимание принципов визуального дизайна! Четкая композиция и продуманная цветовая схема. Ваше техническое мастерство на высоком уровне. Рекомендация: добавить больше динамики в статичные элементы."
    },
    {
        score: 91,
        feedback: "Профессиональный уровень исполнения! Видна тщательная проработка каждого элемента. Отличное чувство пропорций и ритма. Особенно удачно решена задача с ограниченной цветовой палитрой."
    },
    {
        score: 84,
        feedback: "Качественная работа с хорошей концептуальной основой. Заметен индивидуальный подход к решению задачи. Сильные стороны: внимание к деталям. Совет: поработать над унификацией стилей элементов."
    },
    {
        score: 89,
        feedback: "Впечатляющее владение цветом и формой! Ваша работа демонстрирует зрелое понимание дизайн-процесса. Особенно хорошо проработана визуальная иерархия. Продолжайте в этом направлении!"
    },
    {
        score: 93,
        feedback: "Выдающаяся работа! Креативное решение с безупречным техническим исполнением. Видно глубокое понимание задачи и аудитории. Ваш подход к композиции заслуживает особого внимания."
    },
    {
        score: 81,
        feedback: "Хорошая работа с продуманным подходом к решению. Заметны навыки работы с пространством и масштабом. Рекомендации: экспериментировать с более контрастными цветовыми сочетаниями для усиления воздействия."
    },
    {
        score: 86,
        feedback: "Сильное дизайнерское решение! Отличная работа с типографикой и общей композицией. Ваш творческий подход выделяет работу среди других. Небольшая корректировка: усилить акценты на ключевых элементах."
    },
    {
        score: 94,
        feedback: "Мастерское выполнение задания! Все аспекты работы находятся на высочайшем уровне. Превосходная гармония между функциональностью и эстетикой. Это пример того, как должен выглядеть качественный дизайн."
    },
    {
        score: 80,
        feedback: "Добротная работа с интересными идеями. Видно понимание основ композиции и цвета. Хорошо проработанные детали. Область для развития: больше экспериментов с нестандартными решениями."
    },
    {
        score: 88,
        feedback: "Отличное техническое исполнение! Ваша работа показывает зрелый подход к дизайну. Особенно удачно решены вопросы читаемости и визуального воздействия. Совет: добавить больше эмоциональности в решения."
    },
    {
        score: 92,
        feedback: "Превосходная работа с глубоким пониманием задачи! Креативный подход сочетается с профессиональным исполнением. Ваше чувство стиля и владение инструментами на очень высоком уровне."
    },
    {
        score: 85,
        feedback: "Качественное и продуманное решение! Видна систематичность в подходе и внимание к пользовательскому опыту. Хорошая работа с визуальной иерархией. Рекомендация: усилить контраст для лучшей читаемости."
    },
    {
        score: 90,
        feedback: "Впечатляющая работа! Отличное сочетание креативности и функциональности. Ваш подход к использованию пространства заслуживает похвалы. Техническое исполнение на профессиональном уровне."
    },
    {
        score: 83,
        feedback: "Хорошая концептуальная работа с интересными находками. Заметно развитое чувство композиции. Сильные стороны: работа с деталями и общая гармония. Совет: поэкспериментировать с масштабами элементов."
    },
    {
        score: 87,
        feedback: "Сильное дизайнерское решение! Видно понимание современных трендов и классических принципов. Отличная работа с цветом и формой. Ваш индивидуальный стиль начинает проявляться очень ярко."
    },
    {
        score: 96,
        feedback: "Исключительное мастерство! Ваша работа демонстрирует глубокое понимание всех аспектов дизайна. Безупречное техническое исполнение и креативный подход. Это работа профессионального уровня!"
    },
    {
        score: 82,
        feedback: "Добротная работа с хорошими идеями. Заметен продуманный подход к решению задачи. Качественная проработка деталей. Область для роста: больше смелости в цветовых и композиционных решениях."
    },
    {
        score: 89,
        feedback: "Отличная работа с сильной концепцией! Ваш подход к визуальной коммуникации очень эффективен. Особенно хорошо проработана типографика. Продолжайте развивать свой уникальный стиль!"
    },
    {
        score: 91,
        feedback: "Превосходное выполнение с глубоким пониманием задачи! Креативное решение сочетается с безупречным техническим исполнением. Ваша работа с пространством и ритмом заслуживает особого внимания."
    },
    {
        score: 84,
        feedback: "Качественная работа с хорошим пониманием принципов дизайна. Видна тщательная проработка каждого элемента. Сильные стороны: композиция и цветовое решение. Совет: добавить больше контраста для усиления воздействия."
    },
    {
        score: 88,
        feedback: "Впечатляющее решение! Отличное владение инструментами и понимание задач дизайна. Ваш творческий подход выделяет работу. Особенно удачно решены вопросы визуальной иерархии и читаемости."
    },
    {
        score: 93,
        feedback: "Выдающаяся работа профессионального уровня! Все элементы идеально сбалансированы и работают на общую идею. Ваше мастерство в области композиции и цвета достойно восхищения."
    },
    {
        score: 81,
        feedback: "Хорошая работа с интересными концептуальными решениями. Заметно внимание к деталям и общей гармонии. Техническое исполнение на хорошем уровне. Рекомендация: больше экспериментов с динамичными элементами."
    },
    {
        score: 86,
        feedback: "Сильное дизайнерское мышление! Ваш подход к решению задач креативен и эффективен. Отличная работа с пропорциями и ритмом. Видно понимание современных требований к дизайну."
    },
    {
        score: 95,
        feedback: "Мастерская работа! Идеальное сочетание творческого подхода и технического мастерства. Ваше решение демонстрирует глубокое понимание принципов визуальной коммуникации. Продолжайте в том же духе!"
    },
    {
        score: 80,
        feedback: "Добротное выполнение с хорошими идеями. Видна систематичность в подходе к работе. Качественная проработка основных элементов. Совет: поработать над созданием более ярких визуальных акцентов."
    },
    {
        score: 87,
        feedback: "Отличная работа с сильной концептуальной основой! Ваше понимание задач дизайна находится на высоком уровне. Особенно хорошо решены вопросы композиции и цветового баланса."
    },
    {
        score: 92,
        feedback: "Превосходное мастерство! Ваша работа демонстрирует зрелый подход к дизайну и глубокое понимание визуальной коммуникации. Техническое исполнение и креативность на очень высоком уровне."
    }
];

// API Routes

// Аутентификация
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Login attempt:', req.body);
        const { username, password } = req.body;
        
        console.log('Looking for user:', username);
        const user = users.find(u => u.username === username);
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }
        
        console.log('User found, checking password');
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ error: 'Неверные учетные данные' });
        }
        
        console.log('Creating JWT token');
        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        console.log('Login successful for:', username);
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Получение всех работ студентов
app.get('/api/submissions', authenticateToken, (req, res) => {
    try {
        const { sortBy = 'createdAt', order = 'desc', status } = req.query;
        
        let filteredSubmissions = [...submissions];
        
        if (status) {
            filteredSubmissions = filteredSubmissions.filter(s => s.status === status);
        }
        
        // Сортировка
        filteredSubmissions.sort((a, b) => {
            if (order === 'asc') {
                return a[sortBy] > b[sortBy] ? 1 : -1;
            } else {
                return a[sortBy] < b[sortBy] ? 1 : -1;
            }
        });
        
        res.json(filteredSubmissions);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        res.status(500).json({ error: 'Ошибка получения работ' });
    }
});

// Обновление оценки преподавателем
app.put('/api/submissions/:id/assess', authenticateToken, (req, res) => {
    try {
        const { id } = req.params;
        const { teacherGrade, teacherComment, status, newGrade } = req.body;
        
        const submissionIndex = submissions.findIndex(s => s.id === id);
        if (submissionIndex === -1) {
            return res.status(404).json({ error: 'Работа не найдена' });
        }
        
        const submission = submissions[submissionIndex];
        
        // Инициализируем массив оценок если его нет
        if (!submission.teacherGrades) {
            submission.teacherGrades = [];
        }
        
        // Добавляем новую оценку в массив
        if (newGrade) {
            submission.teacherGrades.push({
                id: newGrade.id || `${id}-${Date.now()}`,
                teacherName: req.user.username,
                grade: teacherGrade,
                gradeLevel: newGrade.gradeLevel || status,
                comment: teacherComment,
                assessedAt: new Date().toISOString()
            });
        }
        
        submissions[submissionIndex] = {
            ...submission,
            teacherGrade: teacherGrade || submission.teacherGrade,
            teacherComment: teacherComment || submission.teacherComment,
            status: status || submission.status,
            assessedAt: new Date().toISOString(),
            assessedBy: req.user.username
        };
        
        // Уведомление через WebSocket о изменениях
        connectedClients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(JSON.stringify({
                    type: 'submission_updated',
                    data: submissions[submissionIndex]
                }));
            }
        });
        
        res.json(submissions[submissionIndex]);    } catch (error) {
        console.error('Error assessing submission:', error);
        res.status(500).json({ error: 'Ошибка оценивания работы' });
    }
});

// Удаление работы студента
app.delete('/api/submissions/:id', authenticateToken, async (req, res) => {
    try {
        const submissionId = req.params.id; // Не преобразуем в число, так как это UUID
        const submissionIndex = submissions.findIndex(s => s.id === submissionId);
        
        if (submissionIndex === -1) {
            return res.status(404).json({ error: 'Работа не найдена' });
        }
        
        const submission = submissions[submissionIndex];
        
        // Удаляем файл с диска, если он существует
        if (submission.fileUrl) {
            const fs = require('fs').promises;
            const path = require('path');
            const filePath = path.join(__dirname, '..', submission.fileUrl);
            
            try {
                await fs.access(filePath);
                await fs.unlink(filePath);
                console.log('File deleted:', filePath);
            } catch (fileError) {
                console.log('File not found or already deleted:', filePath);
            }
        }
        
        // Удаляем работу из массива
        submissions.splice(submissionIndex, 1);
        
        // Уведомляем всех подключенных клиентов об удалении
        connectedClients.forEach(client => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({
                    type: 'submission_deleted',
                    data: { submissionId }
                }));
            }
        });
        
        res.json({ 
            success: true, 
            message: 'Работа успешно удалена',
            submissionId 
        });
        
    } catch (error) {
        console.error('Error deleting submission:', error);
        res.status(500).json({ error: 'Ошибка удаления работы' });
    }
});

// Webhook для получения данных от бота
app.post('/api/webhook/submission', async (req, res) => {
    try {
        console.log('📥 Webhook received data:', JSON.stringify(req.body, null, 2));
        
        const {
            studentId,
            studentName,
            fileUrl,
            fileName,
            extractedText,
            fileType,
            telegramFileId,
            aiScore,
            aiComment
        } = req.body;
        
        console.log('🎯 AI Score from bot:', aiScore);
        console.log('💬 AI Comment from bot:', aiComment ? aiComment.substring(0, 100) + '...' : 'No comment');
        
        // Используем оценку от бота, если она есть, иначе генерируем
        let finalAiScore, finalAiComment;
        
        if (aiScore && aiComment) {
            // Используем данные от бота
            finalAiScore = aiScore;
            finalAiComment = aiComment;
        } else {
            // Fallback: генерируем фейковую оценку ИИ (для старых версий бота)
            const randomGrade = aiGradeBook[Math.floor(Math.random() * aiGradeBook.length)];
            finalAiScore = randomGrade.score;
            finalAiComment = randomGrade.feedback;
            
            // Персонализируем отзыв на основе извлеченного текста
            if (extractedText && extractedText.length > 10) {
                const keywords = extractedText.toLowerCase();
                if (keywords.includes('дизайн') || keywords.includes('цвет')) {
                    finalAiComment += " Заметно хорошее понимание дизайнерских принципов в вашей работе.";
                }
                if (keywords.includes('текст') || keywords.includes('шрифт')) {
                    finalAiComment += " Отличная работа с типографикой!";
                }
            }
        }
        
        console.log('✅ Final AI Score that will be saved:', finalAiScore);
        console.log('📄 Final AI Comment length:', finalAiComment ? finalAiComment.length : 0);
        
        const submission = {
            id: uuidv4(),
            studentId: studentId.toString(),
            studentName: studentName || `Студент ${studentId}`,
            fileName,
            fileUrl,
            fileType,
            extractedText,
            aiScore: finalAiScore,
            aiComment: finalAiComment,
            teacherGrade: null,
            teacherComment: null,
            teacherGrades: [], // Массив для множественных оценок
            status: 'pending', // pending, excellent, good, needs_work
            createdAt: new Date().toISOString(),
            assessedAt: null,
            assessedBy: null,
            telegramFileId
        };
        
        submissions.push(submission);
        
        // Уведомление всех подключенных клиентов
        connectedClients.forEach(client => {
            if (client.readyState === 1) { // OPEN
                client.send(JSON.stringify({
                    type: 'new_submission',
                    data: submission
                }));
            }
        });
        
        console.log(`📝 Новая работа от ${studentName}: ${fileName}`);
        res.json({ success: true, submissionId: submission.id });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Ошибка обработки работы' });
    }
});

// Загрузка файлов
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не предоставлен' });
        }
        
        const fileUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            fileUrl,
            fileName: req.file.originalname,
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

// Статистика
app.get('/api/stats', authenticateToken, (req, res) => {
    try {
        const stats = {
            totalSubmissions: submissions.length,
            pendingReview: submissions.filter(s => s.status === 'pending').length,
            averageAiScore: submissions.length > 0 
                ? Math.round(submissions.reduce((sum, s) => sum + s.aiScore, 0) / submissions.length)
                : 0,
            recentSubmissions: submissions
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
        };
        
        res.json(stats);
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Ошибка получения статистики' });
    }
});

// WebSocket для real-time updates
const server = require('http').createServer(app);
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('🔗 Новое WebSocket подключение');
    connectedClients.push(ws);
    
    ws.on('close', () => {
        console.log('🔌 WebSocket отключение');
        connectedClients = connectedClients.filter(client => client !== ws);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Запуск сервера
server.listen(PORT, () => {
    console.log(`🚀 Backend сервер запущен на порту ${PORT}`);
    console.log(`📊 API доступен по адресу: http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket сервер готов для подключений`);
});

module.exports = app;
