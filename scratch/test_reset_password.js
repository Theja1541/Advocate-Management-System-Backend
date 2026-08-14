require('dotenv').config();
const { resetPassword } = require('../src/features/users/userService');
const { User } = require('../src/features/associations');
const bcrypt = require('bcrypt');

async function runTest() {
  let user = await User.findOne({ where: { email: 'testadmin123@gmail.com' } });
  if (!user) {
     console.log('User not found');
     process.exit(1);
  }

  const originalHash = user.passwordHash;
  const originalMustChange = user.mustChangePassword;

  try {
    console.log('--- Test 1: Reset Password ---');
    const tempPassword = await resetPassword(user.id);
    console.log('Generated temp password:', tempPassword);
    
    const updatedUser = await User.findByPk(user.id);
    const isTempValid = await bcrypt.compare(tempPassword, updatedUser.passwordHash);
    console.log('\n--- Verification ---');
    console.log('mustChangePassword is true?', updatedUser.mustChangePassword === true);
    console.log('Temp password valid?', isTempValid);

    console.log('--- Test 2: Non-existent User ---');
    await resetPassword(999999);
  } catch (error) {
    console.log('Error caught for non-existent user:', error.message);
  } finally {
    user.passwordHash = originalHash;
    user.mustChangePassword = originalMustChange;
    await user.save();
    process.exit(0);
  }
}

runTest();
