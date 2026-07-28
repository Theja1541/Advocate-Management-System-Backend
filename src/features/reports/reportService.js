const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const AppError = require('../../utils/AppError');

const REPORT_TYPES = [
  'case',
  'advocate',
  'client',
  'payment',
  'membership',
  'daily',
  'monthly',
  'state-wise',
];

const REPORT_META = {
  case: {
    title: 'Case Report',
    description: 'Every matter by court, stage, advocate and next date',
  },
  advocate: {
    title: 'Advocate Report',
    description: 'Case load, disposal and fee earned per advocate',
  },
  client: {
    title: 'Client Report',
    description: 'Matters, documents and fee position per client',
  },
  payment: {
    title: 'Payment Report',
    description: 'Receipts, outstanding and advocate shares',
  },
  membership: {
    title: 'Membership Report',
    description: 'Plans, renewals and expiry',
  },
  daily: {
    title: 'Daily Report',
    description: 'Day book, hearings held and diary entries for a date',
  },
  monthly: {
    title: 'Monthly Report',
    description: 'Consolidated position for the month',
  },
  'state-wise': {
    title: 'State-wise Report',
    description: 'Matters and amounts grouped by state',
  },
};

const toNumber = (value) => Number(value || 0);

const getCaseReport = async () => {
  const rows = await sequelize.query(
    `
    SELECT
      c.id,
      c.case_no AS caseNo,
      c.court,
      c.status,
      cs.name AS stage,
      c.next_hearing AS nextHearing,
      c.advocate_id AS advocateId,
      a.name AS advocateName,
      c.client_id AS clientId,
      cl.name AS clientName,
      COALESCE(
        CAST(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(c.title, ' :: ', 3), ' :: ', -1)) AS DECIMAL(14, 2)),
        0
      ) AS caseValue
    FROM cases c
    LEFT JOIN advocates a ON a.id = c.advocate_id
    LEFT JOIN clients cl ON cl.id = c.client_id
    LEFT JOIN case_stages cs ON cs.id = c.case_stage_id
    ORDER BY c.court ASC, c.next_hearing ASC, c.id ASC
    `,
    { type: QueryTypes.SELECT }
  );

  const byCourt = await sequelize.query(
    `
    SELECT
      COALESCE(court, 'Unassigned') AS court,
      COUNT(*) AS caseCount,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS activeCount,
      SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closedCount,
      SUM(CASE WHEN status = 'Pending Approval' THEN 1 ELSE 0 END) AS pendingCount
    FROM cases
    GROUP BY COALESCE(court, 'Unassigned')
    ORDER BY caseCount DESC, court ASC
    `,
    { type: QueryTypes.SELECT }
  );

  return {
    rows: rows.map((r) => ({ ...r, caseValue: toNumber(r.caseValue) })),
    summary: {
      totalCases: rows.length,
      byCourt: byCourt.map((r) => ({
        court: r.court,
        caseCount: toNumber(r.caseCount),
        activeCount: toNumber(r.activeCount),
        closedCount: toNumber(r.closedCount),
        pendingCount: toNumber(r.pendingCount),
      })),
    },
  };
};

const getAdvocateReport = async () => {
  const rows = await sequelize.query(
    `
    SELECT
      a.id AS advocateId,
      a.name AS advocateName,
      a.relation,
      a.specialization,
      a.status,
      COALESCE(cs.caseLoad, 0) AS caseLoad,
      COALESCE(cs.disposedCount, 0) AS disposedCount,
      COALESCE(cs.activeCount, 0) AS activeCount,
      COALESCE(fs.feeEarned, 0) AS feeEarned,
      COALESCE(cr.clientReceiptsOnMatters, 0) AS clientReceiptsOnMatters
    FROM advocates a
    LEFT JOIN (
      SELECT
        advocate_id,
        COUNT(*) AS caseLoad,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS disposedCount,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS activeCount
      FROM cases
      GROUP BY advocate_id
    ) cs ON cs.advocate_id = a.id
    LEFT JOIN (
      SELECT
        party_id AS advocate_id,
        SUM(amount_received) AS feeEarned
      FROM payments
      WHERE party_type = 'Advocate'
      GROUP BY party_id
    ) fs ON fs.advocate_id = a.id
    LEFT JOIN (
      SELECT
        c.advocate_id,
        SUM(p.amount_received) AS clientReceiptsOnMatters
      FROM payments p
      INNER JOIN cases c ON c.id = p.case_id
      WHERE p.party_type = 'Client'
      GROUP BY c.advocate_id
    ) cr ON cr.advocate_id = a.id
    ORDER BY caseLoad DESC, a.name ASC
    `,
    { type: QueryTypes.SELECT }
  );

  return {
    rows: rows.map((r) => ({
      ...r,
      caseLoad: toNumber(r.caseLoad),
      disposedCount: toNumber(r.disposedCount),
      activeCount: toNumber(r.activeCount),
      feeEarned: toNumber(r.feeEarned),
      clientReceiptsOnMatters: toNumber(r.clientReceiptsOnMatters),
    })),
    summary: {
      totalAdvocates: rows.length,
      totalFeeEarned: rows.reduce((sum, r) => sum + toNumber(r.feeEarned), 0),
      totalCaseLoad: rows.reduce((sum, r) => sum + toNumber(r.caseLoad), 0),
    },
  };
};

