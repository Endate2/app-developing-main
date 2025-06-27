const express = require('express');
const router = express.Router();
const path = require('path');
const { pool } = require('../config/db');

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

router.get('/reklama.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'reklama.html'));
});

router.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

router.get('/poisk.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'poisk.html'));
});

router.get('/history.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'history.html'));
});

router.get('/channelpage-user.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'channelpage-user.html'));
});

router.get('/notification.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'notification.html'));
});


router.get('/channelpage-owner.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'channelpage-owner.html'));
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
        res.status(500).json({ error: 'Internal server error' });
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
        console.error('Error fetching channel:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/api/reklama', async (req, res) => {
    try {
        const channelId = req.query.id;
        const price = req.query.price;
        const day = req.query.day;
        const duration = req.query.duration;
        await pool.query(
            'INSERT INTO advertisements (date_of_advertisement, price,duration, channel_id) VALUES ($1, $2, $3,$4)',
            [day, price,duration, channelId]
        );
        res.json({ success: true, message: 'Реклама успешно добавлена' });
    } catch (err) {
        console.error('Error fetching channel:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/api/channel-owner', async (req, res) => {
    try {
        const channelId = req.query.id;
        const result = await pool.query(
            'SELECT users.id\n' +
            ' FROM all_channels\n' +
            ' INNER JOIN user_channels  ON all_channels.id = user_channels .channel_id\n' +
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
router.get('/api/create_notification', async (req, res) => {
    try {
        const user_id = req.query.id;
        const advertisementID = req.query.advertisementID;
        await pool.query(
            'INSERT INTO notifications (advertisement_id, user_id) VALUES ($1, $2)',
            [advertisementID, user_id]
        );
    } catch (err) {
        console.error('Error fetching channel:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/api/favourites', async (req, res) => {
    try {
        const channelId = req.query.id;
        const userID = req.query.userID;

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
module.exports = router;