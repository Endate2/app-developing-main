const { Telegraf } = require('telegraf');
const { pool } = require('../config/db');

module.exports = (io) => {
    const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
    const paymentDataState = new Map();

    bot.command('offer', async (ctx) => {
        await ctx.replyWithHTML(
            `📄 <b>Публичная оферта</b>\n\n` +
            `Для ознакомления с публичной офертой перейдите по ссылке:\n` +
            `🔗 <a href="https://teletype.in/@spb_port/jmUQh4Xj9SM">Просмотреть оферту</a>`
        );
    });


    bot.command('contacts', async (ctx) => {
        await ctx.replyWithHTML(
            `📞 <b>Контактная информация</b>\n\n` +
            `🏢 <b>ИНН:</b> 781431936886\n` +
            `💬 <b>Поддержка в телеграмм:</b> @spb_port\n` +
            `📧 <b>Контактный e-mail:</b> anton.chimirev@gmail.com\n\n` +
            `<i>Мы всегда рады помочь вам!</i>`
        );
    });

    bot.command('price', async (ctx) => {
        await ctx.reply(
            `💰 <b>Тарифы и комиссии</b>\n\n` +
            `Сервис берет <b>15%</b> от суммы вашей сделки.\n\n` +
            `<b>Пример расчета:</b>\n` +
            `• Пользователь выставил рекламный пост: <b>2000 рублей</b> на 30 часов\n` +
            `• После оплаты деньги поступают на промежуточный счёт\n` +
            `• Покупатель получит: <b>1700 рублей</b> через 24 часа\n` +
            `• Комиссия сервиса: <b>300 рублей</b>\n\n` +
            `⏰ <i>В течение 24 часов покупатель может отменить сделку при нарушении условий</i>`,
            { parse_mode: 'HTML' }
        );
    });
    bot.command('accepted_posts', async (ctx) => {
        const userId = ctx.from.id;
        paymentDataState.set(userId, { type: 'posts', data: null });

        await ctx.reply(
            `📋 <b>Проверка принятых постов</b>\n\n` +
            `Введите ID сделки для получения информации:\n` +
            `➖➖➖➖➖➖➖➖➖➖\n` +
            `❕ Для отмены введите /cancel`,
            { parse_mode: 'HTML' }
        );
    });
    bot.command('myposts', async (ctx) => {
        const userId = ctx.from.id;
        paymentDataState.set(userId, { type: 'userPosts', data: null });

        await ctx.reply(
            `📊 <b>Мои сделки</b>\n\n` +
            `Введите ID сделки для получения информации:\n` +
            `➖➖➖➖➖➖➖➖➖➖\n` +
            `❕ Для отмены введите /cancel`,
            { parse_mode: 'HTML' }
        );
    });

    bot.command('payment_methods', async (ctx) => {
    const userId = ctx.from.id;

    await pool.query(
        'INSERT INTO users (id, username, first_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [userId, ctx.from.username, ctx.from.first_name]
    );

    const result = await pool.query(`
        SELECT card_number, phone
        FROM payment_methods
        WHERE user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
        await ctx.replyWithHTML(
            `💳 <b>Платежные данные</b>\n\n` +
            `❌ Нет сохраненных платежных данных\n\n` +
            `Нажмите кнопку ниже чтобы добавить данные:`
            , {
                reply_markup: {
                    inline_keyboard: [[{
                        text: '➕ Добавить данные',
                        callback_data: 'changepaymentdata'
                    }]]
                }
            });
    } else {
        const paymentData = result.rows[0];
        const cardNumber = paymentData.card_number ?
            `💳 Карта: **** **** **** ${paymentData.card_number.toString().slice(-4)}` : '';
        const phone = paymentData.phone ?
            `📱 Телефон: ${paymentData.phone}` : '';

        const message = [cardNumber, phone].filter(Boolean).join('\n');

        await ctx.replyWithHTML(
            `💳 <b>Ваши платежные данные</b>\n\n` +
            `${message}\n\n` +
            `🛠 Для изменения данных нажмите кнопку ниже:`
            , {
                reply_markup: {
                    inline_keyboard: [[{
                        text: '✏️ Изменить данные',
                        callback_data: 'changepaymentdata'
                    }]]
                }
            });
    }
});


    bot.command('start', async (ctx) => {
        const userId = ctx.from.id;

        const messageText = ctx.message.text || '';
        const parts = messageText.split(' ');

        const referralCode = parts.length > 1 ? parts[1] : null;
        await pool.query(
            'INSERT INTO users (id, username, first_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
            [userId, ctx.from.username, ctx.from.first_name]
        );

        if (referralCode) {
            await pool.query(
                `INSERT INTO referal (user_id, is_referred) VALUES ($1, $2)
                    ON CONFLICT (user_id) DO NOTHING`,
                [userId, true]
            );


            try {
                const chatInfo = await bot.telegram.getChat(referralCode);
                const channelUsername = chatInfo.username;

                await ctx.replyWithHTML(
                    `🎉 <b>Добро пожаловать!</b>\n\n` +
                    `Вы воспользовались ссылкой на канал <b>@${channelUsername}</b>\n\n` +
                    `Нажмите кнопку ниже чтобы перейти в приложение:`
                    , {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: `🚀 Открыть канал`,
                                web_app: { url: `https://endate2-app-developing-main-cf8a.twc1.net?channel_id=${referralCode}`}
                            }]]
                        }
                    });
            }catch (e) {
                await ctx.replyWithHTML(
                    `⚠️ <b>Внимание</b>\n\n` +
                    `Данного канала не существует в приложении.\n\n` +
                    `Перейдите на главную страницу нашего приложения:`
                    , {
                        reply_markup: {
                            inline_keyboard: [[{
                                text: '🌐 Открыть приложение',
                                web_app: { url: 'https://endate2-app-developing-main-cf8a.twc1.net' }
                            }]]
                        }
                    });
            }
        } else {
            await ctx.replyWithHTML(
                `👋 <b>Добро пожаловать!</b>\n\n` +
                `Рады приветствовать вас в нашем сервисе!\n\n` +
                `Нажмите кнопку ниже чтобы открыть приложение:`
                , {
                    reply_markup: {
                        inline_keyboard: [[{
                            text: '📱 Открыть приложение',
                            web_app: { url: 'https://endate2-app-developing-main-cf8a.twc1.net' }
                        }]]
                    }
                });
        }
    });
    bot.command('cancel', async (ctx) => {
        const userId = ctx.from.id;
        if (paymentDataState.has(userId)) {
            paymentDataState.delete(userId);
            await ctx.reply(
                `❌ <b>Операция отменена</b>\n\n` +
                `Вы можете начать новую операцию с помощью команд меню.`,
                { parse_mode: 'HTML' }
            );
        } else {
            await ctx.reply(
                `ℹ️ <b>Нет активных операций</b>\n\n` +
                `Нечего отменять.`,
                { parse_mode: 'HTML' }
            );
        }
    });
    bot.on('text', async (ctx) => {
        try {
            const userId = ctx.from.id;
            const text = ctx.message.text.trim();
            const state = paymentDataState.get(userId);
            // Проверяем, ожидает ли пользователь ввода платежных данных
            if (state?.type === 'payment') {

                const parts = text.split(',');

                if (parts.length !== 2) {
                    await ctx.replyWithHTML(
                        `⚠️ <b>Неверный формат</b>\n\n` +
                        `Введите данные в формате: <code>номер_карты,телефон</code>\n\n` +
                        `<b>Пример:</b> <code>4000200010000000,+79215976307</code>\n\n` +
                        `❕ Для отмены введите /cancel`
                    );
                    return;
                }

                const cardNumber = parts[0].trim();
                const phone = parts[1].trim();

                // Проверка номера карты
                const cardValid = /^\d{16}$/.test(cardNumber);
                // Проверка номера телефона
                const phoneValid = /^\+\d{10,15}$/.test(phone);

                if (!cardValid || !phoneValid) {
                    await ctx.replyWithHTML(
                        `❌ <b>Ошибка валидации</b>\n\n` +
                        `Проверьте введенные данные:\n` +
                        `• Номер карты: 16 цифр\n` +
                        `• Телефон: начинается с + и содержит 10-15 цифр\n\n` +
                        `❕ Для отмены введите /cancel`
                    );
                    return;
                }

                // Обновляем данные в БД
                await pool.query(
                    `INSERT INTO payment_methods (user_id, card_number, phone) 
                    VALUES ($1, $2, $3)
                    ON CONFLICT (user_id)
                    DO UPDATE SET card_number = EXCLUDED.card_number, phone = EXCLUDED.phone
                    `,
                    [userId, cardNumber, phone]
                );
                paymentDataState.delete(userId);
                await ctx.replyWithHTML(
                    `✅ <b>Данные успешно сохранены!</b>\n\n` +
                    `💳 Карта: **** **** **** ${cardNumber.slice(-4)}\n` +
                    `📱 Телефон: ${phone}\n\n` +
                    `Теперь вы можете использовать эти данные для платежей.`
                );
            } else if (state?.type === 'posts') {
                const dealId = text.trim();

                if (!dealId) {
                    await ctx.reply('❌ Введите ID сделки');
                    return;
                }

                if (!/^\d+$/.test(dealId)) {
                    await ctx.reply('❌ ID сделки должен содержать только цифры (0-9)');
                    return;
                }

                if (dealId.startsWith('0') && dealId.length > 1) {
                    await ctx.reply('❌ ID сделки не должен начинаться с нуля');
                    return;
                }

                const dealIdNumber = Number(dealId);

                if (!Number.isInteger(dealIdNumber)) {
                    await ctx.reply('❌ ID сделки должен быть целым числом');
                    return;
                }

                if (dealIdNumber <= 0) {
                    await ctx.reply('❌ ID сделки должен быть положительным числом');
                    return;
                }

                try {
                    const result = await pool.query(
                        'SELECT * FROM deal WHERE advertisement_id = $1 LIMIT 1',
                        [dealIdNumber]
                    );

                    if (!result.rows.length) {
                        await ctx.reply('❌ Сделка с таким ID не найдена');
                        return;
                    }
                    const paymentStatus = result.rows[0].payment_status;
                    const clientId = result.rows[0].client_id;
                    const ownerId = result.rows[0].owner_channel_id;
                    if(paymentStatus === "получить оплату"){
                        await ctx.reply(`⚡️Можете получить оплату за сделку ⚡️`, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Перейти к получению оплаты',
                                            callback_data: `takepayment`
                                        },
                                    ]
                                ]
                            }
                        });
                    }else if(paymentStatus === "оплачена"){
                        await ctx.reply(`Подтвердите, что пост на сделку с id = ${dealIdNumber} был выложен️.`, {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: 'Подтвердить',
                                            callback_data: `confirmpost_${clientId}_${ownerId}_${dealIdNumber}`
                                        },
                                    ]
                                ]
                            }
                        });
                    }
                } catch (error) {
                    console.error('Database error:', error);
                    await ctx.reply('⚠️ Ошибка при проверке сделки. Попробуйте позже.');
                    return;
                }

                paymentDataState.delete(userId);
            }else if(state?.type === 'userPosts'){
                const dealId = text.trim();

                if (!dealId) {
                    await ctx.reply('❌ Введите ID сделки');
                    return;
                }

                if (!/^\d+$/.test(dealId)) {
                    await ctx.reply('❌ ID сделки должен содержать только цифры (0-9)');
                    return;
                }

                if (dealId.startsWith('0') && dealId.length > 1) {
                    await ctx.reply('❌ ID сделки не должен начинаться с нуля');
                    return;
                }

                const dealIdNumber = Number(dealId);

                if (!Number.isInteger(dealIdNumber)) {
                    await ctx.reply('❌ ID сделки должен быть целым числом');
                    return;
                }

                if (dealIdNumber <= 0) {
                    await ctx.reply('❌ ID сделки должен быть положительным числом');
                    return;
                }
                try {
                    const result = await pool.query(
                        `SELECT advertisements.price, advertisements.channel_id, advertisements.date_of_advertisement, d.payment_status
                        FROM advertisements 
                        JOIN deal d ON advertisements.id = d.advertisement_id 
                        WHERE d.client_id = $1 AND d.advertisement_id = $2`,
                        [userId,dealIdNumber]
                    );


                    if (!result.rows.length) {
                        await ctx.reply('❌ Сделка с таким ID не найдена');
                        return;
                    }
                    const { price, channel_id, date_of_advertisement, payment_status } = result.rows[0];
                    const chatInfo = await ctx.telegram.getChat(channel_id);
                    const channelUsername = chatInfo.username;
                    const text = `🏷️ Канал: @${channelUsername}

📅 Дата: ${new Date(date_of_advertisement).toDateString()}

💰 Цена: ${price}
                    
🕐 Статус: ${payment_status}
                    `;
                    try {
                        await ctx.telegram.sendMessage(userId, text);
                    } catch (err) {
                        console.error('Ошибка при отправке сообщения в Telegram:', err);
                    }

                } catch (error) {
                    console.error('Database error:', error);
                    await ctx.reply('⚠️ Ошибка при проверке сделки. Попробуйте позже.');
                    return;
                }
            }

        } catch (error) {
            console.error('Error in text handler:', error);
        }
    });

    bot.on('callback_query', async (ctx) => {
        try {
            const data = ctx.callbackQuery.data;
            const parts = data.split('_');
            const action = parts[0];
            try {
                if (action === 'accept') {
                    // Формат: accept_advertisementID_userIdFrom_userIdTo
                    const advertisementID = parts[1];
                    const userIdFrom = parts[2];
                    const userIdTo = parts[3];

                    await ctx.answerCbQuery();
                    
                    const response = await fetch(`https://endate2-app-developing-main-cf8a.twc1.net/api/get_advertisement?id=${advertisementID}`);
                    const result = await response.json();
                    const resp = await fetch('https://endate2-app-developing-main-cf8a.twc1.net/api/set-deal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            advertisementID: advertisementID,
                            userIdTo: userIdTo,
                            userIdFrom: userIdFrom,
                            price: result.price - Math.round(result.price * 0.15)
                        })
                    });

                    if (!result) {
                        throw new Error('Объявление не найдено');
                    }
                    const date = result.date_of_advertisement ? new Date(result.date_of_advertisement) : null;
                    const user = await bot.telegram.getChat(userIdFrom);
                    const userName = user.username
                    await createMessageAndSend(
                        userIdTo,
                        userIdFrom,
                        date,
                        result.price,
                        result.channel_id,
                        advertisementID
                    );
                    await ctx.editMessageText(`Свяжитесь с пользователем: @${userName} и обсудите пост.\n\nПосле этого покупатель должен подтвердить обсуждение, нажав кнопку, тогда он получит ссылку на оплату, а вам придет уведомление об успешной операции. ВАЖНО: Сделку можно отменить только до того как пользователь получил ссылку на оплату!`, {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: 'Отклонить сделку',
                                        callback_data: `fail_${advertisementID}`

                                    },
                                ]
                            ]
                        }

                    });

                }
                else if (action === 'pay') {
                    try {
                        const advertisementID = parts[1];
                        const userIdFrom = parts[2];
                        const price = parts[3];
                        const userIdTo = parts[4];
                        const chatId = ctx.from.id;
                        await ctx.answerCbQuery();
                        
                        const res = await fetch(`https://endate2-app-developing-main-cf8a.twc1.net/api/search_deals?id=${advertisementID}`);
                        const json = await res.json();
                        if(json.success){
                            const response = await fetch('https://endate2-app-developing-main-cf8a.twc1.net/api/create-payment-link', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    amount: price,
                                    userIdFrom: userIdFrom,
                                    userIdTo: userIdTo,
                                    orderNumber: advertisementID
                                })
                            });

                            const json = await response.json();

                            if (json.paymentUrl) {
                                await bot.telegram.sendMessage(chatId, `Перейдите по ссылке для оплаты рекламного поста:\n${json.paymentUrl}`);
                            } else {
                                await ctx.answerCbQuery("Ошибка создании ссылки на оплату");
                            }
                        }else{
                            await ctx.answerCbQuery("Владелец отклонил ваше предложение, поэтому оплата не доступна, либо вы уже получили ссылку на оплату");
                        }

                    } catch (err) {;
                        console.error('Ошибка при создании ссылки на оплату:', err);
                        await ctx.answerCbQuery(`Произошла ошибка: ${err.message}`);
                    }
                }

                else if (action === 'reject') {
                    await ctx.answerCbQuery();
                    await ctx.deleteMessage();
                }else if (action === 'changepaymentdata') {
                    await ctx.answerCbQuery("Функция изменения платежных данных");
                    const userId = ctx.from.id; // ДОБАВЬТЕ ЭТУ СТРОКУ
                    paymentDataState.set(userId, { type: 'payment', data: null });

                    await ctx.reply('Пожалуйста, введите данные в формате: номер_карты,телефон (например: 4000200010000000,+79215976307)');
                    await ctx.answerCbQuery();
                }
                else if (action === 'fail') {
                    const advertisementID = parts[1];
                    const chatId = ctx.from.id;
                    await ctx.answerCbQuery();
                    const response = await fetch('https://endate2-app-developing-main-cf8a.twc1.net/api/delete-deal', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            advertisementID: advertisementID
                        })
                    });
                    const json = await response.json();
                    if (json.success){
                        await bot.telegram.sendMessage(chatId, "Вы завершили сделку до оплаты пользователем");
                    }else{
                        await bot.telegram.sendMessage(chatId, "Нельзя удалить сделку, так она ону уже была оплачена или вы уже получили за нее оплату");
                    }
                }
                else if (action === 'no') {
                    const dealIdNumber = parts[1];
                    const clientID = parts[2];
                    const ownerID = parts[3];
                    await ctx.answerCbQuery();
                    const response = await fetch('https://endate2-app-developing-main-cf8a.twc1.net/api/set-deal-type', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            advertisementID: dealIdNumber
                        })
                    });
                    const json = await response.json();

                    if (json.success){
                        await bot.telegram.sendMessage(clientID, `Мнения разошлись, обратитесь в поддержку @spb_port по поводу сделки id = ${dealIdNumber}`);
                        await bot.telegram.sendMessage(ownerID, `Мнения разошлись, обратитесь в поддержку @spb_port по поводу сделки id = ${dealIdNumber}`);
                    }else{
                        await ctx.answerCbQuery(json.message);
                    }
                }
                else if (action === 'yes') {
                    const dealIdNumber = parts[1];
                    const clientID = parts[2];
                    const ownerID = parts[3];
                    await ctx.answerCbQuery();
                    const response = await fetch('https://endate2-app-developing-main-cf8a.twc1.net/api/set-deal-type-yes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            advertisementID: dealIdNumber
                        })
                    });
                    const json = await response.json();

                    if (json.success){
                        await bot.telegram.sendMessage(ownerID,
                            `✅ <b>Подтверждение получения поста</b>\n\n` +
                            `🎉 Покупатель подтвердил, что рекламный пост был успешно выложен!\n\n` +
                            `📋 <b>Детали сделки:</b>\n` +
                            `├ ID сделки: <code>${dealIdNumber}</code>\n` +
                            `├ Статус: ✅ Подтверждено\n` +
                            `└ Дата подтверждения: ${new Date().toLocaleString('ru-RU')}\n\n` +
                            `💰 <b>Информация о выплате:</b>\n` +
                            `• Средства будут доступны через: <b>24 часа</b>\n` +
                            `• Для получения оплаты используйте команду:\n` +
                            `  <code>/accepted_posts</code>\n\n`,
                            { parse_mode: 'HTML' }
                        );
                        await ctx.deleteMessage();
                    }else{
                        await ctx.answerCbQuery(json.message);
                    }
                }
                else if (action === 'confirmpost') {
                    const clientID = parts[1];
                    const ownerID = parts[2];
                    const dealIdNumber = parts[3];
                    const owner = await ctx.telegram.getChat(ownerID);
                    const ownerUsername = owner.username
                    await ctx.answerCbQuery();
                    const text = `Владелец канала @${ownerUsername} подтвердил, что пост был выложен. Вы согласны?

ПРЕДУПРЕЖДЕНИЕ: Если мнение сторон будут отличаться, то вам нужно будет обратиться в поддержку для дальнейшего расследования.
                  `;

                    const keyboard = {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Да',
                                    callback_data: `yes_${dealIdNumber}_${clientID}_${ownerID}`
                                },
                                {
                                    text: 'Нет',
                                    callback_data: `no_${dealIdNumber}_${clientID}_${ownerID}`
                                }
                            ]
                        ]
                    };


                    try {
                        await bot.telegram.sendMessage(clientID, text, {
                            reply_markup: keyboard
                        });
                    } catch (err) {
                        console.error('Ошибка при отправке сообщения в Telegram:', err);
                    }

                }
                else {
                    await ctx.answerCbQuery('Неизвестное действие!');
                }
            }catch (e) {
                console.error('Ошибка:', e);
                await ctx.answerCbQuery(`Ошибка: ${e.message || e}`, { show_alert: true });
            }

        } catch (error) {
            await ctx.deleteMessage();
            await ctx.answerCbQuery('Предложение было удалено в личном кабинете канала');
        }
    });
    bot.action('show_my_posts', async (ctx) => {
        await ctx.answerCbQuery();
        const userId = ctx.from.id;
        paymentDataState.set(userId, { type: 'userPosts', data: null });

        await ctx.replyWithHTML(
            `📊 <b>Просмотр моих сделок</b>\n\n` +
            `Для получения информации о сделке введите её ID:\n` +
            `➖➖➖➖➖➖➖➖➖➖\n` +
            `❕ Для отмены введите /cancel\n\n` +
            `💡 <i>ID сделки можно найти в уведомлениях о принятых предложениях</i>`
        );
    });
    bot.on('my_chat_member', async (ctx) => {
        try {
            const chatMember = ctx.update.my_chat_member;
            const chat = chatMember.chat;
            const userId = ctx.from.id;
            const newStatus = chatMember.new_chat_member.status;
            const oldStatus = chatMember.old_chat_member.status;

            if (newStatus === 'administrator') {
                try {
                    let channelUrl = null;
                    if (chat.username) {
                        channelUrl = `https://t.me/${chat.username}`;
                    }

                    let chatInfo;
                    try {
                        chatInfo = await ctx.telegram.getChat(chat.id);
                    } catch (error) {
                        console.error(`Ошибка при получении информации о чате ${chat.id}:`, error.message);
                        // Логируем дополнительную информацию
                        console.error('Детали ошибки:', {
                            chatId: chat.id,
                            chatTitle: chat.title,
                            userId: userId,
                            errorCode: error.response?.error_code,
                            errorDescription: error.response?.description
                        });
                        return; // Прерываем выполнение, так как без информации о чате продолжать нельзя
                    }

                    let description = null;
                    if (chatInfo.description) {
                        description = chatInfo.description;
                    }

                    let photoUrl = null;
                    if (chatInfo.photo) {
                        try {
                            const photoFileId = chatInfo.photo.big_file_id;
                            const photoFile = await ctx.telegram.getFile(photoFileId);
                            photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${photoFile.file_path}`;
                        } catch (error) {
                            console.error('Ошибка при получении фото канала:', error.message);
                        }
                    }

                    let subscribersCount = 0;
                    try {
                        subscribersCount = await ctx.telegram.getChatMembersCount(chat.id);
                        console.log(`Количество подписчиков для ${chat.title}: ${subscribersCount}`);
                    } catch (err) {
                        console.error('Ошибка при получении количества подписчиков:', {
                            error: err.message,
                            chatId: chat.id,
                            chatTitle: chat.title
                        });
                        await ctx.telegram.sendMessage(
                            userId,
                            `Не удалось получить количество подписчиков для канала ${chat.title}. Убедитесь, что я имею права администратора.`
                        );
                    }

                    // Остальной код остается без изменений
                    const channelResult = await pool.query(
                        'SELECT id FROM all_channels WHERE id = $1',
                        [chat.id]
                    );

                    if (channelResult.rows.length === 0) {
                        await pool.query(
                            'INSERT INTO all_channels (id, name, subscribers, photo_url, channel_url,description) VALUES ($1, $2, $3, $4,$5,$6)',
                            [chat.id, chat.title.trim().toLowerCase(), subscribersCount, photoUrl, channelUrl, description]
                        );
                    } else {
                        await pool.query(
                            'UPDATE all_channels SET name = $1, subscribers = $2, photo_url = $3 WHERE id = $4',
                            [chat.title.trim().toLowerCase(), subscribersCount, photoUrl, chat.id]
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
                    console.error('Error saving channel to DB:', {
                        error: err.message,
                        stack: err.stack,
                        chatId: chat?.id,
                        chatTitle: chat?.title,
                        userId: userId
                    });
                }
            } else if (oldStatus === 'administrator' && newStatus !== 'administrator') {
                try {
                    console.log(`Бот удален из каналаропопололо: ${chat.title}`);
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
        }catch (e) {
            console.log(`Бот был добавлен в приватный канал`);
        }
    });
    async function createMessageAndSend(userIdTo, userIdFrom, date, price, channelId, advertisementID) {
        const chatInfo = await bot.telegram.getChat(channelId);
        const channelUsername = chatInfo.username;

        const text = `🎉 <b>Ваше предложение было принято!</b>\n\n` +
            `🏷️ <b>Канал:</b> @${channelUsername}\n` +
            `📅 <b>Дата размещения:</b> ${new Date(date).toLocaleDateString('ru-RU')}\n` +
            `💰 <b>Стоимость:</b> ${price} рублей\n` +
            `📊 <b>Комиссия сервиса:</b> 15%\n\n` +
            `📋 <b>Что дальше?</b>\n` +
            `1. Владелец канала свяжется с вами\n` +
            `2. Обсудите детали и содержание поста\n` +
            `3. Перейдите к оплате\n\n` +
            `⚠️ <b>Важная информация:</b>\n` +
            `• Владелец может отклонить сделку до оплаты\n` +
            `• После оплаты обе стороны подтверждают размещение\n` +
            `• Через 24 часа после подтверждения владелец получит оплату\n\n` +
            `🔍 <b>Для отслеживания статуса сделки:</b>\n` +
            `Используйте команду: <code>/myposts</code>\n` +
            `Затем введите ID сделки: <code>${advertisementID}</code>\n\n` +
            `🆔 <b>ID вашей сделки:</b> <code>${advertisementID}</code>\n\n` +
            `💡 <i>Сохраните этот ID для отслеживания статуса!</i>`;

        const keyboard = {
            inline_keyboard: [
                [{
                    text: '💳 Перейти к оплате',
                    callback_data: `pay_${advertisementID}_${userIdFrom}_${price}_${userIdTo}`
                }]
            ]
        };

        try {
            await bot.telegram.sendMessage(userIdFrom, text, {
                parse_mode: 'HTML',
                reply_markup: keyboard
            });
        } catch (err) {
            console.error('Ошибка при отправке сообщения:', err);
        }
    }

    return bot;
};