const getClientReport = async () => {
  const rows = await sequelize.query(
    `
    SELECT
      cl.id AS clientId,
      cl.client_code AS clientCode,
      cl.name AS clientName,
      cl.village,
      cl.docs_count AS docsCount,
      COALESCE(cs.matterCount, 0) AS matterCount,
      COALESCE(ds.uploadedDocuments, 0) AS uploadedDocuments,
      COALESCE(ps.amountReceived, 0) AS amountReceived,
      COALESCE(ps.amountOutstanding, 0) AS amountOutstanding
    FROM clients cl
    LEFT JOIN (
      SELECT client_id, COUNT(*) AS matterCount
      FROM cases
      GROUP BY client_id
    ) cs ON cs.client_id = cl.id
    LEFT JOIN (
      SELECT c.client_id, COUNT(d.id) AS uploadedDocuments
      FROM documents d
      INNER JOIN cases c ON c.id = d.case_id
      GROUP BY c.client_id
    ) ds ON ds.client_id = cl.id
    LEFT JOIN (
      SELECT
        party_id AS client_id,
        SUM(amount_received) AS amountReceived,
        SUM(amount_outstanding) AS amountOutstanding
      FROM payments
      WHERE party_type = 'Client'
      GROUP BY party_id
    ) ps ON ps.client_id = cl.id
    ORDER BY matterCount DESC, cl.name ASC
    `,
    { type: QueryTypes.SELECT }
  );

  return {
    rows: rows.map((r) => ({
      ...r,
      docsCount: toNumber(r.docsCount),
      matterCount: toNumber(r.matterCount),
      uploadedDocuments: toNumber(r.uploadedDocuments),
      amountReceived: toNumber(r.amountReceived),
      amountOutstanding: toNumber(r.amountOutstanding),
    })),
    summary: {
      totalClients: rows.length,
      totalReceived: rows.reduce((sum, r) => sum + toNumber(r.amountReceived), 0),
      totalOutstanding: rows.reduce((sum, r) => sum + toNumber(r.amountOutstanding), 0),
    },
  };
};

const getPaymentReport = async () => {
  const rows = await sequelize.query(
    `
    SELECT
      p.id,
      p.receipt_no AS receiptNo,
      p.transaction_date AS transactionDate,
      p.party_type AS partyType,
      p.party_id AS partyId,
      CASE
        WHEN p.party_type = 'Client' THEN cl.name
        WHEN p.party_type = 'Advocate' THEN a.name
        ELSE '—'
      END AS partyName,
      p.amount_received AS amountReceived,
      p.amount_outstanding AS amountOutstanding,
      p.status,
      c.case_no AS caseNo,
      c.advocate_id AS advocateId,
      adv.name AS assignedAdvocate
    FROM payments p
    LEFT JOIN cases c ON c.id = p.case_id
    LEFT JOIN clients cl ON p.party_type = 'Client' AND cl.id = p.party_id
    LEFT JOIN advocates a ON p.party_type = 'Advocate' AND a.id = p.party_id
    LEFT JOIN advocates adv ON adv.id = c.advocate_id
    ORDER BY p.transaction_date DESC, p.id DESC
    `,
    { type: QueryTypes.SELECT }
  );

  const advocateShares = await sequelize.query(
    `
    SELECT
      a.id AS advocateId,
      a.name AS advocateName,
      COUNT(p.id) AS shareCount,
      COALESCE(SUM(p.amount_received), 0) AS totalShare
    FROM payments p
    INNER JOIN advocates a ON a.id = p.party_id
    WHERE p.party_type = 'Advocate'
    GROUP BY a.id, a.name
    ORDER BY totalShare DESC, a.name ASC
    `,
    { type: QueryTypes.SELECT }
  );

  const totals = await sequelize.query(
    `
    SELECT
      COALESCE(SUM(amount_received), 0) AS totalReceived,
      COALESCE(SUM(amount_outstanding), 0) AS totalOutstanding,
      COALESCE(SUM(CASE WHEN party_type = 'Client' THEN amount_received ELSE 0 END), 0) AS clientReceipts,
      COALESCE(SUM(CASE WHEN party_type = 'Advocate' THEN amount_received ELSE 0 END), 0) AS advocateShares
    FROM payments
    `,
    { type: QueryTypes.SELECT }
  );

  const summaryRow = totals[0] || {};

  return {
    rows: rows.map((r) => ({
      ...r,
      amountReceived: toNumber(r.amountReceived),
      amountOutstanding: toNumber(r.amountOutstanding),
    })),
    advocateShares: advocateShares.map((r) => ({
      ...r,
      shareCount: toNumber(r.shareCount),
      totalShare: toNumber(r.totalShare),
    })),
    summary: {
      totalReceived: toNumber(summaryRow.totalReceived),
      totalOutstanding: toNumber(summaryRow.totalOutstanding),
      clientReceipts: toNumber(summaryRow.clientReceipts),
      advocateShares: toNumber(summaryRow.advocateShares),
    },
  };
};

