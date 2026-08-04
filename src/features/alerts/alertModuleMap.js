/**
 * Maps Alert referenceTypes to their parent RBAC module keys.
 * This is used for Row Level Security to ensure users only see
 * alerts for modules they are authorized to access.
 */
module.exports = {
  Case: 'cases',
  Hearing: 'cases', // Hearings fall under the cases module
  Payment: 'pay',
  Task: 'tasks',
  Document: 'docs'
};
