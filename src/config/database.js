require('dotenv').config();

module.exports = {
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'drip_store',
    define: {
        timestamps: true,
        underscored: true,
    },
    logging: false,
};