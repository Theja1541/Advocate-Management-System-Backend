const { sequelize } = require('../src/config/database');

async function fixMeta() {
  await sequelize.authenticate();
  await sequelize.query(`
    INSERT IGNORE INTO SequelizeMeta (name) VALUES 
    ('20260726120000-create-bare-acts-and-amendments.js'), 
    ('20260726120100-add-bare-acts-is-bookmarked.js'), 
    ('20260726120200-add-bare-acts-pdf-file.js'), 
    ('20260727102100-add-diary-id-to-documents.js'), 
    ('20260727160000-extend-bare-acts.js');
  `);
  console.log('Successfully updated SequelizeMeta table!');
  process.exit(0);
}

fixMeta().catch(err => {
  console.error(err);
  process.exit(1);
});
