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

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}

module.exports = { setupSocket };