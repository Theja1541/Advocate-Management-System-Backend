const { sequelize } = require('../src/config/database');
const { User, Role } = require('../src/features/associations');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected.');
    
    // Trigger findOne
    const roleInclude = {
      model: Role,
      as: 'role',
      attributes: ['id', 'name'],
    };
    
    await User.findOne({
      where: { email: 'raghavendra@legaldesk.in', status: 'active' },
      attributes: ['id', 'name', 'email', 'roleId', 'passwordHash', 'status'],
      include: [roleInclude],
    });
  } catch (err) {
    console.error('Query failed:', err);
  } finally {
    await sequelize.close();
  }
}

run();
