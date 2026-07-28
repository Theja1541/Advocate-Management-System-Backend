const { sequelize } = require('../config/database');
const logger = require('../config/logger');

/**
 * Ensures advocates.user_id exists without a full DB reset.
 * Safe to run on every startup.
 */
const ensureAdvocateUserIdColumn = async () => {
  try {
    const [rows] = await sequelize.query(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'advocates'
        AND COLUMN_NAME = 'user_id'
    `);
    const count = Number(rows?.[0]?.cnt || 0);
    if (count > 0) return;

    await sequelize.query(`
      ALTER TABLE advocates
        ADD COLUMN user_id INT UNSIGNED NULL,
        ADD UNIQUE INDEX advocates_user_id_unique (user_id),
        ADD CONSTRAINT fk_advocates_user_id
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON UPDATE CASCADE
          ON DELETE SET NULL
    `);
    logger.info('Added advocates.user_id column for advocate login linking.');
  } catch (error) {
    // Table may not exist yet (fresh install before sync/seed)
    logger.warn('ensureAdvocateUserIdColumn skipped:', error.message);
  }
};

const linkDemoAdvocateIfNeeded = async () => {
  try {
    const [users] = await sequelize.query(`
      SELECT id FROM users WHERE email = 'advocate@legaldesk.in' LIMIT 1
    `);
    const userId = users?.[0]?.id;
    if (!userId) return;

    const [advocates] = await sequelize.query(`
      SELECT id, user_id AS userId
      FROM advocates
      WHERE email = 'advocate@legaldesk.in'
         OR name LIKE '%Sailaja%'
      ORDER BY id ASC
      LIMIT 1
    `);
    const advocate = advocates?.[0];
    if (!advocate) return;
    if (advocate.userId) return;

    await sequelize.query(
      `UPDATE advocates SET user_id = :userId WHERE id = :id AND user_id IS NULL`,
      { replacements: { userId, id: advocate.id } }
    );
    logger.info(`Linked advocate #${advocate.id} to login user #${userId}.`);
  } catch (error) {
    logger.warn('linkDemoAdvocateIfNeeded skipped:', error.message);
  }
};

module.exports = { ensureAdvocateUserIdColumn, linkDemoAdvocateIfNeeded };
