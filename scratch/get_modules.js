const { sequelize } = require('../src/config/database');
const { Module } = require('../src/features/associations');

async function check() {
  try {
    await sequelize.authenticate();
    const modules = await Module.findAll();
    console.log('Modules in database:');
    modules.forEach(m => {
      console.log(`- ID: ${m.id}, Name: ${m.name}, KeyCode: ${m.keyCode || m.key_code}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

check();
