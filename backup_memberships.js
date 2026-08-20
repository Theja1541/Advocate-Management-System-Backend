const fs = require('fs');
const Membership = require('./src/features/memberships/Membership');
const { sequelize } = require('./src/config/database');

async function backupMemberships() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    const memberships = await Membership.findAll({ raw: true });
    
    fs.writeFileSync('memberships_backup.json', JSON.stringify(memberships, null, 2));
    
    console.log(`Backed up ${memberships.length} memberships.`);
    process.exit(0);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
}

backupMemberships();
