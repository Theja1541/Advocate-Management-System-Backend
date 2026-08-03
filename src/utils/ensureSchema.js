const { sequelize } = require('../config/database');
const logger = require('../config/logger');

/**
 * Ensures advocates.user_id exists without a full DB reset.
 * Safe to run on every startup.
 */
const ensureAdvocateUserIdColumn = async () => {
  try {
    const [rows] = await sequelize.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'advocates'
        AND COLUMN_NAME = 'user_id'
    `);
    const count = Number(rows?.[0]?.cnt || 0);
    if (count > 0) return;

    await sequelize.query(`
      ALTER TABLE advocates
        ADD COLUMN user_id INT UNSIGNED NULL,
        ADD UNIQUE INDEX advocates_user_id_unique (user_id),
        ADD CONSTRAINT fk_advocates_user_id
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
    `);
    logger.info('Added advocates.user_id column for advocate login linking.');
  } catch (error) {
    // Table may not exist yet (fresh install before sync/seed)
    logger.warn('ensureAdvocateUserIdColumn skipped:', error.message);
  }
};

const linkDemoAdvocateIfNeeded = async () => {
  try {
    const [users] = await sequelize.query(`
      SELECT id FROM users WHERE email = 'advocate@legaldesk.in' LIMIT 1
    `);
    const userId = users?.[0]?.id;
    if (!userId) return;

    const [advocates] = await sequelize.query(`
      SELECT id, user_id AS userId
      FROM advocates
      WHERE email = 'advocate@legaldesk.in'
         OR name LIKE '%Sailaja%'
      ORDER BY id ASC
      LIMIT 1
    `);
    const advocate = advocates?.[0];
    if (!advocate) return;
    if (advocate.userId) return;

    await sequelize.query(
      `UPDATE advocates SET user_id = :userId WHERE id = :id AND user_id IS NULL`,
      { replacements: { userId, id: advocate.id } }
    );
    logger.info(`Linked advocate #${advocate.id} to login user #${userId}.`);
  } catch (error) {
    logger.warn('linkDemoAdvocateIfNeeded skipped:', error.message);
  }
};

const ensureTasksTable = async () => {
  try {
    const { Task, Amendment, Case, Alert } = require('../features/associations');
    await Task.sync();
    await Amendment.sync({ alter: true });
    await Case.sync({ alter: true });
    await Alert.sync({ alter: true });
    logger.info('Synced Task, Amendment, Case, and Alert tables.');
  } catch (error) {
    logger.warn('ensureTasksTable / ensureAmendmentTable / ensureCaseTable failed:', error.message);
  }
};

