const { Role, Module, Permission } = require('../features/associations');

const getDynamicApprovalLadder = async () => {
  const moduleObj = await Module.findOne({ where: { keyCode: 'approve' } });
  if (!moduleObj) return [];

  const permissions = await Permission.findAll({ 
    where: { moduleId: moduleObj.id }
  });

  const allRoles = await Role.findAll();
  const roleMap = {};
  allRoles.forEach(r => roleMap[r.id] = r.name);

  const rolesWithA = permissions
    .filter(p => typeof p.accessLevel === 'string' && p.accessLevel.includes('A'))
    .map(p => roleMap[p.roleId])
    .filter(r => r && r !== 'Group Admin');

  const hierarchy = [
    'Staff/Bearer',
    'Advocate',
    'Sub Admin',
    'Admin',
    'Tenant Admin',
    'Super Admin'
  ];

  const ladderRoles = hierarchy.filter(h => rolesWithA.includes(h));
  const others = rolesWithA.filter(r => !hierarchy.includes(r)).sort();

  return [...ladderRoles, ...others];
};

module.exports = {
  getDynamicApprovalLadder
};
