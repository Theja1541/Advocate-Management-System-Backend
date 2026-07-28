const { sequelize } = require('../src/config/database');
const { Case, CaseDiary } = require('../src/features/associations');
const { createDiary, deleteDiary } = require('../src/features/diary/diaryService');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    // 1. Fetch initial Case 1 nextHearing
    let caseRecord = await Case.findByPk(1);
    console.log('Initial nextHearing for Case 1:', caseRecord.nextHearing);

    // 2. Create a diary entry with a future nextHearingDate
    console.log('Adding diary entry with nextHearingDate: 2026-08-15...');
    const entry = await createDiary({
      caseId: 1,
      hearingDate: '2026-07-25',
      hearingTime: '10:00:00',
      advocateId: 2,
      courtIndex: 0,
      note: 'Test entry for synchronization verification',
      nextHearingDate: '2026-08-15',
      attachmentsCount: 0,
      createdBy: 1,
      updatedBy: 1
    });

    // 3. Confirm Case 1 nextHearing has updated
    caseRecord = await Case.findByPk(1);
    console.log('Updated nextHearing for Case 1:', caseRecord.nextHearing);

    // 4. Delete the diary entry
    console.log('Deleting the added diary entry...');
    await deleteDiary(entry.id);

    // 5. Confirm Case 1 nextHearing reverted
    caseRecord = await Case.findByPk(1);
    console.log('Reverted nextHearing for Case 1:', caseRecord.nextHearing);

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

test();
