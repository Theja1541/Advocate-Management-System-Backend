const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Seed Roles
    const roles = [
      { name: 'Super Admin', description: 'Full system access', created_at: new Date(), updated_at: new Date() },
      { name: 'Admin', description: 'Advocates, cases, payments and reports management', created_at: new Date(), updated_at: new Date() },
      { name: 'Sub Admin', description: 'Case updates, land and diary data helper', created_at: new Date(), updated_at: new Date() },
      { name: 'Advocate', description: 'Practitioner login for assigned matters', created_at: new Date(), updated_at: new Date() },
      { name: 'Staff/Bearer', description: 'Day book and field visit records', created_at: new Date(), updated_at: new Date() }
    ];
    await queryInterface.bulkInsert('roles', roles, {});

    // Retrieve inserted roles to get IDs
    const seededRoles = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleIdMap = {};
    seededRoles.forEach(r => {
      roleIdMap[r.name] = r.id;
    });

    // 2. Seed Modules
    const modules = [
      { name: 'Cases', key_code: 'cases' },
      { name: 'Case Approval', key_code: 'approve' },
      { name: 'Case Diary', key_code: 'diary' },
      { name: 'Documents', key_code: 'docs' },
      { name: 'Land Details', key_code: 'land' },
      { name: 'Legal Opinions', key_code: 'opinions' },
      { name: 'Advocates', key_code: 'advs' },
      { name: 'Clients', key_code: 'clients' },
      { name: 'Membership', key_code: 'member' },
      { name: 'Day Book', key_code: 'daybook' },
      { name: 'Payments', key_code: 'pay' },
      { name: 'Reports', key_code: 'reports' },
      { name: 'Bare Acts', key_code: 'acts' },
      { name: 'Settings', key_code: 'roles' }
    ];
    await queryInterface.bulkInsert('modules', modules, {});

    // Retrieve inserted modules to get IDs
    const seededModules = await queryInterface.sequelize.query(
      `SELECT id, name FROM modules;`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const moduleList = seededModules; // In original array order matching index 0-13

    // 3. Seed Permissions Matrix
    // Role permissions indices matching PMODS index 0-13:
    const matrix = {
      'Super Admin':  ['VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA'],
      'Admin':        ['VEA','VEA','VE','VE','VE','V','VEA','VEA','VE','VE','VEA','VE','V','—'],
      'Sub Admin':    ['VE','V','VE','VE','VE','V','V','VE','V','VE','V','V','V','—'],
      'Advocate':     ['V','VA','VE','VE','VE','VEA','V','V','V','—','V','V','V','—'],
      'Staff/Bearer': ['V','VA','V','VE','VE','—','—','V','—','VE','—','—','V','—']
    };

    const permissionsToSeed = [];
    for (const [roleName, levels] of Object.entries(matrix)) {
      const roleId = roleIdMap[roleName];
      levels.forEach((level, idx) => {
        // Find matching module by index
        const moduleName = modules[idx].name;
        const dbModule = moduleList.find(m => m.name === moduleName);
        if (dbModule) {
          permissionsToSeed.push({
            role_id: roleId,
            module_id: dbModule.id,
            access_level: level,
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      });
    }
    await queryInterface.bulkInsert('permissions', permissionsToSeed, {});

    // 4. Seed Default Users (one per role; password for all: password)
    const passwordHash = await bcrypt.hash('password', 10);
    const superAdminHash = await bcrypt.hash('Teja@1541', 10);
    const now = new Date();
    const defaultUsers = [
      {
        name: 'A.Theja',
        email: 'amasatheja1541@gmail.com',
        password_hash: superAdminHash,
        role_id: roleIdMap['Super Admin'],
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        name: 'Office Admin',
        email: 'admin@legaldesk.in',
        password_hash: passwordHash,
        role_id: roleIdMap['Admin'],
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        name: 'Sub Admin',
        email: 'subadmin@legaldesk.in',
        password_hash: passwordHash,
        role_id: roleIdMap['Sub Admin'],
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        name: 'M. Sailaja',
        email: 'advocate@legaldesk.in',
        password_hash: passwordHash,
        role_id: roleIdMap['Advocate'],
        status: 'active',
        created_at: now,
        updated_at: now
      },
      {
        name: 'Staff Bearer',
        email: 'staff@legaldesk.in',
        password_hash: passwordHash,
        role_id: roleIdMap['Staff/Bearer'],
        status: 'active',
        created_at: now,
        updated_at: now
      }
    ];
    await queryInterface.bulkInsert('users', defaultUsers, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Clean tables in reverse hierarchy order
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('modules', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};
