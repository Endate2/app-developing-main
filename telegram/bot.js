const { Telegraf } = require('telegraf');
const { pool } = require('../config/db');
const { io } = require('../server');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.on('my_chat_member', async (ctx) => {
    const chatMember = ctx.update.my_chat_member;
    const chat = chatMember.chat;
    const userId = ctx.from.id;
    const newStatus = chatMember.new_chat_member.status;
    const oldStatus = chatMember.old_chat_member.status;

    if (newStatus === 'administrator') {
        try {
            const chatInfo = await ctx.telegram.getChat(chat.id);

            let photoUrl = null;
            if (chatInfo.photo) {
                const photoFileId = chatInfo.photo.big_file_id;
                const photoFile = await ctx.telegram.getFile(photoFileId);
                photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${photoFile.file_path}`;
            }

            let subscribersCount = 0;
            try {
                subscribersCount = await ctx.telegram.getChatMembersCount(chat.id);
                console.log(`Количество подписчиков для ${chat.title}: ${subscribersCount}`);
            } catch (err) {
                console.error('Ошибка при получении количества подписчиков:', err);
                await ctx.telegram.sendMessage(
                    userId,
                    `Не удалось получить количество подписчиков для канала ${chat.title}. Убедитесь, что я имею права администратора.`
                );
            }

            const userResult = await pool.query(
                'SELECT id FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                await pool.query(
                    'INSERT INTO users (id, username, first_name, last_name) VALUES ($1, $2, $3, $4)',
                    [userId, ctx.from.username, ctx.from.first_name, ctx.from.last_name]
                );
            }

            const channelResult = await pool.query(
                'SELECT id FROM all_channels WHERE id = $1',
                [chat.id]
            );

            if (channelResult.rows.length === 0) {
                await pool.query(
                    'INSERT INTO all_channels (id, name, subscribers, photo_url) VALUES ($1, $2, $3, $4)',
                    [chat.id, chat.title, subscribersCount, photoUrl]
                );
            } else {
                await pool.query(
                    'UPDATE all_channels SET name = $1, subscribers = $2, photo_url = $3 WHERE id = $4',
                    [chat.title, subscribersCount, photoUrl, chat.id]
                );
            }

            await pool.query(
                'INSERT INTO user_channels (user_id, channel_id) VALUES ($1, $2) ON CONFLICT (user_id, channel_id) DO NOTHING',
                [userId, chat.id]
            );

            const message = `Бот добавлен в канал: ${chat.title} (Подписчики: ${subscribersCount})`;
            console.log(message);

            io.emit('channel_added', {
                name: chat.title,
                id: chat.id,
                subscribers: subscribersCount,
                user_id: userId
            });

        } catch (err) {
            console.error('Error saving channel to DB:', err);
        }
    }else if (oldStatus === 'administrator' && newStatus !== 'administrator') {
        try {
            await pool.query(
                'DELETE FROM user_channels WHERE user_id = $1 AND channel_id = $2',
                [userId, chat.id]
            );

            const otherUsers = await pool.query(
                'SELECT 1 FROM user_channels WHERE channel_id = $1',
                [chat.id]
            );

            if (otherUsers.rows.length === 0) {
                await pool.query(
                    'DELETE FROM all_channels WHERE id = $1',
                    [chat.id]
                );
            }
            
            io.emit('channel_removed', {
                id: chat.id,
                user_id: userId
            });

            console.log(`Бот удален из канала: ${chat.title}`);

        } catch (err) {
            console.error('Error removing channel from DB:', err);
        }
    }
});

module.exports = bot;