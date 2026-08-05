const fs = require('fs');
let content = fs.readFileSync('src/config/database.js', 'utf8');

const connectDBString = `
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL database connection established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};
module.exports = { sequelize, tenantContext, connectDB };
`;

content = content.replace(/module\.exports = \{ sequelize, tenantContext \};/g, connectDBString);
fs.writeFileSync('src/config/database.js', content);
console.log('Fixed database export');
