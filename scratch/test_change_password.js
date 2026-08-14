require('dotenv').config();
const { changePassword } = require('../src/features/users/authController');
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

  const testPassword = 'knownPassword123!';
  user.passwordHash = await bcrypt.hash(testPassword, 10);
  user.mustChangePassword = true;
  await user.save();

  const req = {
    user: { id: user.id },
    body: {}
  };
  
  const res = {
    clearCookie: (name) => { console.log('clearCookie called for', name); },
    status: (code) => { 
      return { json: (data) => console.log('Status set to:', code, '| Response JSON:', data.message || data) };
    }
  };
  
  const next = (err) => {
    if (err) console.error('Next called with error:', err.message);
  };

  try {
    console.log('--- Test 1: Wrong current password ---');
    req.body = { currentPassword: 'wrongPassword', newPassword: 'newPassword123!', confirmPassword: 'newPassword123!' };
    await changePassword(req, res, next);

    console.log('\n--- Test 2: Same password ---');
    req.body = { currentPassword: testPassword, newPassword: testPassword, confirmPassword: testPassword };
    await changePassword(req, res, next);

    console.log('\n--- Test 3: Success ---');
    req.body = { currentPassword: testPassword, newPassword: 'newPassword123!', confirmPassword: 'newPassword123!' };
    await changePassword(req, res, next);
    
    const updatedUser = await User.findByPk(user.id);
    const isNewValid = await bcrypt.compare('newPassword123!', updatedUser.passwordHash);
    console.log('\n--- Verification ---');
    console.log('mustChangePassword is false?', updatedUser.mustChangePassword === false);
    console.log('New password valid?', isNewValid);

  } catch (error) {
    console.error('Unexpected error in test:', error);
  } finally {
    user.passwordHash = originalHash;
    user.mustChangePassword = originalMustChange;
    await user.save();
    process.exit(0);
  }
}

runTest();
