const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const caseIds = [14, 15, 16, 17, 18, 19, 20];
    const caseList = caseIds.join(',');

    const [approvalHistory] = await sequelize.query(`SELECT COUNT(*) as count FROM case_approval_history WHERE case_id IN (${caseList})`);
    const [caseDiaries] = await sequelize.query(`SELECT COUNT(*) as count FROM case_diaries WHERE case_id IN (${caseList})`);
    const [stageHistory] = await sequelize.query(`SELECT COUNT(*) as count FROM case_stage_history WHERE case_id IN (${caseList})`);
    const [diaryEntries] = await sequelize.query(`SELECT COUNT(*) as count FROM diary_entries WHERE case_id IN (${caseList})`);
    const [documents] = await sequelize.query(`SELECT COUNT(*) as count FROM documents WHERE case_id IN (${caseList})`);
    const [lands] = await sequelize.query(`SELECT COUNT(*) as count FROM lands WHERE case_id IN (${caseList})`);
    const [payments] = await sequelize.query(`SELECT COUNT(*) as count FROM payments WHERE case_id IN (${caseList})`);

    // Check opinions or land_title_searches linked to lands of cases 14-20
    const [opinionsViaLand] = await sequelize.query(`SELECT COUNT(*) as count FROM opinions WHERE land_id IN (SELECT id FROM lands WHERE case_id IN (${caseList}))`);
    const [titleSearchesViaLand] = await sequelize.query(`SELECT COUNT(*) as count FROM land_title_searches WHERE land_id IN (SELECT id FROM lands WHERE case_id IN (${caseList}))`);

    console.log({
      casesToDelete: 7,
      case_approval_history: approvalHistory[0].count,
      case_diaries: caseDiaries[0].count,
      case_stage_history: stageHistory[0].count,
      diary_entries: diaryEntries[0].count,
      documents: documents[0].count,
      lands: lands[0].count,
      payments: payments[0].count,
      opinionsViaLand: opinionsViaLand[0].count,
      titleSearchesViaLand: titleSearchesViaLand[0].count
    });

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
