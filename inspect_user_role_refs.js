const fs = require('fs');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [userRefs] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM advocates WHERE user_id = 1) as advocates_user,
        (SELECT COUNT(*) FROM amendments WHERE created_by = 1 OR updated_by = 1) as amendments_user,
        (SELECT COUNT(*) FROM daybook WHERE recorded_by = 1) as daybook_user,
        (SELECT COUNT(*) FROM diary_entries WHERE created_by = 1) as diary_entries_user,
        (SELECT COUNT(*) FROM documents WHERE uploaded_by = 1) as documents_user,
        (SELECT COUNT(*) FROM group_admin_advocates WHERE group_admin_id = 1) as gadmin_user,
        (SELECT COUNT(*) FROM land_title_searches WHERE conducted_by = 1) as land_title_user,
        (SELECT COUNT(*) FROM opinions WHERE approved_by = 1 OR issued_by = 1) as opinions_user,
        (SELECT COUNT(*) FROM tasks WHERE assigned_to = 1 OR created_by = 1 OR updated_by = 1) as tasks_user
    `);
    console.log('=== REFERENCES TO USER ID 1 ===');
    console.log(userRefs[0]);

    const [roleRefs] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role_id = 1) as users_role_1,
        (SELECT COUNT(*) FROM permissions WHERE role_id = 1) as permissions_role_1
    `);
    console.log('=== REFERENCES TO ROLE ID 1 ===');
    console.log(roleRefs[0]);

  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
})();
