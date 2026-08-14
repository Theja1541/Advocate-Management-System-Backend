const { sequelize } = require('../src/config/database');
const { Case, Task, User, Role } = require('../src/features/associations');
const { Op } = require('sequelize');

const normalizeRole = (role) => {
  if (!role) return '';
  const r = String(role).trim().toLowerCase();
  if (r.includes('super admin') || r.includes('super_admin')) return 'Super Admin';
  if (r.includes('tenant admin') || r.includes('tenant_admin') || r === 'admin') return 'Tenant Admin';
  if (r.includes('group admin') || r.includes('group_admin')) return 'Group Admin';
  if (r.includes('advocate')) return 'Advocate';
  if (r.includes('sub admin') || r.includes('sub_admin')) return 'Sub Admin';
  if (r.includes('staff')) return 'Staff/Bearer';
  return role;
};

async function runBackfill() {
  await sequelize.authenticate();
  console.log('Connected to DB, running backfill...\n');

  let casesTotal = 0, casesSafe = 0, casesAmbiguous = 0, casesOrphaned = 0;
  let tasksTotal = 0, tasksSafe = 0, tasksAmbiguous = 0, tasksOrphaned = 0;

  const allCases = await Case.findAll();
  casesTotal = allCases.length;

  for (const c of allCases) {
    if (!c.createdBy) {
      casesOrphaned++;
      continue;
    }

    const user = await User.findByPk(c.createdBy, { include: ['role'] });
    if (!user || !user.role) {
      casesOrphaned++;
      continue;
    }

    const roleName = normalizeRole(user.role.name);
    
    if (roleName === 'Tenant Admin' && user.tenantId === c.tenantId) {
      c.contextType = 'TENANT_ADMIN';
      c.contextId = user.id;
      await c.save();
      casesSafe++;
    } else if (roleName === 'Group Admin' && user.tenantId === c.tenantId) {
      c.contextType = 'GROUP_ADMIN';
      c.contextId = user.id;
      await c.save();
      casesSafe++;
    } else {
      casesAmbiguous++;
    }
  }

  const allTasks = await Task.findAll();
  tasksTotal = allTasks.length;

  for (const t of allTasks) {
    if (!t.createdBy) {
      tasksOrphaned++;
      continue;
    }

    const user = await User.findByPk(t.createdBy, { include: ['role'] });
    if (!user || !user.role) {
      tasksOrphaned++;
      continue;
    }

    const roleName = normalizeRole(user.role.name);
    
    if (roleName === 'Tenant Admin' && user.tenantId === t.tenantId) {
      t.contextType = 'TENANT_ADMIN';
      t.contextId = user.id;
      await t.save();
      tasksSafe++;
    } else if (roleName === 'Group Admin' && user.tenantId === t.tenantId) {
      t.contextType = 'GROUP_ADMIN';
      t.contextId = user.id;
      await t.save();
      tasksSafe++;
    } else {
      tasksAmbiguous++;
    }
  }

  console.log('--- BACKFILL RESULTS ---');
  console.log(`Total Cases: ${casesTotal}`);
  console.log(`Cases safely backfilled: ${casesSafe}`);
  console.log(`Cases ambiguous: ${casesAmbiguous}`);
  console.log(`Cases orphaned: ${casesOrphaned}`);
  console.log('------------------------');
  console.log(`Total Tasks: ${tasksTotal}`);
  console.log(`Tasks safely backfilled: ${tasksSafe}`);
  console.log(`Tasks ambiguous: ${tasksAmbiguous}`);
  console.log(`Tasks orphaned: ${tasksOrphaned}`);

  process.exit(0);
}

runBackfill().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
