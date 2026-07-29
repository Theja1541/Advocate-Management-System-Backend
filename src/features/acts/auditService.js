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
 * @param {string} action - Action performed (CREATED, UPLOADED, UPDATED, REPLACED, VIEWED, DOWNLOADED, DELETED, RESTORED)
 * @param {object} req - Express request object to extract user, IP, etc.
 * @param {object} details - Any additional metadata details
 */
const logEvent = (action, req, details = {}) => {
  const userEmail = req?.user?.email || 'SYSTEM';
  const userRole = req?.user?.role || 'SYSTEM';
  const userId = req?.user?.id || null;
  const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || 'unknown';

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
  },
};
