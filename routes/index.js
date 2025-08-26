const {pool} = require("../config/db");
module.exports = (bot) => {
    const express = require('express');
    const router = express.Router();
    const path = require('path');
    const { pool } = require('../config/db');
    const crypto = require('crypto');


    router.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../views', 'index.html'));
    });
;

    router.get('/index.html', (req, res) => {
        res.sendFile(path.join(__dirname, '../views', 'index.html'));
    });



    router.get('/api/get_payment_methods', async (req, res) => {
        try {
            const userId = req.query.user_id;
            const result = await pool.query(`
                SELECT *
                FROM payment_methods
                WHERE user_id = $1
            `, [userId]);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching payment_methods:', err);
            res.status(500).json({ error: 'Internal serve rr' });
        }
    });


    router.get('/api/channels', async (req, res) => {
        try {
            const userId = req.query.user_id;
            const result = await pool.query(`
                SELECT ac.* 
                FROM all_channels ac
                JOIN user_channels uc ON ac.id = uc.channel_id
                WHERE uc.user_id = $1
            `, [userId]);
            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching channels:', err);
            res.status(500).json({ error: 'Internal server erro' });
        }
    });

    router.post('/api/feedback', async (req, res) => {
        const { id: channelID, user_id: userId, text: text } = req.body;

        try {
            await pool.query(
                `INSERT INTO feedback (channel_id, user_id, feedback)
                 VALUES ($1, $2, $3)`,
                [channelID, userId, text]
            );
            res.status(200).send({ message: 'Отзыв добавлен' });
        } catch (err) {
            console.error('Erro inserting feedback:', err);
            res.status(500).send('Internal Servr Erro');
        }
    });


    router.post('/payment-status', async (req, res) => {
        try {
            const {
                Status: status,
                OrderId: orderId,
                PaymentId: paymentId,
                Amount: amount,
                ...otherData
            } = req.body;

            console.log('Получен статус платежа:', status);
            console.log('Данные платежа:', req.body);

            const userIdTo = orderId.split('-n')[0];
            const orderNumber = orderId.split('-n')[1];
            const orderNumberNum = parseInt(orderNumber, 10);
            const userIdToNumber = parseInt(userIdTo, 10);

            switch (status) {
                case 'NEW':
                    console.log(`Платеж ${paymentId} создан и ожидает оплату.`);
                    break;
                case 'FORM_SHOWED':
                    console.log(`На платежной форме клиента открыт платеж ${paymentId}.`);
                    break;
                case 'AUTHORIZING':
                    console.log(`Платеж ${paymentId} обрабатывается.`);
                    break;
                case '3DS_CHECKING':
                    console.log(`Платеж ${paymentId} проходит 3D Secure.`);
                    break;
                case '3DS_CHECKED':
                    console.log(`Платеж ${paymentId} прошёл 3D Secure.`);
                    break;
                case 'AUTHORIZED':
                    console.log(`Платеж ${paymentId} авторизован, деньги заблокированы.`);
                    break;
                case 'CONFIRMED':
                    await pool.query(
                        'UPDATE deal SET payment_status = $3 WHERE advertisement_id = $1 AND payment_status = $2',
                        [orderNumberNum, 'получена ссылка на оплату', 'оплачена']
                    );
                    await createMessageSuccsesfulPayment(userIdToNumber, orderNumberNum);
                    break;
                case 'REJECTED':
                    console.log(`Платеж ${paymentId} отклонён банком.`);
                    break;
                case 'CANCELED':
                    console.log(`Платеж ${paymentId} отменён мерчантом.`);
                    break;
                case 'REVERSING':
                    console.log(`Идёт возврат средств по платежу ${paymentId}.`);
                    break;
                case 'PARTIAL_REVERSED':
                    console.log(`Частичный возврат по платежу ${paymentId} успешно выполнен.`);
                    break;
                case 'REVERSED':
                    console.log(`Полный возврат по платежу ${paymentId} успешно выполнен.`);
                    break;
                case 'REFUNDING':
                    console.log(`Происходит возврат подтвержденного платежа ${paymentId}.`);
                    break;
                case 'PARTIAL_REFUNDED':
                    console.log(`Частичный возврат подтвержденного платежа ${paymentId} выполнен.`);
                    break;
                case 'REFUNDED':
                    console.log(`Полный возврат подтвержденного платежа ${paymentId} выполнен.`);
                    break;
                default:
                    console.warn('Неизвестный статус платежа:', status);
            }

            res.status(200).send('OK');

        } catch (error) {
            console.error('Ошибка обработки статуса платежа:', error);
            res.status(500).send('Ошибка сервера');
        }
    });
    router.post('/api/create-payment-link', async (req, res) => {

    try {
        const { amount, userIdFrom,userIdTo, orderNumber } = req.body;
        await pool.query(
            'UPDATE deal SET payment_status = $3 WHERE advertisement_id = $1 AND payment_status = $2',
            [orderNumber, 'создана', 'получена ссылка на оплату']
        );
        const data = {
            "Amount": (amount * 100).toString(), // сумма в копейках, обязательно строка
            "Description": 'Оплата рекламы для канала',
            "OrderId": `${userIdTo}-n${orderNumber}-${userIdFrom}`,
            "TerminalKey": process.env.TERMINAL_KEY,
            "Password": process.env.TERMINAL_PASSWORD
        };

        // Логируем тело запроса без пароля (для безопасности)
        const logData = {...data};
        delete logData.Password;
        console.log("Request to Tinkoff with ", JSON.stringify(logData));

        // Формирование токена: сортируем все ключи, включая Password, конкатенируем значения
        const sortedKeys = Object.keys(data).sort();
        let concatenated = '';
        sortedKeys.forEach(key => {
            concatenated += data[key].toString();
        });

        // Хешируем конкатенированную строку SHA-256
        const token = crypto.createHash('sha256').update(concatenated, 'utf8').digest('hex');

        // Добавляем токен в объект данных и удаляем пароль
        data.Token = token;
        delete data.Password;

        // Отправляем запрос на метод Init Tinkoff
        const response = await fetch('https://securepay.tinkoff.ru/v2/Init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        console.log("Response status:", response.status);

        const responseBody = await response.text();

        let result;
        try {
            result = JSON.parse(responseBody);
            console.log("Response JSON body:", JSON.stringify(result));
        } catch (err) {
            console.error("Ошибка парсинга JSON из ответа:", err);
            console.error("Полученный ответ:", responseBody);
            throw err;
        }

        if (result.Success && result.PaymentURL) {
            res.json({ paymentUrl: result.PaymentURL });
        } else {
            console.error("Ответ от Tinkoff с ошибкой:", JSON.stringify(result));
            res.status(500).json({ error: 'Не удалось создать ссылку для оплаты' });
        }

    } catch (error) {
        console.error('Ошибка создания платежной ссылки:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});




    router.get('/api/channels-by-criteria', async (req, res) => {
        try {
            const { categories, sort } = req.query;
            const categoryIds = categories ? categories.split(',').map(Number) : [];

            let query = `
            SELECT DISTINCT ac.* 
            FROM all_channels ac
        `;

            if (categoryIds.length > 0) {
                query += `
                JOIN channel_category_mapping ccm ON ac.id = ccm.channel_id
                WHERE ccm.category_id = ANY($1) and in_search = true
            `;
            }

            query += `
            ORDER BY ac.subscribers ${sort === 'asc' ? 'ASC' : 'DESC'}
            LIMIT 20
        `;

            const result = await pool.query(
                query,
                categoryIds.length > 0 ? [categoryIds] : []
            );

            res.json(result.rows);
        } catch (err) {
            console.error('Error fetching channels by criteria:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.post('/api/refresh', async (req, res) => {
        const { channelId } = req.body;
        if (!channelId) {
            return res.status(400).json({ error: 'Не указан channel_id' });
        }
        try {
            const chatInfo = await bot.telegram.getChat(channelId);
            let description = null;
            if (chatInfo.description) {
                description = chatInfo.description;
            }
            let photoUrl = null;
            if (chatInfo.photo) {
                const photoFileId = chatInfo.photo.big_file_id;
                const photoFile = await bot.telegram.getFile(photoFileId);
                photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${photoFile.file_path}`;
            }
            let subscribers = 0;
            try {
                subscribers = await bot.telegram.getChatMembersCount(channelId);
            } catch (e) {
                console.error('Ошибка при получении подписчиков:', e);
            }
            const channelUrl = chatInfo.username ? `https://t.me/${chatInfo.username}` : null;
            await pool.query(
                'UPDATE all_channels SET name=$1, subscribers=$2, photo_url=$3, channel_url=$4, description=$5 WHERE id=$6',
                [chatInfo.title.trim().toLowerCase(), subscribers, photoUrl, channelUrl, description, channelId]
            );
            res.json({ ok: true });
        } catch (err) {
            console.error('Ошибка при обновлении канала:', err);
            res.status(500).json({ error: 'Ошибка при обновлении канала' });
        }
    });

    router.get('/api/channel', async (req, res) => {
        try {
            const channelId = req.query.id;
            const result = await pool.query('SELECT * FROM all_channels WHERE id = $1', [channelId]);

            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ error: 'Канал не найден' });
            }
        } catch (err) {
            console.error('Error fetching channel:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/api/channel-payment-selector', async (req, res) => {
        try {
            const channelId = req.query.id;
            const date = req.query.date;
            const result = await pool.query(
                'SELECT ' +
                '  all_channels.name, ' +
                '  all_channels.subscribers, ' +
                '  all_channels.channel_url, ' +
                '  all_channels.photo_url, ' +
                '  advertisements.price, ' +
                '  advertisements.duration, ' +
                '  advertisements.id AS advertisementID ' +
                'FROM all_channels ' +
                'INNER JOIN advertisements ' +
                '  ON all_channels.id = advertisements.channel_id ' +
                'WHERE ' +
                '  all_channels.id = $1 ' +
                '  AND advertisements.date_of_advertisement = $2;',
                [channelId, date]
            );
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ error: 'Канал не найден' });
            }
        } catch (err) {
            console.error('Error fetching channel:', err,channelId,day);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.post('/api/reklama', async (req, res) => {
        try {
            const { id: channelId, price, duration, day } = req.body;

            await pool.query(
                `INSERT INTO advertisements (date_of_advertisement, price, duration, channel_id)
                 VALUES ($1, $2, $3, $4)`,
                [day.trim(), Number(price), Number(duration), Number(channelId)]
            );

            res.json({ success: true, message: 'Реклама успешно добавлена' });
        } catch (e) {
            console.error(e);
            res.json({ success: false, message: 'Ошибка' });
        }
    });


    router.get('/api/reklama-check', async (req, res) => {
        try {
            const channelId = Number(req.query.id);
            const day = req.query.day.trim();

            const result = await pool.query(
                `SELECT date_of_advertisement, price, duration
                 FROM advertisements
                 WHERE date_of_advertisement = $1 AND channel_id = $2`,
                [day, channelId]
            );

            if (result.rows.length > 0) {
                res.json({ success: false, res: result.rows[0] });
            } else {
                res.json({ success: true, message: 'Реклама успешно добавлена' });
            }
        } catch (err) {
            console.error('Error processing request:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.post('/api/reklama-delete', async (req, res) => {
        try {
            const { id, channelId, day } = req.body;

            const result = await pool.query(
                `DELETE FROM advertisements
                 WHERE date_of_advertisement = $1 AND channel_id = $2 AND id = $3;`,
                [day.trim(), Number(channelId),Number(id)]
            );

            if (result.rowCount > 0) {
                res.json({ success: true, channelId: channelId, day: day });
            } else {
                res.json({ success: false, channelId: channelId, day: day });
            }
        } catch (err) {
            console.error('Error processing request:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/api/channel-owner', async (req, res) => {
        try {
            const channelId = req.query.id;
            const result = await pool.query(
                'SELECT users.id\n' +
                ' FROM all_channels\n' +
                ' INNER JOIN user_channels ON all_channels.id = user_channels.channel_id\n' +
                ' INNER JOIN users ON user_channels.user_id = users.id\n' +
                ' WHERE all_channels.id = $1;',
                [channelId]
            );
            if (result.rows.length > 0) {
                res.json(result.rows[0]);
            } else {
                res.status(404).json({ error: 'Владелец не найден' });
            }
        } catch (err) {
            console.error('Error fetching channel:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.post('/save-user', async (req, res) => {
        try {
            const { id, username, first_name } = req.body;

            await pool.query(
                'INSERT INTO users (id, username, first_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
                [id, username, first_name]
            );

            res.json({ success: true });
        } catch (err) {
            console.error('Ошибка сохранения пользователя:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    });
    router.get('/api/get-favourites', async (req, res) => {
        try {
            const channelId = req.query.id;
            const userID = req.query.userID;
            const checkResult = await pool.query(
                'SELECT * FROM favourites WHERE user_id = $1 AND channel_id = $2',
                [userID, channelId]
            );
            if (checkResult.rows.length > 0) {
                res.json({ rows: checkResult.rows });
            } else {
                res.status(404).json({ error: 'Владелец не найден' });
            }
        } catch (err) {
            console.error('Error fetching channel:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    router.get('/api/check-owner-channel', async (req, res) => {
        try {
            const user_id = Number(req.query.user_id);
            const channel_id = Number(req.query.channel_id);

            const result = await pool.query(
                `SELECT EXISTS (
                    SELECT 1 FROM user_channels
                    WHERE user_id = $1 AND channel_id = $2
                );`,
                [user_id,channel_id]
            );


            const exists = result.rows[0].exists;
            if (exists) {
                return res.json({ success: true });
            }else{
                return res.json({ success: false });
            }

        } catch (err) {
            console.error('Ошибка в /api/check-owner-channel:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });




    router.get('/api/create_notification', async (req, res) => {
        try {
            const user_id_to = Number(req.query.id);
            const advertisementID = Number(req.query.advertisementID);
            const comment = req.query.comment;
            const user_id_from = Number(req.query.user);

            if (isNaN(user_id_to) || isNaN(advertisementID) || isNaN(user_id_from)) {
                return res.status(400).json({ error: 'Неверные параметры запроса' });
            }

            const result = await pool.query(
                `SELECT EXISTS (
                    SELECT 1 FROM notifications
                    WHERE user_id_to = $1 AND user_id_from = $2 AND advertisement_id = $3
                );`,
                [user_id_to, user_id_from, advertisementID]
            );

            const exists = result.rows[0].exists;
            if (exists) {
                return res.json({ success: false, message: 'Уведомление уже существует' });
            }

            await pool.query(
                'INSERT INTO notifications (advertisement_id, user_id_to, comment, user_id_from, id_categorie) VALUES ($1, $2, $3, $4, 1)',
                [advertisementID, user_id_to, comment, user_id_from]
            );

            const checkResult = await pool.query(
                'SELECT * FROM advertisements WHERE id = $1',
                [advertisementID]
            );

            const ad = checkResult.rows[0];
            if (!ad) {
                return res.status(404).json({ success: false, message: 'Объявление не найдено' });
            }

            await createNotificationAndSend(
                user_id_to,
                comment,
                user_id_from,
                ad.date_of_advertisement,
                ad.price,
                ad.duration,
                ad.channel_id,
                advertisementID
            );

            res.json({ success: true, message: 'Уведомление создано и отправлено' });
        } catch (err) {
            console.error('Ошибка в /api/create_notification:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });

    router.get('/api/search_deals', async (req, res) => {
        try {
            const id = Number(req.query.id);

            const result = await pool.query(
                `SELECT payment_status FROM deal WHERE advertisement_id = $1 LIMIT 1;`,
                [id]
            );

            if (result.rows.length > 0) {
                const paymentStatus = result.rows[0].payment_status;
                if (paymentStatus === "получена ссылка на оплату") {
                    return res.json({ success: false });
                } else {
                    return res.json({ success: true });
                }
            } else {
                return res.json({ success: false });
            }

        } catch (err) {
            console.error('Ошибка в /api/search_deals:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });


    router.get('/api/get_advertisement', async (req, res) => {
        try {
            const advertisement_id = Number(req.query.id);

            await pool.query(
                'UPDATE advertisements SET in_search = false WHERE id = $1',
                [advertisement_id]
            );

            const checkResult = await pool.query(
                'SELECT * FROM advertisements WHERE id = $1',
                [advertisement_id]
            );

            res.json(checkResult.rows[0]);
        } catch (err) {
            console.error('Ошибка в /api/get_advertisement:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });


    router.get('/api/channel-categories', async (req, res) => {
        try {
            const channelId = req.query.id;

            const result = await pool.query(`
                SELECT cc.id, cc.categorie
                FROM channel_category_mapping AS ccm
                         JOIN channel_categories AS cc ON ccm.category_id = cc.id
                WHERE ccm.channel_id = $1
                ORDER BY cc.id;
            `, [channelId]);

            if (result.rowCount > 0) {
                res.json({ success: true, rows: result.rows });
            } else {
                res.json({ success: false });
            }
        } catch (err) {
            console.error('Ошибка в /api/channel-categories:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });

    router.get('/api/all-channel-categories', async (req, res) => {
        try {
            const result = await pool.query('SELECT id, categorie FROM channel_categories ORDER BY id');
            res.json(result.rows);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Ошибка при получении категорий' });
        }
    });


    router.post('/api/set-channel-categories', async (req, res) => {
        try {
            const { channel_id, categories } = req.body;

            if (!channel_id || !Array.isArray(categories)) {
                return res.status(400).json({ success: false, message: 'Неверные параметры запроса' });
            }

            const client = await pool.connect();

            try {
                await client.query('BEGIN');


                if (categories.length > 0) {
                    const values = [];
                    const params = [];

                    categories.forEach((categoryId, index) => {
                        params.push(channel_id, categoryId);
                        values.push(`($${params.length - 1}, $${params.length})`);
                    });

                    const insertQuery = `
          INSERT INTO channel_category_mapping (channel_id, category_id)
          VALUES ${values.join(', ')}
        `;

                    await client.query(insertQuery, params);
                }

                await client.query('COMMIT');

                return res.json({ success: true, message: 'Категории успешно сохранены' });
            } catch (error) {
                await client.query('ROLLBACK');
                console.error('Ошибка при обновлении категорий:', error);
                return res.status(500).json({ success: false, message: 'Ошибка при сохранении категорий' });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Ошибка в /api/set-channel-categories:', error);
            return res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });

    router.get('/api/channels-search', async (req, res) => {
        const { name } = req.query;
        if (!name) {
            return res.status(400).json({ error: 'Не указано имя для поиска' });
        }
        try {
            const result = await pool.query(`
            SELECT * FROM all_channels 
            WHERE name = $1 and in_search = true
            ORDER BY subscribers DESC
            LIMIT 20
        `, [name]); // Используем searchTerm вместо name

            res.json(result.rows);
        } catch (err) {
            console.error('Ошибка при поиске каналов:', err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    });
    router.post('/api/delete-deal', async (req, res) => {
        const { advertisementID } = req.body;

        if (!advertisementID) {
            return res.status(400).json({ success: false, message: 'Не указан advertisementID' });
        }

        try {
            const checkResult = await pool.query(
                'SELECT 1 FROM deal WHERE advertisement_id = $1 AND payment_status = $2',
                [advertisementID, 'создана']
            );

            if (checkResult.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'Сделка со статусом "создана" не найдена' });
            }

            await pool.query(
                'UPDATE advertisements SET in_search = true WHERE id = $1',
                [advertisementID]
            );

            const result = await pool.query(
                'DELETE FROM deal WHERE advertisement_id = $1',
                [advertisementID]
            );

            res.json({
                success: true,
                message: `Удалено сделок: ${result.rowCount}`
            });

        } catch (err) {
            console.error('Ошибка при удалении сделок канала:', err);
            res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });


    router.post('/api/delete-channel-categories', async (req, res) => {
        const { channel_id } = req.body;

        if (!channel_id) {
            return res.status(400).json({ success: false, message: 'Не указан channel_id' });
        }

        try {
            const result = await pool.query(
                'DELETE FROM channel_category_mapping WHERE channel_id = $1;',
                [channel_id]
            );

            res.json({
                success: true,
                message: `Удалено категорий: ${result.rowCount}`
            });
        } catch (err) {
            console.error('Ошибка при удалении категорий канала:', err);
            res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });
    router.post('/api/set-deal', async (req, res) => {
        const { advertisementID,userIdTo,userIdFrom,price} = req.body;

        if (!advertisementID) {
            return res.status(400).json({ success: false, message: 'Не указан channel_id' });
        }

        try {
            await pool.query(
                'INSERT INTO deal (advertisement_id, payment_status,owner_channel_id,client_id,payment,DATE_PAYMENT) VALUES ($1, $2, $3,$4,$5, NULL)',
                [advertisementID, 'создана',userIdTo,userIdFrom,price]
            );


            res.json({
                success: true,
                message: `Добавлена сделка: ${advertisementID}`
            });
        } catch (err) {
            console.error('Ошибка при добавлении сделки:', err);
            res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });

    router.post('/api/set-deal-type', async (req, res) => {
        const { advertisementID} = req.body;

        if (!advertisementID) {
            return res.status(400).json({ success: false, message: 'Не указан advertisementID' });
        }

        try {
            await pool.query(
                'UPDATE deal SET payment_status = $2 WHERE advertisement_id = $1 AND payment_status = $3',
                [advertisementID, 'идет расследование', 'оплачена']
            );


            res.json({
                success: true,
                message: `Изменено состояние сделки: ${advertisementID}`
            });
        } catch (err) {
            console.error('Ошибка при добавлении сделки:', err);
            res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });

    router.post('/api/set-deal-type-yes', async (req, res) => {
        const { advertisementID} = req.body;

        if (!advertisementID) {
            return res.status(400).json({ success: false, message: 'Не указан advertisementID' });
        }

        try {
            await pool.query(
                'UPDATE deal SET payment_status = $2, DATE_PAYMENT = NOW() WHERE advertisement_id = $1 AND payment_status = $3',
                [advertisementID, 'пост подтвержден', 'оплачена']
            );


            res.json({
                success: true,
                message: `Изменено состояние сделки: ${advertisementID}`
            });
        } catch (err) {
            console.error('Ошибка при добавлении сделки:', err);
            res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера' });
        }
    });


    router.post('/api/favourites', async (req, res) => {
        try {
            const { id: channelId, userID } = req.body;

            const checkResult = await pool.query(
                'SELECT * FROM favourites WHERE user_id = $1 AND channel_id = $2',
                [userID, channelId]
            );

            if (checkResult.rows.length > 0) {
                await pool.query(
                    'DELETE FROM favourites WHERE user_id = $1 AND channel_id = $2',
                    [userID, channelId]
                );
                res.json({ success: true, message: 'Удалено из избранного' });
            } else {
                await pool.query(
                    'INSERT INTO favourites (user_id, channel_id) VALUES ($1, $2)',
                    [userID, channelId]
                );
                res.json({ success: true, message: 'Добавлено в избранное' });
            }
        } catch (err) {
            console.error('Error handling favourites:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
    router.post('/api/update_in_search', async (req, res) => {
        try {
            const { channelId, in_search } = req.body;
            await pool.query(
                'UPDATE all_channels SET in_search=$1 WHERE id = $2',
                [in_search, channelId]
            );
            res.json({ success: true, message: 'Канал отображается в поиске' });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Ошибка обновления параметра поиска' });
        }
    });


    async function createNotificationAndSend(userIdTo, comment, userIdFrom, date, price, duration, channelId, advertisementID) {
        const chatInfo = await bot.telegram.getChat(channelId);
        const channelUsername = chatInfo.username;
        const durationText = duration === 0 ? 'без удаления' : duration;
        const text = `⚡️ Предложения по рекламе ⚡️

🏷️ Канал: @${channelUsername}

📅 Дата: ${date.toDateString()}

🕒 Длительность: ${durationText} 

💰 Цена: ${price} (Сервис берет 15% от стоимсоти рекламного поста)

✍️ Комментарий: ${comment}`;

        const keyboard = {
            inline_keyboard: [
                [
                    {
                        text: 'Принять',
                        // Замените строку с callback_data на:
                        callback_data: `accept_${advertisementID}_${userIdFrom}_${userIdTo}`
                    },
                    {
                        text: 'Отклонить',
                        callback_data: `reject_${advertisementID}_${userIdFrom}_${userIdTo}`
                    }
                ]
            ]
        };


        try {
            await bot.telegram.sendMessage(userIdTo, text, {
                reply_markup: keyboard
            });
        } catch (err) {
            console.error('Ошибка при отправке сообщения в Telegram:', err);
        }
    }

    async function createMessageSuccsesfulPayment(userIdTo, advertisementID) {
    const text = `✅ *Оплата рекламы принята!*

💰 Деньги заморожены на счёте банка.

После подтверждения обеими сторонами того, что рекламный пост был опубликован, вы сможете получить деньги через *24 часа*.

Чтобы подтвердить публикацию поста, пожалуйста, выполните команду:
/accepted_posts и введите номер сделки — *${advertisementID}*

⚠️ *ПРЕДУПРЕЖДЕНИЕ:*
Если ответы сторон по публикации поста будут отличаться, сделка будет автоматически отменена.

В этом случае необходимо будет обратиться в поддержку для дальнейшего расследования.`;

    try {
        await bot.telegram.sendMessage(userIdTo, text);
    } catch (err) {
        console.error('Ошибка при отправке сообщения в Telegram:', err);
    }
}





    return router;
};
