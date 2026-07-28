const { sequelize } = require('../src/config/database');
const { User, Role } = require('../src/features/associations');

async function check() {
  try {
    await sequelize.authenticate();
    console.log('Database connection successful!');
    
    // Check tables
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tables in database:', tables);
    
    if (tables.includes('users')) {
      const usersCount = await User.count();
      console.log('Total users:', usersCount);
      const allUsers = await User.findAll({ include: [{ model: Role, as: 'role' }] });
      console.log('Users list:');
      allUsers.forEach(u => {
        console.log(`- ${u.name} (${u.email}) Role: ${u.role ? u.role.name : 'None'}, Status: ${u.status}`);
      });
    } else {
      console.log('Users table does not exist!');
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await sequelize.close();
  }
}

check();
