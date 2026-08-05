const { sequelize } = require('../src/config/database');

async function run() {
  await sequelize.authenticate();
  try {
    // Check existing
    const [existing] = await sequelize.query('SELECT * FROM modules');
    
    // Rename 'diary' to 'hearings' to match NAV
    await sequelize.query("UPDATE modules SET key_code = 'hearings' WHERE key_code = 'diary'");

    // Missing modules:
    const missing = [
      { name: 'Tasks', key_code: 'tasks' },
      { name: 'References', key_code: 'refs' },
      { name: 'Notification Center', key_code: 'alerts' },
      { name: 'Amendment Tracker', key_code: 'amend' },
      { name: 'Calculators', key_code: 'tools' },
      { name: 'Master Settings', key_code: 'masters' }
    ];

    for (const m of missing) {
      if (!existing.some(e => e.key_code === m.key_code)) {
        await sequelize.query(`INSERT INTO modules (name, key_code) VALUES ('${m.name}', '${m.key_code}')`);
        console.log(`Inserted ${m.name}`);
      }
    }

    // Rename 'roles' to 'Roles & Access' for clarity
    await sequelize.query("UPDATE modules SET name = 'Roles & Access' WHERE key_code = 'roles'");

    console.log('Database modules synchronized with NAV');
  } catch (e) {
    console.log(e.message);
  }
}
run();
