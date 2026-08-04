const { Op } = require('sequelize');
const {
  Case,
  CaseDiary,
  Payment,
  Land,
  Alert,
  Client,
  Advocate,
  Document,
  CaseType,
  CaseStage,
} = require('../associations');


const formatDisplayDate = (date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime12h = (timeStr) => {
  if (!timeStr) return { t: '10:30', ap: 'AM' };
  const match = String(timeStr).match(/^(\d{2}):(\d{2})/);
  if (!match) return { t: timeStr, ap: 'AM' };
  let hours = Number(match[1]);
  const minutes = match[2];
  const ap = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return { t: `${hours}:${minutes}`, ap };
};

const getRelativeTime = (date) => {
  const diffMs = new Date() - new Date(date);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDays}d ago`;
};

const getDashboard = async ({ advocateId } = {}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const caseWhere = advocateId ? { advocateId } : {};

  // 1. Fetch KPI Counts
  const totalCases = await Case.count({ where: caseWhere });
  const activeCases = await Case.count({ where: { ...caseWhere, status: 'Active' } });
  const closedCases = await Case.count({ where: { ...caseWhere, status: 'Closed' } });
  const pendingTasks = await Case.count({ where: { ...caseWhere, status: 'Pending Approval' } });

  const todayHearings = await CaseDiary.count({
    where: {
      hearingDate: todayStr,
      ...(advocateId ? { advocateId } : {}),
    },
  });

  const duePaymentAmountResult = await Payment.sum('amount_outstanding', {
    where: { amountOutstanding: { [Op.gt]: 0 } },
    include: [{
      model: Case,
      as: 'case',
      where: caseWhere,
      required: true,
      attributes: [],
    }],
  });
  const duePaymentAmount = Number(duePaymentAmountResult || 0);

  const pendingPaymentsCount = await Payment.count({
    where: { amountOutstanding: { [Op.gt]: 0 } },
    include: [{
      model: Case,
      as: 'case',
      where: caseWhere,
      required: true,
      attributes: [],
    }],
  });

  const disputedTitle = await Land.count({
    where: { titleStatus: 'disputed' },
    include: advocateId ? [{
      model: Case,
      as: 'case',
      where: { advocateId },
      required: true,
      attributes: [],
    }] : [],
  });

  // 2. Fetch Today's Hearings (Cause List)
  const diaries = await CaseDiary.findAll({
    where: {
      hearingDate: todayStr,
      ...(advocateId ? { advocateId } : {}),
    },
    include: [
      {
        model: Case,
        as: 'case',
        attributes: ['id', 'caseNo', 'title', 'court', 'caseStageId'],
        include: [
          { model: Client, as: 'client', attributes: ['name'] },
          { model: CaseStage, as: 'currentStage', attributes: ['name'] },
        ],
      },
      { model: Advocate, as: 'advocate', attributes: ['name'] },
    ],
    order: [['hearingTime', 'ASC']],
  });

  const causeList = diaries.map((d) => {
    let opponent = '—';
    const vsIdx = String(d.case?.title || '').indexOf(' — vs ');
    if (vsIdx >= 0) {
      opponent = String(d.case?.title).slice(vsIdx + ' — vs '.length);
    }
    const { t, ap } = formatTime12h(d.hearingTime);
    return {
      no: d.case?.caseNo || '—',
      t,
      ap,
      clientName: d.case?.client?.name || 'Client',
      opponent,
      court: d.case?.court || 'Court',
      advocateName: d.advocate?.name || 'Advocate',
      stage: d.case?.currentStage?.name || 'Filing',
      done: new Date(`${todayStr}T${d.hearingTime}`) < new Date(),
    };
  });

  const causeMeta = {
    matterCount: causeList.length,
    courtCount: new Set(diaries.map((d) => d.case?.court).filter(Boolean)).size,
    pendingCount: causeList.filter((c) => !c.done).length,
  };

  // 3. Fetch Recent Activity (Latest 5 records across models)
  const [recentCases, recentDiaries, recentPayments, recentDocs] = await Promise.all([
    Case.findAll({
      where: caseWhere,
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: Client, as: 'client', attributes: ['name'] }],
    }),
    CaseDiary.findAll({
      where: advocateId ? { advocateId } : {},
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        { model: Case, as: 'case', attributes: ['caseNo'] },
        { model: Advocate, as: 'advocate', attributes: ['name'] },
      ],
    }),
    Payment.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [{ model: Case, as: 'case', where: caseWhere, required: true, attributes: ['caseNo'] }],
    }),
    Document.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      attributes: ['id', 'name', 'created_at'],
      include: [{ model: Case, as: 'case', where: caseWhere, required: true, attributes: ['caseNo'] }],
    }),
  ]);

  const activities = [];
  recentCases.forEach((c) => {
    activities.push({
      date: c.created_at || c.createdAt,
      color: 'var(--baize)',
      text: `New case <b>${c.caseNo}</b> registered for client <b>${c.client?.name || 'Client'}</b>`,
    });
  });
  recentDiaries.forEach((d) => {
    activities.push({
      date: d.created_at || d.createdAt,
      color: 'var(--brass)',
      text: `Hearing recorded for <b>${d.case?.caseNo || 'Matter'}</b> by <b>${d.advocate?.name || 'Advocate'}</b>`,
    });
  });
  recentPayments.forEach((p) => {
    activities.push({
      date: p.created_at || p.createdAt,
      color: 'var(--tape)',
      text: `Payment of <b>₹${Number(p.amountReceived).toLocaleString('en-IN')}</b> received for <b>${p.case?.caseNo || 'Matter'}</b>`,
    });
  });
  recentDocs.forEach((doc) => {
    activities.push({
      date: doc.created_at || doc.createdAt,
      color: 'var(--ink-3)',
      text: `Document <b>${doc.name}</b> uploaded for <b>${doc.case?.caseNo || 'Matter'}</b>`,
    });
  });

  const recentActivity = activities
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)
    .map((act) => ({
      color: act.color,
      text: act.text,
      time: getRelativeTime(act.date),
    }));

  // 4. Notifications (Latest unresolved alerts)
  const alertWhere = { status: 'active' };
  if (advocateId) {
    // Ideally we filter alerts by assignedTo or role, but keeping it simple for now
    alertWhere.assignedTo = advocateId;
  }

  const alerts = await Alert.findAll({
    where: alertWhere,
    limit: 5,
    order: [['created_at', 'DESC']],
    attributes: ['id', 'alertType', 'message', 'priority', 'created_at'],
  });

  const notifications = alerts.map((a) => ({
    id: a.id,
    type: a.alertType,
    description: a.message,
    severity: a.priority,
    dueInfo: getRelativeTime(a.created_at),
  }));

  return {
    kpis: {
      totalCases,
      activeCases,
      closedCases,
      todayHearings,
      pendingHearings: causeMeta.pendingCount,
      duePaymentAmount,
      pendingPaymentsCount,
      pendingTasks,
      disputedTitle,
    },
    causeList,
    causeMeta,
    recentActivity,
    notifications,
    displayDate: formatDisplayDate(new Date()),
  };
};

module.exports = { getDashboard };
