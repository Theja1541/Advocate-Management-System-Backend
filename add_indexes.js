const { sequelize } = require('./src/config/database');

async function run() {
  const indexesToAdd = [
    { table: 'advocates', indexName: 'idx_advocates_tenant_email', columns: 'tenant_id, email' },
    { table: 'advocates', indexName: 'idx_advocates_tenant_user_id', columns: 'tenant_id, user_id' },
    { table: 'alerts', indexName: 'idx_alert_unique_ref', columns: 'tenant_id, reference_type, reference_id, alert_type' },
    { table: 'cases', indexName: 'idx_cases_tenant_case_no', columns: 'tenant_id, case_no' },
    { table: 'clients', indexName: 'idx_clients_tenant_client_code', columns: 'tenant_id, client_code' },
    { table: 'daybook', indexName: 'idx_daybook_tenant_code', columns: 'tenant_id, daybook_code' },
    { table: 'documents', indexName: 'idx_documents_tenant_code', columns: 'tenant_id, document_code' },
    { table: 'memberships', indexName: 'idx_memberships_tenant_id', columns: 'tenant_id, membership_id' },
    { table: 'opinions', indexName: 'idx_opinions_tenant_ref_no', columns: 'tenant_id, reference_no' },
    { table: 'payments', indexName: 'idx_payments_tenant_receipt', columns: 'tenant_id, receipt_no' },
    { table: 'payments', indexName: 'idx_payments_tenant_transaction', columns: 'tenant_id, transaction_id' },
    { table: 'references_library', indexName: 'idx_references_tenant_citation', columns: 'tenant_id, citation' }
  ];

  for (const idx of indexesToAdd) {
    try {
      await sequelize.query(`CREATE UNIQUE INDEX ${idx.indexName} ON ${idx.table} (${idx.columns})`);
      console.log(`Created unique index ${idx.indexName} on ${idx.table}`);
    } catch (e) {
      if (e.name === 'SequelizeDatabaseError' && e.parent.code === 'ER_DUP_KEYNAME') {
         console.log(`Index ${idx.indexName} already exists on ${idx.table}`);
      } else {
         console.error(`Failed to create index ${idx.indexName} on ${idx.table}:`, e.message);
      }
    }
  }

  process.exit(0);
}

run();
