const { Op } = require('sequelize');
const Alert = require('./Alert');
const AppError = require('../../utils/AppError');
const alertModuleMap = require('./alertModuleMap');
const { getAuthorizedModules, checkPermission } = require('../../services/authService');
const auditService = require('../acts/auditService');

const SAFE_ATTRIBUTES = [
  'id',
  'referenceType',
  'referenceId',
  'alertType',
  'priority',
  'status',
  'isRead',
  'assignedTo',
  'message',
  'metadata',
  'created_at',
  'updated_at',
];

const toPublicAlert = (alert) => {
  return alert.get ? alert.get({ plain: true }) : { ...alert };
};

const buildWhereClause = (filters) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.alertType) where.alertType = filters.alertType;
  if (filters.referenceType) {
    if (filters.referenceType === 'Hearing') {
      where.referenceType = 'Case';
      // If alertType was also provided, it will be overridden, but typically they aren't mixed.
      where.alertType = { [Op.like]: 'HEARING_%' };
    } else {
      where.referenceType = filters.referenceType;
    }
  }
  if (filters.isRead !== undefined) where.isRead = filters.isRead === 'true' || filters.isRead === true;
  if (filters.message) {
    where.message = {
      [Op.like]: `%${filters.message}%`,
    };
  }
  if (filters.date) {
    // Exact match for DATEONLY or we can do a date range for created_at
    const startDate = new Date(filters.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(filters.date);
    endDate.setHours(23, 59, 59, 999);
    where.created_at = {
      [Op.between]: [startDate, endDate],
    };
  }
  return where;
};

const applyRoleBasedAccess = async (where, req) => {
  const user = req?.user;
  if (!user) {
    where.referenceType = 'NONE_ALLOWED';
    return;
  }
  
  // Get all module keys this user has 'V' access to
  const allowedModuleKeys = await getAuthorizedModules(user.role, 'V');
  
  // Find which referenceTypes map to these allowed module keys
  const allowedReferenceTypes = [];
  for (const [refType, modKey] of Object.entries(alertModuleMap)) {
    if (allowedModuleKeys.includes(modKey)) {
      allowedReferenceTypes.push(refType);
    }
  }

  if (allowedReferenceTypes.length > 0) {
    if (where.referenceType) {
      // Intersect requested referenceType with allowed
      const reqRefType = Array.isArray(where.referenceType) 
        ? where.referenceType 
        : [where.referenceType];
        
      const intersection = reqRefType.filter(rt => allowedReferenceTypes.includes(rt));
      
      if (intersection.length > 0) {
        where.referenceType = { [Op.in]: intersection };
      } else {
        where.referenceType = 'NONE_ALLOWED';
      }
    } else {
      where.referenceType = { [Op.in]: allowedReferenceTypes };
    }
  } else {
    where.referenceType = 'NONE_ALLOWED';
  }
};

const enforceEditPermission = async (referenceType, req) => {
  if (!req?.user) throw new AppError('Unauthorized', 401);
  const modKey = alertModuleMap[referenceType];
  if (!modKey) throw new AppError('Invalid reference type', 400);
  
  const hasAccess = await checkPermission(req.user.role, modKey, 'E');
  if (!hasAccess) {
    throw new AppError('Access Denied: You do not have permission to modify alerts for this module.', 403);
  }
};

const getAllAlerts = async (filters = {}, req) => {
  const where = buildWhereClause(filters);
  await applyRoleBasedAccess(where, req);
  
  const alerts = await Alert.findAll({
    where,
    attributes: SAFE_ATTRIBUTES,
    order: [
      ['status', 'ASC'], // 'active' comes before 'resolved'
      ['id', 'DESC'],
    ],
  });
  return alerts.map(toPublicAlert);
};

const getAlertById = async (id, req) => {
  const alert = await Alert.findByPk(id, {
    attributes: SAFE_ATTRIBUTES,
  });
  if (!alert) throw new AppError('Alert not found', 404);
  
  // Enforce View permission based on fetched alert
  const modKey = alertModuleMap[alert.referenceType];
  const hasAccess = await checkPermission(req?.user?.role, modKey, 'V');
  if (!hasAccess) {
    throw new AppError('Access Denied: You cannot view alerts for this module.', 403);
  }
  
  return toPublicAlert(alert);
};

const getAlertCount = async (filters = {}, req) => {
  const where = buildWhereClause(filters);
  await applyRoleBasedAccess(where, req);
  const count = await Alert.count({ where });
  return count;
};

// Manually resolve from UI if allowed
const resolveAlertStatus = async (id, status, req) => {
  const alert = await Alert.findByPk(id);
  if (!alert) throw new AppError('Alert not found', 404);
  
  await enforceEditPermission(alert.referenceType, req);
  
  alert.status = status; // 'active' or 'resolved'
  await alert.save();
  
  auditService.logEvent(
    status === 'resolved' ? auditService.actions.ALERT_RESOLVED : auditService.actions.ALERT_REACTIVATED,
    req,
    { alertId: alert.id, alertType: alert.alertType, status }
  );
  
  return getAlertById(alert.id, req);
};

const markAlertAsRead = async (id, req) => {
  const alert = await Alert.findByPk(id);
  if (!alert) throw new AppError('Alert not found', 404);
  
  await enforceEditPermission(alert.referenceType, req);
  
  alert.isRead = true;
  await alert.save();
  
  auditService.logEvent(auditService.actions.ALERT_READ, req, { alertId: alert.id, alertType: alert.alertType });
  
  return getAlertById(alert.id, req);
};

const markAlertAsUnread = async (id, req) => {
  const alert = await Alert.findByPk(id);
  if (!alert) throw new AppError('Alert not found', 404);
  
  await enforceEditPermission(alert.referenceType, req);
  
  alert.isRead = false;
  await alert.save();
  
  auditService.logEvent(auditService.actions.ALERT_UNREAD, req, { alertId: alert.id, alertType: alert.alertType });
  
  return getAlertById(alert.id, req);
};

module.exports = {
  getAllAlerts,
  getAlertById,
  getAlertCount,
  resolveAlertStatus,
  markAlertAsRead,
  markAlertAsUnread,
};