const getMembershipReport = async () => {
  const rows = await sequelize.query(
    `
    SELECT
      m.id,
      m.advocate_id AS advocateId,
      a.name AS advocateName,
      m.plan_name AS planName,
      m.fee_amount AS feeAmount,
      m.start_date AS startDate,
      m.expiry_date AS expiryDate,
      m.status,
      DATEDIFF(m.expiry_date, CURDATE()) AS daysToExpiry
    FROM memberships m
    LEFT JOIN advocates a ON a.id = m.advocate_id
    ORDER BY m.expiry_date ASC, a.name ASC
    `,
    { type: QueryTypes.SELECT }
  );

  const byStatus = await sequelize.query(
    `
    SELECT
      status,
      COUNT(*) AS count,
      COALESCE(SUM(fee_amount), 0) AS feeTotal
    FROM memberships
    GROUP BY status
    `,
    { type: QueryTypes.SELECT }
  );

  return {
    rows: rows.map((r) => ({
      ...r,
      feeAmount: toNumber(r.feeAmount),
      daysToExpiry: toNumber(r.daysToExpiry),
    })),
    summary: {
      totalMemberships: rows.length,
      byStatus: byStatus.map((r) => ({
        status: r.status,
        count: toNumber(r.count),
        feeTotal: toNumber(r.feeTotal),
      })),
    },
  };
};

const getDailyReport = async ({ date } = {}) => {
  const reportDate = date || new Date().toISOString().slice(0, 10);

  const daybook = await sequelize.query(
    `
    SELECT
      d.id,
      d.daybook_code AS daybookCode,
      d.transaction_date AS transactionDate,
      d.category,
      d.particulars,
      d.payment_mode AS paymentMode,
      d.type,
      d.amount,
      u.name AS recordedBy
    FROM daybook d
    LEFT JOIN users u ON u.id = d.recorded_by
    WHERE d.transaction_date = :reportDate
    ORDER BY d.id ASC
    `,
    { replacements: { reportDate }, type: QueryTypes.SELECT }
  );

  const hearings = await sequelize.query(
    `
    SELECT
      c.id,
      c.case_no AS caseNo,
      c.court,
      c.next_hearing AS nextHearing,
      a.name AS advocateName,
      cl.name AS clientName,
      c.status
    FROM cases c
    LEFT JOIN advocates a ON a.id = c.advocate_id
    LEFT JOIN clients cl ON cl.id = c.client_id
    WHERE c.next_hearing = :reportDate
    ORDER BY c.court ASC, c.case_no ASC
    `,
    { replacements: { reportDate }, type: QueryTypes.SELECT }
  );

  const diary = await sequelize.query(
    `
    SELECT
      cd.id,
      cd.hearing_date AS hearingDate,
      cd.hearing_time AS hearingTime,
      c.case_no AS caseNo,
      a.name AS advocateName,
      cd.note,
      cd.next_hearing_date AS nextHearingDate,
      cd.attachments_count AS attachmentsCount
    FROM case_diaries cd
    LEFT JOIN cases c ON c.id = cd.case_id
    LEFT JOIN advocates a ON a.id = cd.advocate_id
    WHERE cd.hearing_date = :reportDate
    ORDER BY cd.hearing_time ASC, cd.id ASC
    `,
    { replacements: { reportDate }, type: QueryTypes.SELECT }
  );

  const daybookIn = daybook
    .filter((r) => r.type === 'in')
    .reduce((sum, r) => sum + toNumber(r.amount), 0);
  const daybookOut = daybook
    .filter((r) => r.type === 'out')
    .reduce((sum, r) => sum + toNumber(r.amount), 0);

  return {
    date: reportDate,
    daybook: daybook.map((r) => ({ ...r, amount: toNumber(r.amount) })),
    hearings,
    diary: diary.map((r) => ({
      ...r,
      attachmentsCount: toNumber(r.attachmentsCount),
    })),
    summary: {
      daybookEntries: daybook.length,
      daybookIn,
      daybookOut,
      daybookNet: daybookIn - daybookOut,
      hearingsCount: hearings.length,
      diaryEntries: diary.length,
    },
  };
};

