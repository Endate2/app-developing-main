const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function initDB() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS all_channels (
                id BIGINT PRIMARY KEY,
                name TEXT NOT NULL,
                subscribers INTEGER DEFAULT 0,
                photo_url TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS user_channels (
                user_id BIGINT REFERENCES users(id),
                channel_id BIGINT REFERENCES all_channels(id),
                added_at TIMESTAMP DEFAULT NOW(),
                PRIMARY KEY (user_id, channel_id)
            );

            CREATE TABLE IF NOT EXISTS favourites (
                user_id BIGINT REFERENCES users(id),
                channel_id BIGINT REFERENCES all_channels(id),
                PRIMARY KEY (user_id, channel_id)
            );

            CREATE TABLE IF NOT EXISTS advertisements (
                id SERIAL PRIMARY KEY,
                date_of_advertisement DATE,
                price INTEGER,
                duration INTEGER,
                channel_id BIGINT REFERENCES all_channels(id)
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                advertisement_id BIGINT REFERENCES advertisements(id),
                user_id_to BIGINT REFERENCES users(id),
                comment VARCHAR(100),
                user_id_from BIGINT REFERENCES users(id),
                id_categorie  BIGINT REFERENCES notification_categories(id)
                );
            CREATE TABLE IF NOT EXISTS notification_categories (
                id SERIAL PRIMARY KEY,
                description VARCHAR(50)
                );
        `);
        console.log('Database initialized');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

module.exports = { pool, initDB };
