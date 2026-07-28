const fs = require('fs');
const path = require('path');

function search(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        search(fullPath, query);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.json') || file.endsWith('.env')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(query)) {
          console.log(`Found "${query}" in: ${fullPath}`);
        }
      }
    }
  }
}

console.log('Searching for "roleKey"...');
search(path.join(__dirname, '..'), 'roleKey');

console.log('Searching for "role_key"...');
search(path.join(__dirname, '..'), 'role_key');
