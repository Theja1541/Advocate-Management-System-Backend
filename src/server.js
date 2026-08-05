const app = require('./app');
const { connectDB } = require('./config/database');
const logger = require('./config/logger');
const { startAlertScheduler, stopAlertScheduler } = require('./workers/scheduler');

const PORT = process.env.PORT || 5000;

// Initialize Database and Start Server
const startServer = async () => {
  try {
    // 1. Establish Database Connection
    await connectDB();

    // Ensure advocate ↔ user link column exists (safe no-op if already present)
    const { ensureAdvocateUserIdColumn, linkDemoAdvocateIfNeeded, ensureTasksTable, ensureStateCourtFeeTables, ensureGlobalSettingsTable } = require('./utils/ensureSchema');
    await ensureAdvocateUserIdColumn();
    await linkDemoAdvocateIfNeeded();
    await ensureTasksTable();
    await ensureStateCourtFeeTables();
    await ensureGlobalSettingsTable();

    // Load models/associations before background jobs touch them
    require('./features/associations');

    // 2. Start Express Listener
    const server = app.listen(PORT, () => {
      logger.info(`Server successfully started on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    });

    // 3. Daily midnight alert scanner (hearings, overdue payments, memberships)
    startAlertScheduler();

    // 4. Graceful Shutdown handlers
    const gracefulShutdown = () => {
      logger.info('Shutting down server gracefully...');
      stopAlertScheduler();
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled exceptions & promise rejections globally
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

startServer();
