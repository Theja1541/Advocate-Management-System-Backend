const { Op } = require('sequelize');
const { Case, Payment, Membership, Advocate, Client, Alert } =
  require('../features/associations');
const logger = require('../config/logger');

const toDateOnly = (date = new Date()) => date.toISOString().slice(0, 10);

const addDays = (date, days) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const formatDueInfo = (dateValue) => {
  if (!dateValue) return '—';
  const date = new Date(`${String(dateValue).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const alertExists = async ({ type, description }) => {
  const existing = await Alert.findOne({
    where: {
      type,
      description,
      isResolved: false,
    },
    attributes: ['id'],
  });
  return Boolean(existing);
};

const createAlertIfNew = async (payload) => {
  if (await alertExists(payload)) return null;
  return Alert.create({
    type: payload.type.slice(0, 50),
    description: payload.description,
    severity: payload.severity,
    dueInfo: payload.dueInfo || null,
    isResolved: false,
  });
};

const scanUpcomingHearings = async (today, tomorrow) => {
  const cases = await Case.findAll({
    where: {
      nextHearing: {
        [Op.gte]: today,
        [Op.lte]: tomorrow,
      },
      status: {
        [Op.ne]: 'Closed',
      },
    },
    include: [
      { model: Advocate, as: 'assignedAdvocate', attributes: ['name'] },
      { model: Client, as: 'client', attributes: ['name'] },
    ],
    attributes: ['id', 'caseNo', 'court', 'nextHearing', 'title', 'status'],
  });

  let created = 0;
  for (const matter of cases) {
    const advocateName = matter.assignedAdvocate?.name || 'Unassigned';
    const clientName = matter.client?.name || '—';
    const description = `Hearing within 24h at ${matter.court || 'court'} — ${clientName} / ${advocateName}`;
    const alert = await createAlertIfNew({
      type: matter.caseNo,
      description,
      severity: 'tape',
      dueInfo: formatDueInfo(matter.nextHearing),
    });
    if (alert) created += 1;
  }
  return { scanned: cases.length, created };
};

const scanOverduePayments = async (today) => {
  const payments = await Payment.findAll({
    where: {
      amountOutstanding: {
        [Op.gt]: 0,
      },
      transactionDate: {
        [Op.lt]: today,
      },
      status: {
        [Op.in]: ['pending', 'part'],
      },
    },
    include: [
      {
        model: Case,
        as: 'case',
        attributes: ['caseNo'],
      },
    ],
    attributes: [
      'id',
      'receiptNo',
      'partyType',
      'amountOutstanding',
      'transactionDate',
      'status',
    ],
  });

  let created = 0;
  for (const payment of payments) {
    const caseNo = payment.case?.caseNo || 'Matter';
    const description = `Outstanding ${payment.partyType.toLowerCase()} balance ₹${Number(payment.amountOutstanding).toLocaleString('en-IN')} (${payment.receiptNo})`;
    const alert = await createAlertIfNew({
      type: 'Payments Due',
      description: `${caseNo} — ${description}`,
      severity: 'brass',
      dueInfo: `Overdue since ${formatDueInfo(payment.transactionDate)}`,
    });
    if (alert) created += 1;
  }
  return { scanned: payments.length, created };
};

const scanExpiringMemberships = async (today, horizonDate) => {
  const memberships = await Membership.findAll({
    where: {
      [Op.or]: [
        { status: 'expiring' },
        {
          expiryDate: {
            [Op.gte]: today,
            [Op.lte]: horizonDate,
          },
          status: {
            [Op.ne]: 'expired',
          },
        },
      ],
    },
    include: [
      {
        model: Advocate,
        as: 'advocate',
        attributes: ['name'],
      },
    ],
    attributes: ['id', 'planName', 'expiryDate', 'status', 'feeAmount'],
  });

  let created = 0;
  for (const membership of memberships) {
    const advocateName = membership.advocate?.name || 'Advocate';
    const description = `${membership.planName} membership expiring for ${advocateName}`;
    const alert = await createAlertIfNew({
      type: 'Membership',
      description,
      severity: 'ink',
      dueInfo: formatDueInfo(membership.expiryDate),
    });
    if (alert) created += 1;
  }
  return { scanned: memberships.length, created };
};

/**
 * Scans hearings, overdue payments, and expiring memberships,
 * then inserts new rows into the alerts table.
 */
const runAlertScanner = async () => {
  const now = new Date();
  const today = toDateOnly(now);
  const tomorrow = toDateOnly(addDays(now, 1));
  const membershipHorizon = toDateOnly(addDays(now, 14));

  logger.info(`Alert scanner started for ${today}`);

  const hearings = await scanUpcomingHearings(today, tomorrow);
  const payments = await scanOverduePayments(today);
  const memberships = await scanExpiringMemberships(today, membershipHorizon);

  const summary = {
    date: today,
    hearings,
    payments,
    memberships,
    totalCreated:
      hearings.created + payments.created + memberships.created,
  };

  logger.info(`Alert scanner finished: ${JSON.stringify(summary)}`);
  return summary;
};

module.exports = {
  runAlertScanner,
  scanUpcomingHearings,
  scanOverduePayments,
  scanExpiringMemberships,
};
