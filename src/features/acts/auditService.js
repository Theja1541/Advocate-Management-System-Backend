const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.resolve(__dirname, '../../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create a dedicated audit logger that formats logs as JSON
const auditLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
    }),
  ],
});

/**
 * Log a bare act audit event
 * @param {string} action - Action performed
 * @param {object|string} actor - Express request object OR a string like 'SYSTEM'
 * @param {object} details - Any additional metadata details
 */
const logEvent = (action, actor = 'SYSTEM', details = {}) => {
  let userEmail = 'SYSTEM';
  let userRole = 'SYSTEM';
  let userId = null;
  let ipAddress = 'unknown';

  if (typeof actor === 'object' && actor !== null) {
    // If it's a req object, extract properties
    userEmail = actor.user?.email || 'SYSTEM';
    userRole = actor.user?.role || 'SYSTEM';
    userId = actor.user?.id || null;
    ipAddress = actor.ip || actor.headers?.['x-forwarded-for'] || actor.socket?.remoteAddress || 'unknown';
  } else if (typeof actor === 'string') {
    // If it's just 'SYSTEM' or another identifier
    userEmail = actor;
    userRole = actor;
  }

  auditLogger.info({
    action,
    userId,
    userEmail,
    userRole,
    ipAddress,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

module.exports = {
  logEvent,
  actions: {
    CREATED: 'CREATED',
    UPLOADED: 'UPLOADED',
    UPDATED: 'UPDATED',
    REPLACED: 'REPLACED',
    VIEWED: 'VIEWED',
    DOWNLOADED: 'DOWNLOADED',
    DELETED: 'DELETED',
    RESTORED: 'RESTORED',
    // Alert specific actions
    ALERT_GENERATED: 'ALERT_GENERATED',
    ALERT_REACTIVATED: 'ALERT_REACTIVATED',
    ALERT_READ: 'ALERT_READ',
    ALERT_UNREAD: 'ALERT_UNREAD',
    ALERT_RESOLVED: 'ALERT_RESOLVED',
    // Diary specific actions
    DIARY_CREATED: 'DIARY_CREATED',
    DIARY_UPDATED: 'DIARY_UPDATED',
    DIARY_STATUS_CHANGED: 'DIARY_STATUS_CHANGED',
    DIARY_DELETED: 'DIARY_DELETED',
  },
};
