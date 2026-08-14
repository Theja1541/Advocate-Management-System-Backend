const cron = require('node-cron');
const { Op } = require('sequelize');
const Alert = require('./Alert');
const logger = require('../../config/logger');
const auditService = require('../acts/auditService');

const { Case, Payment, Task, Document, Advocate, Client } = require('../associations');

/**
 * Upsert an alert.
 */
const { tenantContext } = require('../../config/database');

const upsertAlert = async ({
  referenceType,
  referenceId,
  alertType,
  priority = 'medium',
  message,
  assignedTo = null,
  metadata = null,
  tenantId = null,
}) => {
  try {
    const store = tenantContext.getStore();
    const resolvedTenantId = tenantId || store?.tenantId || 1;

    let alert = await Alert.findOne({
      where: { referenceType, referenceId, alertType },
    });

    if (alert) {
      alert.priority = priority;
      alert.message = message;
      alert.status = 'active';
      if (assignedTo !== null) alert.assignedTo = assignedTo;
      if (metadata !== null) alert.metadata = metadata;
      if (resolvedTenantId) alert.tenantId = resolvedTenantId;
      await alert.save();
    } else {
      alert = await Alert.create({
        referenceType,
        referenceId,
        alertType,
        priority,
        message,
        status: 'active',
        assignedTo,
        metadata,
        tenantId: resolvedTenantId,
      });
      auditService.logEvent(auditService.actions.ALERT_GENERATED, 'SYSTEM', { alertId: alert.id, alertType });
    }
    return alert;
  } catch (error) {
    logger.error('Error upserting alert:', error);
  }
};


/**
 * Mark an alert as resolved.
 */
const resolveAlert = async (referenceType, referenceId, alertType) => {
  try {
    const alert = await Alert.findOne({
      where: { referenceType, referenceId, alertType },
    });
    if (alert && alert.status !== 'resolved') {
      alert.status = 'resolved';
      await alert.save();
    }
  } catch (error) {
    logger.error('Error resolving alert:', error);
  }
};

/**
 * Evaluate all time-based rules.
 */
