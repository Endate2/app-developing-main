require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { pool, initDB } = require('./config/db');
const router = require('./routes/index');
const bot = require('./telegram/bot');
const { setupSocket } = require('./sockets/index');
const paymentService = require('./paymentService');

const app = express();
const PORT = 80;

// Инициализация базы данных
initDB();

// Настройка статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Установка движка шаблонов
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// Маршруты
app.use('/', router);

app.post('/api/create-crypto-invoice', express.json(), async (req, res) => {
    try {
        const { amount, duration } = req.body;
        const result = await paymentService.createCryptoInvoice(amount, duration);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создание HTTP-сервера и WebSocket
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Настройка WebSocket
setupSocket(io);

// Запуск бота
bot.launch();

app.get('/payment', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'payment_page.html'));
});

app.get('/create_advertisement', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'create_advertisement.html'));
});

app.post('/api/crypto-pay-webhook', express.json(), async (req, res) => {
    try {
        const data = req.body.payload;  // основной объект с данными платежа
        const status = data.status;

        if (status === 'paid') {
            const payloadData = typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;
            const { channel_id, duration } = payloadData;

            await paymentService.postToChannel();

            console.log(`Оплата успешна. Канал: ${channel_id}, длительность: ${duration}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Ошибка обработки вебхука:', error);
        res.status(500).json({ error: error.message });
    }
});


server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});