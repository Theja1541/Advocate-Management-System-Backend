const { sequelize } = require('./src/config/database');

async function migrateMemberships() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    // Clear existing memberships since we can't reliably map advocate_id to group_admin_id 
    // without more complex logic, and there is only 1 record anyway.
    await sequelize.query('TRUNCATE TABLE memberships;');
    
    console.log('Cleared memberships table.');

    // Remove advocate_id
    // await sequelize.query('ALTER TABLE memberships DROP FOREIGN KEY memberships_ibfk_1;').catch(e => console.log('Foreign key may not exist or different name:', e.message));
    // await sequelize.query('ALTER TABLE memberships DROP COLUMN advocate_id;');
    // console.log('Dropped advocate_id column.');

    // Add group_admin_id
    await sequelize.query(`
      ALTER TABLE memberships 
      ADD COLUMN group_admin_id INT UNSIGNED NOT NULL,
      ADD CONSTRAINT memberships_group_admin_id_fk FOREIGN KEY (group_admin_id) REFERENCES users(id) ON DELETE CASCADE,
      ADD UNIQUE INDEX memberships_group_admin_id_unique (group_admin_id);
    `);
    console.log('Added group_admin_id column and constraints.');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrateMemberships();