const getMonthlyReport = async ({ month, year } = {}) => {
  const now = new Date();
  const reportYear = Number(year) || now.getFullYear();
  const reportMonth = Number(month) || now.getMonth() + 1;
  const monthStart = `${reportYear}-${String(reportMonth).padStart(2, '0')}-01`;

  const [caseStats] = await sequelize.query(
    `
    SELECT
      COUNT(*) AS totalCases,
      SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) AS activeCases,
      SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closedCases,
      SUM(CASE WHEN status = 'Pending Approval' THEN 1 ELSE 0 END) AS pendingCases,
      SUM(CASE WHEN DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(:monthStart, '%Y-%m') THEN 1 ELSE 0 END) AS openedThisMonth
    FROM cases
    `,
    { replacements: { monthStart }, type: QueryTypes.SELECT }
  );

  const [paymentStats] = await sequelize.query(
    `
    SELECT
      COALESCE(SUM(amount_received), 0) AS totalReceived,
      COALESCE(SUM(amount_outstanding), 0) AS totalOutstanding,
      COALESCE(SUM(CASE WHEN party_type = 'Advocate' THEN amount_received ELSE 0 END), 0) AS advocateShares,
      COUNT(*) AS paymentCount
    FROM payments
    WHERE DATE_FORMAT(transaction_date, '%Y-%m') = DATE_FORMAT(:monthStart, '%Y-%m')
    `,
    { replacements: { monthStart }, type: QueryTypes.SELECT }
  );

  const [daybookStats] = await sequelize.query(
    `
    SELECT
      COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE 0 END), 0) AS cashIn,
      COALESCE(SUM(CASE WHEN type = 'out' THEN amount ELSE 0 END), 0) AS cashOut,
      COUNT(*) AS entryCount
    FROM daybook
    WHERE DATE_FORMAT(transaction_date, '%Y-%m') = DATE_FORMAT(:monthStart, '%Y-%m')
    `,
    { replacements: { monthStart }, type: QueryTypes.SELECT }
  );

  const [diaryStats] = await sequelize.query(
    `
    SELECT COUNT(*) AS hearingCount
    FROM case_diaries
    WHERE DATE_FORMAT(hearing_date, '%Y-%m') = DATE_FORMAT(:monthStart, '%Y-%m')
    `,
    { replacements: { monthStart }, type: QueryTypes.SELECT }
  );

  const courtBreakdown = await sequelize.query(
    `
    SELECT
      COALESCE(court, 'Unassigned') AS court,
      COUNT(*) AS caseCount
    FROM cases
    GROUP BY COALESCE(court, 'Unassigned')
    ORDER BY caseCount DESC
    `,
    { type: QueryTypes.SELECT }
  );

  return {
    month: reportMonth,
    year: reportYear,
    period: `${reportYear}-${String(reportMonth).padStart(2, '0')}`,
    cases: {
      totalCases: toNumber(caseStats?.totalCases),
      activeCases: toNumber(caseStats?.activeCases),
      closedCases: toNumber(caseStats?.closedCases),
      pendingCases: toNumber(caseStats?.pendingCases),
      openedThisMonth: toNumber(caseStats?.openedThisMonth),
      byCourt: courtBreakdown.map((r) => ({
        court: r.court,
        caseCount: toNumber(r.caseCount),
      })),
    },
    payments: {
      paymentCount: toNumber(paymentStats?.paymentCount),
      totalReceived: toNumber(paymentStats?.totalReceived),
      totalOutstanding: toNumber(paymentStats?.totalOutstanding),
      advocateShares: toNumber(paymentStats?.advocateShares),
    },
    daybook: {
      entryCount: toNumber(daybookStats?.entryCount),
      cashIn: toNumber(daybookStats?.cashIn),
      cashOut: toNumber(daybookStats?.cashOut),
      net: toNumber(daybookStats?.cashIn) - toNumber(daybookStats?.cashOut),
    },
    diary: {
      hearingCount: toNumber(diaryStats?.hearingCount),
    },
  };
};

