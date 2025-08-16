require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const { pool, initDB } = require('./config/db');
const { setupSocket } = require('./sockets/index');

const app = express();
const PORT = 80;


initDB();


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');


const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});


const initBot = require('./telegram/bot');
const bot = initBot(io);
bot.launch();


const router = require('./routes/index')(bot);
app.use('/', router);


setupSocket(io);





server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});