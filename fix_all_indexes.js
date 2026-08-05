const { sequelize } = require('./src/config/database');
const logger = require('./src/config/logger');

async function run() {
  try {
    const dbName = sequelize.config.database;
    const affectedTables = [
      'advocates',
      'alerts',
      'cases',
      'clients',
      'daybook',
      'documents',
      'memberships',
      'opinions',
      'payments',
      'references_library' // Table name for Reference model
    ];

    console.log(`Scanning database ${dbName} for legacy global unique indexes...`);

    for (const table of affectedTables) {
      // Find all unique indexes for the table
      const [indexes] = await sequelize.query(`
        SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
        FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = '${dbName}'
          AND TABLE_NAME = '${table}'
          AND NON_UNIQUE = 0
          AND INDEX_NAME != 'PRIMARY'
      `);

      // Group columns by INDEX_NAME
      const indexGroups = {};
      for (const row of indexes) {
        if (!indexGroups[row.INDEX_NAME]) {
          indexGroups[row.INDEX_NAME] = [];
        }
        indexGroups[row.INDEX_NAME].push(row.COLUMN_NAME);
      }

      // Check which ones to drop
      for (const [indexName, columns] of Object.entries(indexGroups)) {
        // If the index includes 'tenant_id', it's a composite index (or tenant_id is unique by itself which is wrong anyway, but we assume composite is safe)
        if (columns.includes('tenant_id')) {
          console.log(`Skipping index ${indexName} on ${table} (already includes tenant_id)`);
          continue;
        }
        
        console.log(`Dropping legacy global unique index ${indexName} on ${table}...`);
        try {
          await sequelize.query(`ALTER TABLE ${table} DROP INDEX ${indexName}`);
          console.log(`Successfully dropped ${indexName} from ${table}`);
        } catch (error) {
          console.error(`Failed to drop ${indexName} from ${table}:`, error.message);
        }
      }
    }

    console.log('Finished dropping legacy global unique indexes.');
  } catch (e) {
    console.error('Error during cleanup:', e);
  } finally {
    process.exit(0);
  }
}

run();
