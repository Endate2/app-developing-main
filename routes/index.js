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
router.get('/api/reklama', async (req, res) => {
    try {
        const channelId = req.query.id;
        const price = req.query.price;
        const day = req.query.day;
        await pool.query(
            'INSERT INTO advertisements (date_of_advertisement, price, channel_id) VALUES ($1, $2, $3)',
            [day, price, channelId]
        );

        res.json({ success: true, message: 'Реклама успешно добавлена' });
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