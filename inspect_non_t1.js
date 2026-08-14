const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [nonT1Cases] = await sequelize.query(`SELECT id, title, tenant_id FROM cases WHERE tenant_id <> 1`);
    console.log('Non-t1 cases:', nonT1Cases);

    const caseIds = nonT1Cases.map(c => c.id);
    if (caseIds.length > 0) {
      const [diaries] = await sequelize.query(`SELECT id, case_id, tenant_id FROM case_diaries WHERE case_id IN (${caseIds.join(',')})`);
      console.log('Diaries referencing non-t1 cases:', diaries);

      const [history] = await sequelize.query(`SELECT id, case_id, tenant_id FROM case_stage_history WHERE case_id IN (${caseIds.join(',')})`);
      console.log('Stage history referencing non-t1 cases:', history);

      const [approval] = await sequelize.query(`SELECT id, case_id FROM case_approval_history WHERE case_id IN (${caseIds.join(',')})`);
      console.log('Approval history referencing non-t1 cases:', approval);

      const [docs] = await sequelize.query(`SELECT id, case_id, tenant_id FROM documents WHERE case_id IN (${caseIds.join(',')})`);
      console.log('Docs referencing non-t1 cases:', docs);

      const [payments] = await sequelize.query(`SELECT id, case_id, tenant_id FROM payments WHERE case_id IN (${caseIds.join(',')})`);
      console.log('Payments referencing non-t1 cases:', payments);

      const [tasks] = await sequelize.query(`SELECT id, case_id, tenant_id FROM tasks WHERE case_id IN (${caseIds.join(',')})`);
      console.log('Tasks referencing non-t1 cases:', tasks);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
