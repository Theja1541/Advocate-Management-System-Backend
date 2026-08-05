const { Sequelize } = require('sequelize');
const { AsyncLocalStorage } = require('async_hooks');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

const tenantContext = new AsyncLocalStorage();


const sequelize = new Sequelize(
  process.env.DB_NAME || 'legal_desk_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: true,
      timestamps: true,
    },
  }
);

// Global hooks for tenant scoping
sequelize.addHook('beforeCount', function(options) {
  const model = this;
  if (options.bypassTenant) return;
  const store = tenantContext.getStore();
  if (store && store.tenantId && model.rawAttributes.tenantId) {
    options.where = options.where || {};
    options.where.tenantId = store.tenantId;
  }
});

sequelize.addHook('beforeFind', function(options) {
  const model = this;
  if (options.bypassTenant) return;
  const store = tenantContext.getStore();
  if (store && store.tenantId && model.rawAttributes.tenantId) {
    options.where = options.where || {};
    options.where.tenantId = store.tenantId;
  }
});


sequelize.addHook('beforeValidate', (instance, options) => {
  if (options.bypassTenant) return;
  const store = tenantContext.getStore();
  const rawAttrs = instance.rawAttributes || instance.constructor.rawAttributes;
  if (store && store.tenantId && rawAttrs && rawAttrs.tenantId) {
    instance.tenantId = store.tenantId;
  }
});

sequelize.addHook('beforeCreate', (instance, options) => {
  if (options.bypassTenant) return;
  const store = tenantContext.getStore();
  const rawAttrs = instance.rawAttributes || instance.constructor.rawAttributes;
  if (store && store.tenantId && rawAttrs && rawAttrs.tenantId) {
    instance.tenantId = store.tenantId;
  }
});


const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL database connection established successfully.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};
module.exports = { sequelize, tenantContext, connectDB };

