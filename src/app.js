const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const authRoutes = require('./features/users/authRoutes');
const roleRoutes = require('./features/users/roleRoutes');
const userRoutes = require('./features/users/userRoutes');
const advocateRoutes = require('./features/advocates/advocateRoutes');
const caseRoutes = require('./features/cases/caseRoutes');
const clientRoutes = require('./features/clients/clientRoutes');
const diaryRoutes = require('./features/diary/diaryRoutes');
const documentRoutes = require('./features/documents/documentRoutes');
const paymentRoutes = require('./features/payments/paymentRoutes');
const daybookRoutes = require('./features/daybook/daybookRoutes');
const membershipRoutes = require('./features/memberships/membershipRoutes');
const landRoutes = require('./features/lands/landRoutes');
const opinionRoutes = require('./features/opinions/opinionRoutes');
const referenceRoutes = require('./features/refs/referenceRoutes');
const alertRoutes = require('./features/alerts/alertRoutes');
const actRoutes = require('./features/acts/actRoutes');
const amendmentRoutes = require('./features/acts/amendmentRoutes');
const reportRoutes = require('./features/reports/reportRoutes');
const dashboardRoutes = require('./features/dashboard/dashboardRoutes');
const mastersRoutes = require('./features/masters/mastersRoutes');
const taskRoutes = require('./features/tasks/taskRoutes');
const searchRoutes = require('./features/search/searchRoutes');
const tenantRoutes = require('./features/tenants/tenantRoutes');
const subscriptionPlanRoutes = require('./features/tenants/subscriptionPlanRoutes');
const settingsRoutes = require('./features/settings/settingsRoutes');
const courtFeeRoutes = require('./features/court-fees/courtFee.routes');
const legalTextRoutes = require('./features/legal-texts/legalTextRoutes');
const smartTextRoutes = require('./features/legal-texts/smartTextRoutes');
const titleSearchRoutes = require('./features/title-searches/titleSearchRoutes');

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// CORS config
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
};
app.use(cors(corsOptions));

// HTTP Request Logger
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(
  morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) },
  })
);

// Compression & Body Parsers
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'cookiesecret'));

// Register dynamic audit logging middleware
const auditLogger = require('./middleware/auditLogger');
app.use(auditLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/advocates', advocateRoutes);
app.use('/api/v1/cases', caseRoutes);
app.use('/api/v1/clients', clientRoutes);
app.use('/api/v1/diary', diaryRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/daybook', daybookRoutes);
app.use('/api/v1/memberships', membershipRoutes);
app.use('/api/v1/lands', landRoutes);
app.use('/api/v1/opinions', opinionRoutes);
app.use('/api/v1/references', referenceRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/acts', actRoutes);
app.use('/api/v1/amendments', amendmentRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/masters', mastersRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/tenants', tenantRoutes);
app.use('/api/v1/plans', subscriptionPlanRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/court-fees', courtFeeRoutes);
app.use('/api/v1/legal-texts', legalTextRoutes);
app.use('/api/v1/smart-text', smartTextRoutes);
app.use('/api/v1/title-searches', titleSearchRoutes);
// Serve uploads and bare-act PDFs statically
app.use('/uploads', express.static('uploads'));
app.use(
  '/static/acts',
  express.static(path.join(__dirname, '../static/acts'), {
    setHeaders: (res, filePath) => {
      if (String(filePath).toLowerCase().endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
      }
    },
  })
);

// Global Fallback for Missing Routes
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Centralized Global Error Handler
app.use(errorHandler);

module.exports = app;
