const fs = require('fs');

function replaceInFile(filePath, regex, replacement) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(regex, replacement);
  fs.writeFileSync(filePath, content);
}

replaceInFile('src/features/users/Permission.js', /defaultValue: '.*'/, "defaultValue: '---'");
replaceInFile('src/features/users/Permission.js', /type: DataTypes.ENUM\('.*', 'V', 'VE', 'VA', 'VEA'\)/, "type: DataTypes.ENUM('---', 'V', 'VE', 'VA', 'VEA')");

replaceInFile('src/features/users/roleController.js', /const VALID_LEVELS = \['.*', 'V', 'VE', 'VA', 'VEA'\];/, "const VALID_LEVELS = ['---', 'V', 'VE', 'VA', 'VEA'];");

replaceInFile('src/features/users/roleRoutes.js', /\.isIn\(\['.*', 'V', 'VE', 'VA', 'VEA'\]\)/g, ".isIn(['---', 'V', 'VE', 'VA', 'VEA'])");

console.log('Patched backend validation files');

const { sequelize } = require('../src/config/database');
async function run() {
  await sequelize.authenticate();
  try {
    await sequelize.query("ALTER TABLE permissions MODIFY COLUMN access_level ENUM('---', 'V', 'VE', 'VA', 'VEA') NOT NULL DEFAULT '---'");
    console.log('DB Updated');
  } catch (e) {
    console.log(e.message);
  }
}
run();
