const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  development: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'legal_desk_db',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'legal_desk_db',
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql'
  }
};
