const { sequelize } = require('../src/config/database');

async function run() {
  const table = await sequelize.getQueryInterface().describeTable('documents');
  console.log('case_id details:', table.case_id);
  console.log('id details:', table.id);
  
  const casesTable = await sequelize.getQueryInterface().describeTable('cases');
  console.log('cases.id details:', casesTable.id);
  
  sequelize.close();
}

run();
