/* eslint-disable no-undef */
require('dotenv/config');
const fs = require('fs');

const commonConfig = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
};

module.exports = {
    development: commonConfig,
};