const getStateWiseReport = async () => {
  const rows = await sequelize.query(
    `
    SELECT
      'Andhra Pradesh' AS state,
      COALESCE(base.district, 'Unassigned') AS district,
      COUNT(*) AS matterCount,
      COUNT(DISTINCT base.client_id) AS clientCount,
      COALESCE(SUM(base.caseValue), 0) AS caseValueTotal,
      COALESCE(SUM(pay.amountReceived), 0) AS amountReceived,
      COALESCE(SUM(pay.amountOutstanding), 0) AS amountOutstanding
    FROM (
      SELECT
        c.id AS case_id,
        c.client_id,
        COALESCE(MAX(l.district), 'Unassigned') AS district,
        COALESCE(
          CAST(NULLIF(TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(c.title, ' :: ', 3), ' :: ', -1)), '') AS DECIMAL(14, 2)),
          0
        ) AS caseValue
      FROM cases c
      LEFT JOIN lands l ON l.case_id = c.id
      GROUP BY c.id, c.client_id, c.title
    ) base
    LEFT JOIN (
      SELECT
        case_id,
        SUM(CASE WHEN party_type = 'Client' THEN amount_received ELSE 0 END) AS amountReceived,
        SUM(CASE WHEN party_type = 'Client' THEN amount_outstanding ELSE 0 END) AS amountOutstanding
      FROM payments
      GROUP BY case_id
    ) pay ON pay.case_id = base.case_id
    GROUP BY COALESCE(base.district, 'Unassigned')
    ORDER BY matterCount DESC, district ASC
    `,
    { type: QueryTypes.SELECT }
  );

  const byState = await sequelize.query(
    `
    SELECT
      'Andhra Pradesh' AS state,
      COUNT(*) AS matterCount,
      COALESCE(SUM(pay.amountReceived), 0) AS amountReceived,
      COALESCE(SUM(pay.amountOutstanding), 0) AS amountOutstanding
    FROM cases c
    LEFT JOIN (
      SELECT
        case_id,
        SUM(CASE WHEN party_type = 'Client' THEN amount_received ELSE 0 END) AS amountReceived,
        SUM(CASE WHEN party_type = 'Client' THEN amount_outstanding ELSE 0 END) AS amountOutstanding
      FROM payments
      GROUP BY case_id
    ) pay ON pay.case_id = c.id
    `,
    { type: QueryTypes.SELECT }
  );

  return {
    rows: rows.map((r) => ({
      ...r,
      matterCount: toNumber(r.matterCount),
      clientCount: toNumber(r.clientCount),
      amountReceived: toNumber(r.amountReceived),
      amountOutstanding: toNumber(r.amountOutstanding),
      caseValueTotal: toNumber(r.caseValueTotal),
    })),
    summary: {
      byState: byState.map((r) => ({
        state: r.state,
        matterCount: toNumber(r.matterCount),
        amountReceived: toNumber(r.amountReceived),
        amountOutstanding: toNumber(r.amountOutstanding),
      })),
    },
  };
};

const generateReport = async (reportType, options = {}) => {
  const normalized = String(reportType || '')
    .trim()
    .toLowerCase()
    .replace(/_/g, '-');

  if (!REPORT_TYPES.includes(normalized)) {
    throw new AppError(
      `Unknown report type. Allowed: ${REPORT_TYPES.join(', ')}`,
      400
    );
  }

  let data;
  switch (normalized) {
    case 'case':
      data = await getCaseReport();
      break;
    case 'advocate':
      data = await getAdvocateReport();
      break;
    case 'client':
      data = await getClientReport();
      break;
    case 'payment':
      data = await getPaymentReport();
      break;
    case 'membership':
      data = await getMembershipReport();
      break;
    case 'daily':
      data = await getDailyReport(options);
      break;
    case 'monthly':
      data = await getMonthlyReport(options);
      break;
    case 'state-wise':
      data = await getStateWiseReport();
      break;
    default:
      throw new AppError('Unknown report type', 400);
  }

  return {
    reportType: normalized,
    ...REPORT_META[normalized],
    generatedAt: new Date().toISOString(),
    data,
  };
};

module.exports = {
  REPORT_TYPES,
  REPORT_META,
  generateReport,
};