const ensureStateCourtFeeTables = async () => {
  try {
    const { StateCourtFeeRule, StateCourtFeeSlab } = require('../features/associations');
    await StateCourtFeeRule.sync({ alter: true });
    await StateCourtFeeSlab.sync({ alter: true });

    const count = await StateCourtFeeRule.count();
    if (count === 0) {
      logger.info('Seeding exact CLF application state court fee rules and slabs...');
      
      // 1. Seed Andhra Pradesh (AP) - CLF Cumulative Schedule
      const apRule = await StateCourtFeeRule.create({
        stateCode: 'AP',
        stateName: 'Andhra Pradesh',
        ruleType: 'SLAB',
        calculationMode: 'MARGINAL_CUMULATIVE',
        effectiveFrom: '2022-01-01',
        actName: 'Andhra Pradesh Court Fees and Suits Valuation Act, 1956',
        actVersion: '1956 (Amended 2022)',
        notificationNo: 'G.O.Ms.No. 42 / Legal Affairs',
        defaultAdvocateFeePct: 10.00,
        processFee: 500.00,
        filingFee: 1000.00,
        miscCharges: 2000.00,
        isActive: true,
        notes: 'CLF Schedule: Section 20 of AP Court Fees Act 1956.',
      });
      await StateCourtFeeSlab.bulkCreate([
        { ruleId: apRule.id, fromAmount: 0, toAmount: 100000, feeType: 'PERCENTAGE', feeValue: 2.50, minFee: 100, displayOrder: 1 },
        { ruleId: apRule.id, fromAmount: 100001, toAmount: 500000, feeType: 'PERCENTAGE', feeValue: 2.00, minFee: 2500, displayOrder: 2 },
        { ruleId: apRule.id, fromAmount: 500001, toAmount: 1000000, feeType: 'PERCENTAGE', feeValue: 1.50, minFee: 10500, displayOrder: 3 },
        { ruleId: apRule.id, fromAmount: 1000001, toAmount: null, feeType: 'PERCENTAGE', feeValue: 1.00, minFee: 18000, displayOrder: 4 },
      ]);

      // 2. Seed Telangana (TS) - CLF Cumulative Schedule
      const tsRule = await StateCourtFeeRule.create({
        stateCode: 'TS',
        stateName: 'Telangana',
        ruleType: 'SLAB',
        calculationMode: 'MARGINAL_CUMULATIVE',
        effectiveFrom: '2014-06-02',
        actName: 'Telangana Court Fees and Suits Valuation Act, 1956',
        actVersion: '1956 (Adapted 2014)',
        notificationNo: 'G.O.Ms.No. 18 / Law Department',
        defaultAdvocateFeePct: 10.00,
        processFee: 500.00,
        filingFee: 1000.00,
        miscCharges: 2000.00,
        isActive: true,
        notes: 'CLF Schedule: Telangana adapted civil court fee scale.',
      });
      await StateCourtFeeSlab.bulkCreate([
        { ruleId: tsRule.id, fromAmount: 0, toAmount: 100000, feeType: 'PERCENTAGE', feeValue: 2.50, minFee: 100, displayOrder: 1 },
        { ruleId: tsRule.id, fromAmount: 100001, toAmount: 500000, feeType: 'PERCENTAGE', feeValue: 2.00, minFee: 2500, displayOrder: 2 },
        { ruleId: tsRule.id, fromAmount: 500001, toAmount: null, feeType: 'PERCENTAGE', feeValue: 1.25, minFee: 10500, displayOrder: 3 },
      ]);

      // 3. Seed Karnataka (KA) - CLF 2.5% Ad-valorem with Cap
      await StateCourtFeeRule.create({
        stateCode: 'KA',
        stateName: 'Karnataka',
        ruleType: 'PERCENTAGE',
        calculationMode: 'SINGLE_SLAB',
        percentageRate: 2.50,
        minFee: 250.00,
        maxFee: 100000.00,
        effectiveFrom: '2020-04-01',
        actName: 'Karnataka Court Fees and Suits Valuation Act, 1958',
        actVersion: '1958 (Amended 2020)',
        notificationNo: 'LAW 35 LCA 2020',
        defaultAdvocateFeePct: 12.00,
        processFee: 600.00,
        filingFee: 1200.00,
        miscCharges: 2500.00,
        isActive: true,
        notes: 'CLF Schedule: Ad-valorem 2.5% subject to max cap of ₹1,00,000.',
      });

      // 4. Seed Tamil Nadu (TN) - CLF 3.0% Ad-valorem with Cap
      await StateCourtFeeRule.create({
        stateCode: 'TN',
        stateName: 'Tamil Nadu',
        ruleType: 'PERCENTAGE',
        calculationMode: 'SINGLE_SLAB',
        percentageRate: 3.00,
        minFee: 300.00,
        maxFee: 150000.00,
        effectiveFrom: '2017-09-01',
        actName: 'Tamil Nadu Court Fees and Suits Valuation Act, 1955',
        actVersion: '1955 (Amended 2017)',
        notificationNo: 'G.O.Ms.No. 112 / Home (Courts)',
        defaultAdvocateFeePct: 10.00,
        processFee: 750.00,
        filingFee: 1500.00,
        miscCharges: 3000.00,
        isActive: true,
        notes: 'CLF Schedule: Flat 3% ad-valorem court fee with ₹1,50,000 cap.',
      });

      // 5. Seed Delhi (DL) - CLF Delhi Civil Court Fee Schedule
      const dlRule = await StateCourtFeeRule.create({
        stateCode: 'DL',
        stateName: 'Delhi',
        ruleType: 'SLAB',
        calculationMode: 'MARGINAL_CUMULATIVE',
        effectiveFrom: '2012-07-16',
        actName: 'Court Fees (Delhi Amendment) Act, 2012',
        actVersion: '2012',
        notificationNo: 'F.14(12)/LA-2012/l-law/87',
        defaultAdvocateFeePct: 15.00,
        processFee: 1000.00,
        filingFee: 2000.00,
        miscCharges: 4000.00,
        isActive: true,
        notes: 'CLF Schedule: Delhi civil suit fee scale.',
      });
      await StateCourtFeeSlab.bulkCreate([
        { ruleId: dlRule.id, fromAmount: 0, toAmount: 5000, feeType: 'PERCENTAGE', feeValue: 6.25, minFee: 50, displayOrder: 1 },
        { ruleId: dlRule.id, fromAmount: 5001, toAmount: 20000, feeType: 'PERCENTAGE', feeValue: 5.00, minFee: 312.50, displayOrder: 2 },
        { ruleId: dlRule.id, fromAmount: 20001, toAmount: 50000, feeType: 'PERCENTAGE', feeValue: 3.75, minFee: 1062.50, displayOrder: 3 },
        { ruleId: dlRule.id, fromAmount: 50001, toAmount: 400000, feeType: 'PERCENTAGE', feeValue: 2.50, minFee: 2187.50, displayOrder: 4 },
        { ruleId: dlRule.id, fromAmount: 400001, toAmount: null, feeType: 'PERCENTAGE', feeValue: 1.25, minFee: 10937.50, displayOrder: 5 },
      ]);

      // 6. Seed Maharashtra (MH) - CLF Schedule I Article 1
      const mhRule = await StateCourtFeeRule.create({
        stateCode: 'MH',
        stateName: 'Maharashtra',
        ruleType: 'SLAB',
        calculationMode: 'MARGINAL_CUMULATIVE',
        maxFee: 300000.00,
        effectiveFrom: '2018-01-01',
        actName: 'Maharashtra Court Fees Act, 1959',
        actVersion: '1959 (Amended 2018)',
        notificationNo: 'MAHA-GAZ-2018-09',
        defaultAdvocateFeePct: 10.00,
        processFee: 800.00,
        filingFee: 1500.00,
        miscCharges: 3500.00,
        isActive: true,
        notes: 'CLF Schedule: Schedule I Article 1 of Maharashtra Court Fees Act (Max ₹3,00,000).',
      });
      await StateCourtFeeSlab.bulkCreate([
        { ruleId: mhRule.id, fromAmount: 0, toAmount: 10000, feeType: 'PERCENTAGE', feeValue: 5.00, minFee: 200, displayOrder: 1 },
        { ruleId: mhRule.id, fromAmount: 10001, toAmount: 50000, feeType: 'PERCENTAGE', feeValue: 4.00, minFee: 500, displayOrder: 2 },
        { ruleId: mhRule.id, fromAmount: 50001, toAmount: 100000, feeType: 'PERCENTAGE', feeValue: 3.00, minFee: 2100, displayOrder: 3 },
        { ruleId: mhRule.id, fromAmount: 100001, toAmount: 200000, feeType: 'PERCENTAGE', feeValue: 2.50, minFee: 3600, displayOrder: 4 },
        { ruleId: mhRule.id, fromAmount: 200001, toAmount: 500000, feeType: 'PERCENTAGE', feeValue: 2.00, minFee: 6100, displayOrder: 5 },
        { ruleId: mhRule.id, fromAmount: 500001, toAmount: 1000000, feeType: 'PERCENTAGE', feeValue: 1.50, minFee: 12100, displayOrder: 6 },
        { ruleId: mhRule.id, fromAmount: 1000001, toAmount: null, feeType: 'PERCENTAGE', feeValue: 1.00, minFee: 19600, displayOrder: 7 },
      ]);

      // 7. Seed Consumer Court (CC) - CLF Consumer Disputes Fee Schedule
      const ccRule = await StateCourtFeeRule.create({
        stateCode: 'CC',
        stateName: 'Consumer Commission (District/State/National)',
        ruleType: 'SLAB',
        calculationMode: 'SINGLE_SLAB',
        effectiveFrom: '2020-07-20',
        actName: 'Consumer Protection (Consumer Disputes Redressal Commissions) Rules, 2020',
        actVersion: '2020',
        notificationNo: 'G.S.R. 462(E) / Ministry of Consumer Affairs',
        defaultAdvocateFeePct: 10.00,
        processFee: 300.00,
        filingFee: 500.00,
        miscCharges: 1000.00,
        isActive: true,
        notes: 'CLF Schedule: Consumer commission statutory filing fee tiers.',
      });
      await StateCourtFeeSlab.bulkCreate([
        { ruleId: ccRule.id, fromAmount: 0, toAmount: 500000, feeType: 'FIXED', feeValue: 0.00, minFee: 0, displayOrder: 1 },
        { ruleId: ccRule.id, fromAmount: 500001, toAmount: 1000000, feeType: 'FIXED', feeValue: 200.00, minFee: 0, displayOrder: 2 },
        { ruleId: ccRule.id, fromAmount: 1000001, toAmount: 2000000, feeType: 'FIXED', feeValue: 500.00, minFee: 0, displayOrder: 3 },
        { ruleId: ccRule.id, fromAmount: 2000001, toAmount: 5000000, feeType: 'FIXED', feeValue: 1000.00, minFee: 0, displayOrder: 4 },
        { ruleId: ccRule.id, fromAmount: 5000001, toAmount: 10000000, feeType: 'FIXED', feeValue: 2000.00, minFee: 0, displayOrder: 5 },
        { ruleId: ccRule.id, fromAmount: 10000001, toAmount: 20000000, feeType: 'FIXED', feeValue: 2500.00, minFee: 0, displayOrder: 6 },
        { ruleId: ccRule.id, fromAmount: 20000001, toAmount: 40000000, feeType: 'FIXED', feeValue: 3000.00, minFee: 0, displayOrder: 7 },
        { ruleId: ccRule.id, fromAmount: 40000001, toAmount: 60000000, feeType: 'FIXED', feeValue: 4000.00, minFee: 0, displayOrder: 8 },
        { ruleId: ccRule.id, fromAmount: 60000001, toAmount: 80000000, feeType: 'FIXED', feeValue: 5000.00, minFee: 0, displayOrder: 9 },
        { ruleId: ccRule.id, fromAmount: 80000001, toAmount: 100000000, feeType: 'FIXED', feeValue: 6000.00, minFee: 0, displayOrder: 10 },
        { ruleId: ccRule.id, fromAmount: 100000001, toAmount: null, feeType: 'FIXED', feeValue: 7500.00, minFee: 0, displayOrder: 11 },
      ]);

      // 8. Seed DRT (Debts Recovery Tribunal) - CLF DRT OA Fee Schedule
      const drtRule = await StateCourtFeeRule.create({
        stateCode: 'DRT',
        stateName: 'Debts Recovery Tribunal (DRT)',
        ruleType: 'SLAB',
        calculationMode: 'MARGINAL_CUMULATIVE',
        maxFee: 150000.00,
        effectiveFrom: '1993-06-24',
        actName: 'Debts Recovery Tribunal (Procedure) Rules, 1993',
        actVersion: '1993 (Amended)',
        notificationNo: 'Rule 7 / Debts Recovery Tribunal',
        defaultAdvocateFeePct: 10.00,
        processFee: 1000.00,
        filingFee: 2000.00,
        miscCharges: 3000.00,
        isActive: true,
        notes: 'CLF Schedule: ₹10,000 for first ₹10L debt + ₹1,000 for every additional ₹1L (Max ₹1,50,000).',
      });
      await StateCourtFeeSlab.bulkCreate([
        { ruleId: drtRule.id, fromAmount: 0, toAmount: 1000000, feeType: 'FIXED', feeValue: 10000.00, minFee: 10000.00, displayOrder: 1 },
        { ruleId: drtRule.id, fromAmount: 1000001, toAmount: null, feeType: 'PERCENTAGE', feeValue: 1.00, minFee: 10000.00, displayOrder: 2 },
      ]);

      logger.info('Successfully seeded exact CLF application state fee rules and slabs.');
    }
    logger.info('Synced StateCourtFeeRule and StateCourtFeeSlab tables.');
  } catch (error) {
    logger.warn('ensureStateCourtFeeTables failed:', error.message);
  }
};

module.exports = { ensureAdvocateUserIdColumn, linkDemoAdvocateIfNeeded, ensureTasksTable, ensureStateCourtFeeTables };
