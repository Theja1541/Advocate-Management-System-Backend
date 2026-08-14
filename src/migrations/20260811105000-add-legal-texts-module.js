'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Check if "Legal Texts" module already exists
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM modules WHERE key_code = 'legalTexts' LIMIT 1;`
    );

    let moduleId;

    if (!existing || existing.length === 0) {
      await queryInterface.bulkInsert('modules', [
        {
          name: 'Legal Texts',
          key_code: 'legalTexts'
        }
      ]);

      const [inserted] = await queryInterface.sequelize.query(
        `SELECT id FROM modules WHERE key_code = 'legalTexts' LIMIT 1;`
      );
      moduleId = inserted?.[0]?.id;
    } else {
      moduleId = existing[0].id;
    }

    if (!moduleId) {
      throw new Error('Failed to retrieve seeded Legal Texts module ID.');
    }

    // 3. Retrieve all existing roles
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, name FROM roles;`
    );

    // 4. Default permission matrix values for Legal Texts
    const defaultMatrix = {
      'Super Admin': 'VEA',
      'Tenant Admin': 'VEA',
      'Admin': 'VE',
      'Sub Admin': 'V',
      'Advocate': 'VE',
      'Staff/Bearer': 'V'
    };

    // 5. Seed default permissions for each role
    const permissionsToSeed = roles.map(role => {
      // Find the access level or default to 'V' (View)
      let accessLevel = 'V';
      for (const [key, val] of Object.entries(defaultMatrix)) {
        if (role.name.toLowerCase().includes(key.toLowerCase())) {
          accessLevel = val;
          break;
        }
      }

      return {
        role_id: role.id,
        module_id: moduleId,
        access_level: accessLevel,
        created_at: new Date(),
        updated_at: new Date()
      };
    });

    if (permissionsToSeed.length > 0) {
      try {
        await queryInterface.bulkInsert('permissions', permissionsToSeed, {});
      } catch (e) {}
    }
  },

  down: async (queryInterface, Sequelize) => {
    const [modules] = await queryInterface.sequelize.query(
      `SELECT id FROM modules WHERE key_code = 'legalTexts' LIMIT 1;`
    );
    const moduleId = modules?.[0]?.id;

    if (moduleId) {
      // Remove permissions linked to Legal Texts
      await queryInterface.bulkDelete('permissions', { module_id: moduleId }, {});
      // Remove the module itself
      await queryInterface.bulkDelete('modules', { id: moduleId }, {});
    }
  }
};
