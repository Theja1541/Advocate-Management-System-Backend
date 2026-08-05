const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

walk('src/features', (filePath) => {
  if (filePath.endsWith('Routes.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // diary -> hearings
    if (content.includes("authorizePermission('diary'")) {
      content = content.replace(/authorizePermission\('diary'/g, "authorizePermission('hearings'");
      modified = true;
    }

    // tasks -> tasks
    if (filePath.includes('taskRoutes.js') && content.includes("authorizePermission('cases'")) {
      content = content.replace(/authorizePermission\('cases'/g, "authorizePermission('tasks'");
      modified = true;
    }

    // references -> refs
    if (filePath.includes('referenceRoutes.js') && content.includes("authorizePermission('docs'")) {
      content = content.replace(/authorizePermission\('docs'/g, "authorizePermission('refs'");
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + filePath);
    }
  }
});
