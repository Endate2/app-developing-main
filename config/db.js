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
                channel_url TEXT,
                description text,
                in_search BOOLEAN DEFAULT TRUE
            );

            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                username TEXT,
                first_name TEXT,
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
                in_search BOOLEAN DEFAULT TRUE,
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
            CREATE TABLE IF NOT EXISTS  feedback(
                    user_id BIGINT REFERENCES users(id),
                    channel_id BIGINT REFERENCES all_channels(id),
                    feedback VARCHAR(100),
                    id SERIAL PRIMARY KEY
                );
            CREATE TABLE IF NOT EXISTS channel_categories (
                    id SERIAL PRIMARY KEY,
                    categorie VARCHAR(50)
                );
            CREATE TABLE IF NOT EXISTS channel_category_mapping (
                channel_id BIGINT REFERENCES all_channels(id),
                category_id BIGINT REFERENCES channel_categories(id),
                PRIMARY KEY (channel_id, category_id)
                );
            CREATE TABLE IF NOT EXISTS referal (
                user_id BIGINT PRIMARY KEY REFERENCES users(id),
                is_referred BOOLEAN DEFAULT FALSE
                );
            CREATE TABLE IF NOT EXISTS deal(
                id SERIAL PRIMARY KEY,
                advertisement_id BIGINT REFERENCES advertisements(id),
                payment_status payment_status_enum,
                owner_channel_id BIGINT REFERENCES users(id),
                client_id BIGINT REFERENCES users(id)
            );
            CREATE TABLE IF NOT EXISTS payment_methods(
                id SERIAL PRIMARY KEY,
                user_id BIGINT REFERENCES users(id),
                card_number INTEGER,
                phone VARCHAR(50)
                );
        `);

        console.log('Database initialized');
    } catch (err) {
        console.error('Database initialization error:', err);
    }
}

module.exports = { pool, initDB };
