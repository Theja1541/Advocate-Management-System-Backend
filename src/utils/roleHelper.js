const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Tenant Admin',
  GROUP_ADMIN: 'Group Admin',
  ADVOCATE: 'Advocate',
  SUB_ADMIN: 'Sub Admin',
  STAFF: 'Staff/Bearer',
};

const normalizeRole = (role) => {
  if (!role) return '';
  const r = String(role).trim().toLowerCase();
  if (r.includes('super admin') || r.includes('super_admin')) return 'Super Admin';
  if (r.includes('tenant admin') || r.includes('tenant_admin') || r === 'admin') return 'Tenant Admin';
  if (r.includes('group admin') || r.includes('group_admin')) return 'Group Admin';
  if (r.includes('advocate')) return 'Advocate';
  if (r.includes('sub admin') || r.includes('sub_admin')) return 'Sub Admin';
  if (r.includes('staff/bearer') || r.includes('staff')) return 'Staff/Bearer';
  return role;
};


const isSuperAdmin = (role) => normalizeRole(role) === 'Super Admin';
const isTenantAdmin = (role) => normalizeRole(role) === 'Tenant Admin';
const isGroupAdmin = (role) => normalizeRole(role) === 'Group Admin';
const isAdvocate = (role) => normalizeRole(role) === 'Advocate';

module.exports = {
  ROLES,
  normalizeRole,
  isSuperAdmin,
  isTenantAdmin,
  isGroupAdmin,
  isAdvocate,
};
