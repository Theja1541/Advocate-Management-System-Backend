const { sequelize } = require('../src/config/database');
const { QueryTypes } = require('sequelize');

async function upgrade() {
  console.log("Upgrading database schema for Bare Acts management module...");
  try {
    const tableInfo = await sequelize.getQueryInterface().describeTable('bare_acts');
    
    const newColumns = {
      pdf_original_name: 'VARCHAR(255) NULL',
      pdf_storage_name: 'VARCHAR(255) NULL',
      pdf_storage_path: 'VARCHAR(255) NULL',
      pdf_size: 'INT UNSIGNED DEFAULT 0',
      mime_type: 'VARCHAR(100) NULL',
      file_hash: 'VARCHAR(64) NULL',
      version_number: 'INT UNSIGNED DEFAULT 1',
      is_current: 'TINYINT(1) DEFAULT 1',
      uploaded_by: 'BIGINT UNSIGNED NULL',
      uploaded_at: 'TIMESTAMP NULL',
      created_by: 'BIGINT UNSIGNED NULL',
      updated_by: 'BIGINT UNSIGNED NULL',
      deleted_by: 'BIGINT UNSIGNED NULL',
      deleted_at: 'TIMESTAMP NULL'
    };

    for (const [colName, colType] of Object.entries(newColumns)) {
      if (!tableInfo[colName]) {
        console.log(`Adding column: ${colName}`);
        await sequelize.query(`ALTER TABLE \`bare_acts\` ADD COLUMN \`${colName}\` ${colType};`);
      } else {
        console.log(`Column already exists: ${colName}`);
      }
    }
    console.log("Database schema upgrade completed successfully.");
  } catch (error) {
    console.error("Database schema upgrade failed:", error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

upgrade();
