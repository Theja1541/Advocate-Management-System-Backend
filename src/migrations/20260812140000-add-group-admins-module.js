'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Check if "Group Admins" module already exists
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM modules WHERE key_code = 'group-admins' LIMIT 1;`
    );

    let moduleId;

    if (!existing || existing.length === 0) {
      // Insert "Group Admins" module into modules table
      await queryInterface.bulkInsert('modules', [
        {
          name: 'Group Admins',
          key_code: 'group-admins',
        },
      ]);

      const [inserted] = await queryInterface.sequelize.query(
        `SELECT id FROM modules WHERE key_code = 'group-admins' LIMIT 1;`
      );
      moduleId = inserted?.[0]?.id;
    } else {
      moduleId = existing[0].id;
    }

    if (!moduleId) {
      throw new Error('Failed to retrieve seeded Group Admins module ID.');
    }

    // 2. Retrieve all existing roles
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles;`
    );

    // 3. Default permission matrix values for Group Admins
    const defaultMatrix = {
      'Super Admin': 'VEA',
      'Tenant Admin': 'VEA',
      'Admin': 'VEA',
      'Group Admin': 'V',
      'Sub Admin': 'V',
      'Advocate': '---',
      'Staff/Bearer': '---',
    };

    // 4. Seed default permissions for each role if missing
    const permissionsToSeed = [];
    for (const role of roles) {
      const [permExisting] = await queryInterface.sequelize.query(
        `SELECT access_level FROM permissions WHERE role_id = ${role.id} AND module_id = ${moduleId} LIMIT 1;`
      );

      if (!permExisting || permExisting.length === 0) {
        let accessLevel = '---';
        for (const [key, val] of Object.entries(defaultMatrix)) {
          if (role.name.toLowerCase().includes(key.toLowerCase())) {
            accessLevel = val;
            break;
          }
        }

        permissionsToSeed.push({
          role_id: role.id,
          module_id: moduleId,
          access_level: accessLevel,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }
    }

    if (permissionsToSeed.length > 0) {
      await queryInterface.bulkInsert('permissions', permissionsToSeed, {});
    }
  },

  down: async (queryInterface, Sequelize) => {
    const [modules] = await queryInterface.sequelize.query(
      `SELECT id FROM modules WHERE key_code = 'group-admins' LIMIT 1;`
    );
    const moduleId = modules?.[0]?.id;

    if (moduleId) {
      await queryInterface.bulkDelete('permissions', { module_id: moduleId }, {});
      await queryInterface.bulkDelete('modules', { id: moduleId }, {});
    }
  },
};
