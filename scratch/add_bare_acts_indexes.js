const { sequelize } = require('../src/config/database');

async function addIndexes() {
  console.log("Applying database index optimizations for Bare Acts module...");
  try {
    const tableInfo = await sequelize.getQueryInterface().describeTable('bare_acts');
    
    // Check and add indexes
    if (tableInfo.file_hash) {
      console.log("Adding index for file_hash...");
      await sequelize.query(`
        CREATE INDEX idx_bare_acts_file_hash 
        ON \`bare_acts\` (\`file_hash\`);
      `).catch(err => {
        if (err.parent?.code === 'ER_DUP_KEYNAME') {
          console.log("Index idx_bare_acts_file_hash already exists.");
        } else {
          throw err;
        }
      });
    }

    if (tableInfo.pdf_storage_name) {
      console.log("Adding index for pdf_storage_name...");
      await sequelize.query(`
        CREATE INDEX idx_bare_acts_pdf_storage_name 
        ON \`bare_acts\` (\`pdf_storage_name\`);
      `).catch(err => {
        if (err.parent?.code === 'ER_DUP_KEYNAME') {
          console.log("Index idx_bare_acts_pdf_storage_name already exists.");
        } else {
          throw err;
        }
      });
    }

    console.log("Database index optimizations applied successfully.");
  } catch (error) {
    console.error("Database indexing optimization failed:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addIndexes();
