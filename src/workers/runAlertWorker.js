#!/usr/bin/env node
/**
 * One-shot / interval runner for the alert scanner.
 * Usage:
 *   node src/workers/runAlertWorker.js
 *   node src/workers/runAlertWorker.js --once
 *   node src/workers/runAlertWorker.js --interval 86400000
 */
require('dotenv').config();

const { connectDB } = require('../config/database');
const logger = require('../config/logger');
const { runAlertScanner } = require('./alertScanner');
const { startAlertScheduler } = require('./scheduler');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const once = args.includes('--once') || !args.includes('--cron');
  const intervalFlag = args.indexOf('--interval');
  const intervalMs =
    intervalFlag >= 0 ? Number(args[intervalFlag + 1]) || 24 * 60 * 60 * 1000 : null;
  const useCron = args.includes('--cron');
  return { once, intervalMs, useCron };
};

const main = async () => {
  const { once, intervalMs, useCron } = parseArgs();
  await connectDB();
  // Ensure associations/models are registered
  require('../features/associations');

  if (useCron) {
    startAlertScheduler();
    logger.info('Alert worker running with node-cron (daily midnight).');
    return;
  }

  if (intervalMs) {
    const tick = async () => {
      try {
        await runAlertScanner();
      } catch (error) {
        logger.error('Alert worker interval tick failed:', error);
      }
    };
    await tick();
    setInterval(tick, intervalMs);
    logger.info(`Alert worker running on interval every ${intervalMs}ms.`);
    return;
  }

  const summary = await runAlertScanner();
  logger.info('Alert worker one-shot complete:', summary);
  if (once) process.exit(0);
};

main().catch((error) => {
  logger.error('Alert worker failed to start:', error);
  process.exit(1);
});
