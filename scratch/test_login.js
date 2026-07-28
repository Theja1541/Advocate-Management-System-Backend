const { sequelize } = require('../src/config/database');
const bcrypt = require('bcrypt');
const { User, Role } = require('../src/features/associations');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB.');

    const email = 'raghavendra@legaldesk.in';
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      console.log('User not found in DB!');
      return;
    }

    console.log('User found:', user.name);
    console.log('Email:', user.email);
    console.log('Status:', user.status);
    console.log('Role:', user.role ? user.role.name : 'No Role');
    console.log('Password Hash in DB:', user.passwordHash);

    const isMatch = await bcrypt.compare('password', user.passwordHash);
    console.log('Password match with "password":', isMatch);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await sequelize.close();
  }
}

test();
