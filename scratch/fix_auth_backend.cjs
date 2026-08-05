const fs = require('fs');

let c = fs.readFileSync('src/services/authService.js', 'utf8');

const regex = /const checkPermission = async \(userRoleName, moduleKey, action = 'V'\) => \{/;
const replacement = `const checkPermission = async (userRoleName, moduleKey, action = 'V') => {
  if (userRoleName === 'Super Admin') return true;`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/services/authService.js', c);
console.log('Fixed Super Admin backend permissions');
