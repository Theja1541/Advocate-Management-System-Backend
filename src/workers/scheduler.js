const cron = require('node-cron');
const logger = require('../config/logger');
const { runAlertScanner } = require('./alertScanner');

let scheduledTask = null;

/**
 * Schedules the alert scanner to run daily at midnight (server local time).
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
      await runAlertScanner();
    } catch (error) {
      logger.error('Alert scanner cron job failed:', error);
    }
  });

  logger.info('Alert scanner scheduled daily at midnight (0 0 * * *).');
  return scheduledTask;
};

const stopAlertScheduler = () => {
  if (!scheduledTask) return;
  scheduledTask.stop();
  scheduledTask = null;
  logger.info('Alert scanner scheduler stopped.');
};

module.exports = {
  startAlertScheduler,
  stopAlertScheduler,
};
