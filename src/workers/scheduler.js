const cron = require('node-cron');
const logger = require('../config/logger');
const { evaluateRules } = require('../features/alerts/alertEngine');

let scheduledTask = null;

/**
 * Schedules the alert engine to run daily at midnight (server local time).
 * Safe to call once during server boot.
 */
const startAlertScheduler = () => {
  if (scheduledTask) {
    logger.warn('Alert scheduler already running; skipping re-init.');
    return scheduledTask;
  }

  // 00:00 every day
  scheduledTask = cron.schedule('0 0 * * *', async () => {
    try {
      await evaluateRules();
    } catch (error) {
      logger.error('Alert engine cron job failed:', error);
    }
  });

  // Run once immediately on startup for convenience (usually delayed slightly to ensure DB is up)
  setTimeout(() => {
    evaluateRules().catch(err => logger.error('Initial Alert engine check failed', err));
  }, 10000);

  logger.info('Alert engine scheduled daily at midnight (0 0 * * *).');
  return scheduledTask;
};

const stopAlertScheduler = () => {
  if (!scheduledTask) return;
  scheduledTask.stop();
  scheduledTask = null;
  logger.info('Alert engine scheduler stopped.');
};

module.exports = {
  startAlertScheduler,
  stopAlertScheduler,
};
