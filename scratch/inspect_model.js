const { User } = require('../src/features/associations');
console.log('User raw attributes:', Object.keys(User.rawAttributes));
console.log('User attributes map:');
for (const [key, value] of Object.entries(User.rawAttributes)) {
  console.log(`- ${key}: field=${value.field}, type=${value.type.constructor.name}`);
}
