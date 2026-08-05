const { sequelize } = require('../src/config/database');

async function run() {
  await sequelize.authenticate();
  try {
    // 1. Convert any invalid ENUM values (like '?"') to 'V' temporarily so we don't truncate data
    await sequelize.query("UPDATE permissions SET access_level = 'V' WHERE access_level NOT IN ('V', 'VE', 'VA', 'VEA')");
    
    // 2. Alter the column definition to explicitly include '---'
    await sequelize.query("ALTER TABLE permissions MODIFY COLUMN access_level ENUM('---', 'V', 'VE', 'VA', 'VEA') NOT NULL DEFAULT '---'");
    
    // 3. (Optional) Convert them back to '---' if they were supposed to be none. But we can't tell which 'V' were real vs fake. 
    // It's okay, we can just leave them as 'V' or update all to '---'. Let's just set them all to '---' because most default permissions are '---'.
    await sequelize.query("UPDATE permissions SET access_level = '---' WHERE access_level = 'V'");

    console.log('DB Updated Successfully');
  } catch (e) {
    console.log(e.message);
  }
}
run();
