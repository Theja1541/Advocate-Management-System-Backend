const bcrypt = require('bcrypt');

const password = process.argv[2];

if (!password) {
  console.log('Usage: node hash.js <password_to_hash>');
  process.exit(1);
}

async function run() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log('\n--- HASH GENERATED SUCCESSFULLY ---');
    console.log('Plaintext:', password);
    console.log('Hash:     ', hash);
    console.log('-----------------------------------\n');
  } catch (err) {
    console.error('Error generating hash:', err);
  }
}

run();
