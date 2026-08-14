const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const analysis = JSON.parse(fs.readFileSync('./schema_analysis.json', 'utf8'));
    const breakdown = JSON.parse(fs.readFileSync('./table_breakdown.json', 'utf8'));

    console.log('=== USERS ===');
    console.log(JSON.stringify(analysis.users, null, 2));

    console.log('=== ROLES ===');
    console.log(JSON.stringify(analysis.roles, null, 2));

    console.log('=== TENANTS ===');
    console.log(JSON.stringify(analysis.tenants, null, 2));

    console.log('=== TABLE BREAKDOWN ===');
    console.log(JSON.stringify(breakdown, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
