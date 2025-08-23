const { pool } = require('../config/db');

function setupSocket(io) {
    io.on('connection', (socket) => {

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
                const result = await pool.query(`
                    SELECT ac.*
                    FROM all_channels ac
                    JOIN favourites f ON ac.id = f.channel_id
                    WHERE f.user_id = $1
                `, [userId]);
                socket.emit('favourites_list', result.rows);
            } catch (err) {
                socket.emit('error', { message: 'Failed to fetch favourite channels' });
            }
        });

        socket.on('get_feedbacks', async (channelId) => {
            try {
                const result = await pool.query(`
                    SELECT f.feedback,
                           u.id AS user_id,
                           u.username,
                           u.first_name
                    FROM feedback f
                             JOIN users u ON f.user_id = u.id
                    WHERE f.channel_id = $1;
                `, [channelId]);
                socket.emit('feedbacks-list', result.rows);
            } catch (err) {
                console.error('Error fetching channels:', err);
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

        socket.on('get_advertisements', async (day, channelId) => {
            try {
                const result = await pool.query(
                    `SELECT date_of_advertisement, price, duration, channel_id,id
                     FROM advertisements
                     WHERE date_of_advertisement = $1 AND channel_id = $2 AND in_search = true`,
                    [day.trim(), Number(channelId)]
                );
                socket.emit('advertisements_list', result.rows);
            } catch (err) {
                console.error('Error fetching advertisements:', err);
                socket.emit('error', { message: 'Failed to fetch advertisements' });
            }
        });
        socket.on('get_advertisements_payment', async (day, channelId) => {
            try {
                 const result = await pool.query(
                    'SELECT ' +
                    '  all_channels.name, ' +
                    '  all_channels.subscribers, ' +
                    '  all_channels.channel_url, ' +
                    '  all_channels.photo_url, ' +
                    '  advertisements.price, ' +
                    '  advertisements.date_of_advertisement, ' +
                    '  advertisements.duration, ' +
                    '  advertisements.id ' +
                    'FROM all_channels ' +
                    'INNER JOIN advertisements ' +
                    '  ON all_channels.id = advertisements.channel_id ' +
                    'WHERE ' +
                    '  all_channels.id = $1 ' +
                    '  AND advertisements.date_of_advertisement = $2' +
                    '  AND advertisements.in_search = true;',
                    [channelId, day]
                );



                socket.emit('payments_list', result.rows);
            } catch (err) {
                console.error('Error fetching payments:', err);
                socket.emit('error', { message: 'Failed to fetch advertisements' });
            }
        });




        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    });
}

module.exports = { setupSocket };
