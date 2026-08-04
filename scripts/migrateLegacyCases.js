require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { sequelize } = require('../src/config/database');
const { Case, Court, StateCourtFeeRule, StateCourtFeeSlab } = require('../src/features/associations');
const { calculateCourtFee } = require('../src/features/masters/state-fees/courtFeeCalculator.service');
const { Op } = require('sequelize');

const TITLE_META_SEP = ' :: ';
const TITLE_VS_SEP = ' — vs ';

const parseTitle = (title = '') => {
  const [head = '', stage = 'Filing', val = '0', fee = '10'] = String(title).split(TITLE_META_SEP);
  let caseType = head;
  let opponent = '';
  const vsIdx = head.indexOf(TITLE_VS_SEP);
  if (vsIdx >= 0) {
    caseType = head.slice(0, vsIdx);
    opponent = head.slice(vsIdx + TITLE_VS_SEP.length);
  }
  return {
    caseType: caseType || title || '—',
    opponent: opponent || '—',
    stage: stage || 'Filing',
    val: Number(val) || 0,
    fee: Number(fee) || 0,
  };
};

async function runMigration() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log(`Starting Legacy Cases Migration${isDryRun ? ' [DRY RUN]' : ''}`);

  let totalScanned = 0;
  let migratedCount = 0;
  let partialCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  try {
    // 1. Find all legacy cases where suitValue IS NULL
    const legacyCases = await Case.findAll({
      where: {
        suitValue: { [Op.is]: null }
      },
      include: [
        { model: Court, as: 'assignedCourt' }
      ]
    });

    totalScanned = legacyCases.length;
    console.log(`Found ${totalScanned} legacy cases to migrate.\n`);

    for (const c of legacyCases) {
      try {
        console.log(`Processing Case ID ${c.id} (${c.caseNo})...`);
        const legacyParsed = parseTitle(c.title);
        
        const suitValue = legacyParsed.val;
        const feePercentage = legacyParsed.fee;
        
        const court = c.assignedCourt;
        let stateCode = court ? court.stateCode : null;

        let advocateFee = (suitValue * feePercentage) / 100;
        let processFee = 0;
        let filingFee = 0;
        let miscCharges = 0;
        let courtFee = 0;
        let totalPayable = 0;
        let status = 'PENDING';
        let snapshot = null;
        let warning = null;

        if (stateCode) {
          // Fetch active rule
          const today = new Date().toISOString().split('T')[0];
          const activeRule = await StateCourtFeeRule.findOne({
            where: {
              stateCode,
              isActive: true,
              effectiveFrom: { [Op.lte]: today },
              [Op.or]: [
                { effectiveTo: { [Op.gte]: today } },
                { effectiveTo: { [Op.is]: null } }
              ]
            },
            include: [{ model: StateCourtFeeSlab, as: 'slabs' }],
            order: [['effectiveFrom', 'DESC']]
          });

          if (activeRule) {
            try {
              const calc = calculateCourtFee(activeRule, suitValue, feePercentage);
              advocateFee = calc.advocateFee;
              courtFee = calc.courtFee;
              processFee = calc.processFee;
              filingFee = calc.filingFee;
              miscCharges = calc.miscCharges;
              totalPayable = calc.totalAmount;
              status = 'COMPLETE';
              snapshot = calc;
            } catch (calcErr) {
              courtFee = 0;
              totalPayable = advocateFee + processFee + filingFee + miscCharges;
              status = 'ERROR';
              warning = calcErr.message;
            }
          } else {
            courtFee = 0;
            totalPayable = advocateFee + processFee + filingFee + miscCharges;
            status = 'PARTIAL';
            warning = 'No active fee configuration found for state.';
          }
        } else {
          courtFee = 0;
          totalPayable = advocateFee + processFee + filingFee + miscCharges;
          status = 'PARTIAL';
          warning = 'Court has no assigned State.';
        }

        // Clean title
        const cleanTitle = `${legacyParsed.caseType.trim()}${TITLE_VS_SEP}${legacyParsed.opponent.trim()}`;

        if (!isDryRun) {
          // Run update in transaction
          await sequelize.transaction(async (t) => {
            await c.update({
              title: cleanTitle,
              suitValue,
              feePercentage,
              advocateFee,
              courtFee,
              processFee,
              filingFee,
              miscCharges,
              totalPayable,
              feeCalculationStatus: status,
              courtFeeSnapshot: snapshot,
            }, { transaction: t });
          });
        }

        console.log(`  -> Status: ${status}`);
        if (warning) console.log(`  -> Warning: ${warning}`);
        console.log(`  -> Extracted: SuitValue=${suitValue}, Fee%=${feePercentage}`);
        console.log(`  -> Computed: TotalPayable=${totalPayable}, CleanTitle="${cleanTitle}"`);

        if (status === 'COMPLETE') migratedCount++;
        else if (status === 'PARTIAL') partialCount++;
        else if (status === 'ERROR') failedCount++;
        else skippedCount++;

      } catch (err) {
        console.error(`  -> Failed to migrate Case ID ${c.id}:`, err.message);
        failedCount++;
      }
    }

    console.log('\n=======================================');
    console.log(`MIGRATION REPORT ${isDryRun ? '[DRY RUN]' : ''}`);
    console.log('=======================================');
    console.log(`Total Cases Scanned: ${totalScanned}`);
    console.log(`Migrated (COMPLETE): ${migratedCount}`);
    console.log(`Partial (PARTIAL):   ${partialCount}`);
    console.log(`Failed (ERROR):      ${failedCount}`);
    console.log(`Skipped/Other:       ${skippedCount}`);
    console.log('=======================================');

  } catch (err) {
    console.error('Fatal Migration Error:', err);
  } finally {
    await sequelize.close();
  }
}

runMigration();
