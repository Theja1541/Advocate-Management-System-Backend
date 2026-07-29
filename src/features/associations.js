const Role = require('./users/Role');
const User = require('./users/User');
const Module = require('./users/Module');
const Permission = require('./users/Permission');
const Client = require('./clients/Client');
const Advocate = require('./advocates/Advocate');
const Case = require('./cases/Case');
const CaseDiary = require('./diary/CaseDiary');
const Document = require('./documents/Document');
const Reference = require('./refs/Reference');
const Land = require('./lands/Land');
const Opinion = require('./opinions/Opinion');
const Membership = require('./memberships/Membership');
const Payment = require('./payments/Payment');
const Daybook = require('./daybook/Daybook');
const Alert = require('./alerts/Alert');
const BareAct = require('./acts/BareAct');
const Amendment = require('./acts/Amendment');
const CaseType = require('./masters/case-types/CaseType');
const CaseStage = require('./masters/case-stages/CaseStage');
const CaseStageHistory = require('./cases/CaseStageHistory');
const Court = require('./masters/courts/Court');
const Task = require('./tasks/Task');


// 1. Roles & Users
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// 2. Permission Matrix (Many-to-Many via Permission table)
Role.belongsToMany(Module, { through: Permission, foreignKey: 'role_id', otherKey: 'module_id', as: 'modules' });
Module.belongsToMany(Role, { through: Permission, foreignKey: 'module_id', otherKey: 'role_id', as: 'roles' });

// 3. User & Advocate link
User.hasOne(Advocate, { foreignKey: 'userId', as: 'advocateProfile' });
Advocate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 4. Clients, Advocates & Cases
Client.hasMany(Case, { foreignKey: 'client_id', as: 'cases' });
Case.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Advocate.hasMany(Case, { foreignKey: 'advocate_id', as: 'assignedCases' });
Case.belongsTo(Advocate, { foreignKey: 'advocate_id', as: 'assignedAdvocate' });

// 5. Cases, Advocates & Diaries
Case.hasMany(CaseDiary, { foreignKey: 'case_id', as: 'diaries' });
CaseDiary.belongsTo(Case, { foreignKey: 'case_id', as: 'case' });

Advocate.hasMany(CaseDiary, { foreignKey: 'advocate_id', as: 'loggedDiaries' });
CaseDiary.belongsTo(Advocate, { foreignKey: 'advocate_id', as: 'advocate' });

// 6. Case Files (Documents) & Uploaders
Case.hasMany(Document, { foreignKey: 'case_id', as: 'documents' });
Document.belongsTo(Case, { foreignKey: 'case_id', as: 'case' });

User.hasMany(Document, { foreignKey: 'uploaded_by', as: 'uploadedDocuments' });
Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

CaseDiary.hasMany(Document, { foreignKey: 'diary_id', as: 'attachments', onDelete: 'CASCADE' });
Document.belongsTo(CaseDiary, { foreignKey: 'diary_id', as: 'caseDiary' });

// 7. Lands & Clients / Cases
Client.hasMany(Land, { foreignKey: 'client_id', as: 'lands' });
Land.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Case.hasMany(Land, { foreignKey: 'case_id', as: 'disputedLands' });
Land.belongsTo(Case, { foreignKey: 'case_id', as: 'case' });

// 8. Opinions & Clients / Advocates
Client.hasMany(Opinion, { foreignKey: 'client_id', as: 'opinions' });
Opinion.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

Advocate.hasMany(Opinion, { foreignKey: 'advocate_id', as: 'draftedOpinions' });
Opinion.belongsTo(Advocate, { foreignKey: 'advocate_id', as: 'advocate' });

// 9. Membership & Advocates
Advocate.hasOne(Membership, { foreignKey: 'advocate_id', as: 'membership' });
Membership.belongsTo(Advocate, { foreignKey: 'advocate_id', as: 'advocate' });

// 10. Payments & Cases
Case.hasMany(Payment, { foreignKey: 'case_id', as: 'payments' });
Payment.belongsTo(Case, { foreignKey: 'case_id', as: 'case' });

// 11. Daybook transactions & Users
User.hasMany(Daybook, { foreignKey: 'recorded_by', as: 'recordedTransactions' });
Daybook.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });

// 12. Case Masters Associations
Case.belongsTo(CaseType, { foreignKey: 'case_type_id', as: 'caseType' });
CaseType.hasMany(Case, { foreignKey: 'case_type_id', as: 'cases' });

Case.belongsTo(CaseStage, { foreignKey: 'case_stage_id', as: 'currentStage' });
CaseStage.hasMany(Case, { foreignKey: 'case_stage_id', as: 'cases' });

CaseStageHistory.belongsTo(Case, { foreignKey: 'case_id', as: 'case' });
Case.hasMany(CaseStageHistory, { foreignKey: 'case_id', as: 'stageHistory' });

CaseStageHistory.belongsTo(CaseStage, { foreignKey: 'new_stage_id', as: 'newStage' });
CaseStageHistory.belongsTo(CaseStage, { foreignKey: 'old_stage_id', as: 'oldStage' });

Case.belongsTo(Court, { foreignKey: 'court_id', as: 'assignedCourt' });
Court.hasMany(Case, { foreignKey: 'court_id', as: 'cases' });

// 13. Tasks
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });

User.hasMany(Task, { foreignKey: 'created_by', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Task, { foreignKey: 'updated_by', as: 'updatedTasks' });
Task.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// 14. Amendments
User.hasMany(Amendment, { foreignKey: 'created_by', as: 'createdAmendments' });
Amendment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(Amendment, { foreignKey: 'updated_by', as: 'updatedAmendments' });
Amendment.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// Export everything from a unified hub to prevent circular dependency
module.exports = {
  Role,
  User,
  Module,
  Permission,
  Client,
  Advocate,
  Case,
  CaseDiary,
  Document,
  Reference,
  Land,
  Opinion,
  Membership,
  Payment,
  Daybook,
  Alert,
  BareAct,
  Amendment,
  CaseType,
  CaseStage,
  CaseStageHistory,
  Court,
  Task,
};

