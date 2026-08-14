const fs = require('fs');
const { Case, Task } = require('./src/features/associations');
const { sequelize } = require('./src/config/database');

async function backup() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');
    
    const cases = await Case.findAll({ raw: true });
    const tasks = await Task.findAll({ raw: true });
    
    fs.writeFileSync('cases_backup.json', JSON.stringify(cases, null, 2));
    fs.writeFileSync('tasks_backup.json', JSON.stringify(tasks, null, 2));
    
    console.log(`Backed up ${cases.length} cases and ${tasks.length} tasks.`);
    process.exit(0);
  } catch (err) {
    console.error('Backup failed:', err);
    process.exit(1);
  }
}

backup();