const evaluateRules = async () => {
  logger.info('Starting Alert Engine evaluation...');
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const formatSQLDate = (date) => {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  };

  const todayStr = formatSQLDate(todayStart);
  
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const tomorrowStr = formatSQLDate(tomorrowStart);
  
  const in3DaysStart = new Date(todayStart);
  in3DaysStart.setDate(in3DaysStart.getDate() + 3);
  const in3DaysStr = formatSQLDate(in3DaysStart);

  // 1. Hearings (Using Case nextHearing)
  try {
    const cases = await Case.findAll({
      where: {
        nextHearing: { [Op.not]: null },
        status: { [Op.ne]: 'Closed' },
      },
      include: [
        { model: Advocate, as: 'assignedAdvocate', attributes: ['name'] },
        { model: Client, as: 'client', attributes: ['name'] },
      ]
    });

    for (const c of cases) {
      const hearingDate = c.nextHearing;
      const clientName = c.client?.name || '—';
      const advocateName = c.assignedAdvocate?.name || 'Unassigned';
      
      if (hearingDate < todayStr) {
        await upsertAlert({
          referenceType: 'Case',
          referenceId: c.id,
          alertType: 'HEARING_MISSED',
          priority: 'high',
          message: `Missed hearing for case ${c.caseNo} (${clientName}) on ${hearingDate}.`,
        });
      } else if (hearingDate === todayStr) {
        await upsertAlert({
          referenceType: 'Case',
          referenceId: c.id,
          alertType: 'HEARING_TODAY',
          priority: 'high',
          message: `Hearing today for case ${c.caseNo} (${clientName}). Advocate: ${advocateName}.`,
        });
        // Resolve future alerts if they exist
        await resolveAlert('Case', c.id, 'HEARING_TOMORROW');
        await resolveAlert('Case', c.id, 'HEARING_3_DAYS');
      } else if (hearingDate === tomorrowStr) {
        await upsertAlert({
          referenceType: 'Case',
          referenceId: c.id,
          alertType: 'HEARING_TOMORROW',
          priority: 'medium',
          message: `Hearing tomorrow for case ${c.caseNo} (${clientName}).`,
        });
        await resolveAlert('Case', c.id, 'HEARING_3_DAYS');
      } else if (hearingDate <= in3DaysStr && hearingDate > tomorrowStr) {
        await upsertAlert({
          referenceType: 'Case',
          referenceId: c.id,
          alertType: 'HEARING_3_DAYS',
          priority: 'low',
          message: `Hearing coming up on ${hearingDate} for case ${c.caseNo}.`,
        });
      }
    }
  } catch (error) {
    logger.error('Alert Engine: Hearings check failed', error);
  }

  // 2. Cases - Case Approval Pending
  try {
    const pendingCases = await Case.findAll({ where: { status: 'Pending Approval' } });
    for (const c of pendingCases) {
      await upsertAlert({
        referenceType: 'Case',
        referenceId: c.id,
        alertType: 'CASE_APPROVAL_PENDING',
        priority: 'medium',
        message: `Case ${c.caseNo} is pending approval.`,
      });
    }
  } catch (error) {
    logger.error('Alert Engine: Cases check failed', error);
  }

  // 3. Payments
  try {
    const payments = await Payment.findAll({
      where: { status: { [Op.notIn]: ['Completed', 'completed', 'paid'] } },
      include: [{ model: Case, as: 'case', attributes: ['caseNo'] }]
    });
    
    for (const p of payments) {
      if (p.dueDate) {
        const dueDate = formatSQLDate(p.dueDate);
        const caseNo = p.case?.caseNo || 'Unknown Case';
        
        if (dueDate < todayStr) {
          await upsertAlert({
            referenceType: 'Payment',
            referenceId: p.id,
            alertType: 'PAYMENT_OVERDUE',
            priority: 'high',
            message: `Payment of ${p.amountOutstanding || p.amount} is overdue for case ${caseNo}.`,
          });
        } else if (dueDate === todayStr) {
          await upsertAlert({
            referenceType: 'Payment',
            referenceId: p.id,
            alertType: 'PAYMENT_DUE',
            priority: 'medium',
            message: `Payment of ${p.amountOutstanding || p.amount} is due today for case ${caseNo}.`,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Alert Engine: Payments check failed', error);
  }

  // 4. Tasks
  try {
    const tasks = await Task.findAll({
      where: { status: { [Op.notIn]: ['Completed', 'Cancelled'] } }
    });
    
    for (const t of tasks) {
      if (t.dueDate) {
        const dueDate = formatSQLDate(t.dueDate);
        if (dueDate < todayStr) {
          await upsertAlert({
            referenceType: 'Task',
            referenceId: t.id,
            alertType: 'TASK_OVERDUE',
            priority: 'high',
            message: `Task "${t.title}" is overdue.`,
            assignedTo: t.assigneeId,
          });
        } else if (dueDate === todayStr) {
          await upsertAlert({
            referenceType: 'Task',
            referenceId: t.id,
            alertType: 'TASK_DUE_TODAY',
            priority: 'medium',
            message: `Task "${t.title}" is due today.`,
            assignedTo: t.assigneeId,
          });
        }
      }
    }
  } catch (error) {
    logger.error('Alert Engine: Tasks check failed', error);
  }

  // 5. Documents (Example: Document missing or pending review)
  // Assuming Document has a status field and we can check it
  /*
  if (Document) {
    try {
      const docs = await Document.findAll({
        where: { status: { [Op.in]: ['Missing', 'Pending Review', 'pending'] } }
      });
      for (const d of docs) {
        if (d.status === 'Missing' || d.status === 'missing') {
          await upsertAlert({
            referenceType: 'Document',
            referenceId: d.id,
            alertType: 'DOCUMENT_MISSING',
            priority: 'medium',
            message: `Document "${d.title || 'Required Document'}" is missing.`,
          });
        } else {
          await upsertAlert({
            referenceType: 'Document',
            referenceId: d.id,
            alertType: 'DOCUMENT_PENDING_APPROVAL',
            priority: 'low',
            message: `Document "${d.title}" is pending review/approval.`,
          });
        }
      }
    } catch (error) {
      logger.error('Alert Engine: Documents check failed', error);
    }
  }
  */

  logger.info('Finished Alert Engine evaluation.');
};

module.exports = {
  upsertAlert,
  resolveAlert,
  evaluateRules,
};
