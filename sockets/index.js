const { pool } = require('../config/db');

function setupSocket(io) {
    io.on('connection', (socket) => {
        console.log('New client connected');

        socket.on('get_channels', async (userId) => {
            try {
                const result = await pool.query(`
                    SELECT ac.* 
                    FROM all_channels ac
                    JOIN user_channels uc ON ac.id = uc.channel_id
                    WHERE uc.user_id = $1
                `, [userId]);
                socket.emit('channels_list', result.rows);
            } catch (err) {
                console.error('Error fetching channels:', err);
            }
        });

        socket.on('get_favourites', async (userId) => {
            try {
                console.log("Fetching favourites for user:", userId);
                const result = await pool.query(`
                    SELECT ac.*
                    FROM all_channels ac
                    JOIN favourites f ON ac.id = f.channel_id
                    WHERE f.user_id = $1
                `, [userId]);
                console.log("Favourites found:", result.rows);
                socket.emit('favourites_list', result.rows);
            } catch (err) {
                console.error('Error fetching favourite channels:', err);
                socket.emit('error', { message: 'Failed to fetch favourite channels' });
            }
        });
        socket.on('get_notification', async (userId) => {
            try {
                console.log("Fetching notifications for user:", userId);
                const result = await pool.query(`
                    SELECT
                        advertisements.date_of_advertisement,
                        advertisements.price,
                        advertisements.channel_id,
                        notifications.id AS notification_id,
                        all_channels.name AS channel_name
                    FROM notifications
                             JOIN advertisements ON notifications.advertisement_id = advertisements.id
                             JOIN all_channels ON advertisements.channel_id = all_channels.id
                    WHERE notifications.user_id = $1;

                `, [userId]);
                console.log("Notifications found:", result.rows);
                socket.emit('notification_list', result.rows);
            } catch (err) {
                console.error('Error fetching notifications:', err);
                socket.emit('error', { message: 'Failed to fetch notifications' });
            }
        });
        socket.on('get_channel_info', async (channelId) => {
            try {
                console.log("Fetching notifications for user:", channelId);
                const result = await pool.query(`
                    SELECT name
                    FROM all_channels
                    WHERE all_channels.id = $1
                `, [channelId]);
                console.log("Notifications found:", result.rows);
                socket.emit('channel_info_list', result.rows);
            } catch (err) {
                console.error('Error fetching notifications:', err);
                socket.emit('error', { message: 'Failed to fetch notifications' });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}

module.exports = { setupSocket };