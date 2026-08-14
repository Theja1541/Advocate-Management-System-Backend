const Role = require('./users/Role');
const User = require('./users/User');
const Module = require('./users/Module');
const Permission = require('./users/Permission');
const Tenant = require('./tenants/Tenant');
const TenantSetting = require('./tenants/TenantSetting');
const SubscriptionPlan = require('./tenants/SubscriptionPlan');
const TenantSubscription = require('./tenants/TenantSubscription');
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
const DocumentCategory = require('./masters/document-categories/DocumentCategory');
const GlobalSetting = require('./settings/GlobalSetting');
const LegalText = require('./legal-texts/LegalText');
const PhraseGroup = require('./legal-texts/PhraseGroup');
const PhraseOccurrence = require('./legal-texts/PhraseOccurrence');
const LandTitleSearch = require('./title-searches/LandTitleSearch');

// Tenant Relationships
Tenant.hasMany(TenantSetting, { foreignKey: 'tenant_id', as: 'settings', onDelete: 'CASCADE' });
TenantSetting.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

Tenant.hasMany(TenantSubscription, { foreignKey: 'tenant_id', as: 'subscriptions', onDelete: 'CASCADE' });
TenantSubscription.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });

SubscriptionPlan.hasMany(TenantSubscription, { foreignKey: 'plan_id', as: 'subscriptions' });
TenantSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });

SubscriptionPlan.hasMany(Tenant, { foreignKey: 'plan_id', as: 'tenants' });
Tenant.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id', as: 'plan' });

const tenantModels = [
  User, Role, Client, Advocate, Case, CaseDiary, Document, Land, Opinion, Payment, Daybook, Alert, Task, Amendment, Reference, Membership,
  CaseType, CaseStage, CaseStageHistory, Court, DocumentCategory, BareAct, LegalText, PhraseGroup, PhraseOccurrence
];

tenantModels.forEach(model => {
  Tenant.hasMany(model, { foreignKey: 'tenant_id' });
  model.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
});


// 1. Roles & Users
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// 2. Permission Matrix (Many-to-Many via Permission table)
Role.belongsToMany(Module, { through: Permission, foreignKey: 'role_id', otherKey: 'module_id', as: 'modules' });
Module.belongsToMany(Role, { through: Permission, foreignKey: 'module_id', otherKey: 'role_id', as: 'roles' });

const GroupAdminAdvocate = require('./users/GroupAdminAdvocate');

// 3. User & Advocate link
User.hasOne(Advocate, { foreignKey: 'userId', as: 'advocateProfile' });
Advocate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 3a. Advocate & Tenant Admin link
Advocate.belongsTo(User, { foreignKey: 'tenantAdminId', as: 'assignedTenantAdmin' });
User.hasMany(Advocate, { foreignKey: 'tenantAdminId', as: 'tenantAdminAdvocates' });

// 3b. Group Admin ↔ Advocate Many-to-Many
User.belongsToMany(Advocate, {
  through: GroupAdminAdvocate,
  foreignKey: 'group_admin_id',
  otherKey: 'advocate_id',
  as: 'assignedAdvocates',
});

Advocate.belongsToMany(User, {
  through: GroupAdminAdvocate,
  foreignKey: 'advocate_id',
  otherKey: 'group_admin_id',
  as: 'groupAdmins',
});

User.hasMany(GroupAdminAdvocate, { foreignKey: 'group_admin_id', as: 'advocateLinks' });
GroupAdminAdvocate.belongsTo(User, { foreignKey: 'group_admin_id', as: 'groupAdmin' });

Advocate.hasMany(GroupAdminAdvocate, { foreignKey: 'advocate_id', as: 'groupAdminLinks' });
GroupAdminAdvocate.belongsTo(Advocate, { foreignKey: 'advocate_id', as: 'advocate' });

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

Land.hasMany(Document, { foreignKey: 'land_id', as: 'documents' });
Document.belongsTo(Land, { foreignKey: 'land_id', as: 'land' });

User.hasMany(Document, { foreignKey: 'uploaded_by', as: 'uploadedDocuments' });
Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

CaseDiary.hasMany(Document, { foreignKey: 'diary_id', as: 'attachments', onDelete: 'CASCADE' });
Document.belongsTo(CaseDiary, { foreignKey: 'diary_id', as: 'caseDiary' });

// Add new CaseDiary specific associations
CaseDiary.belongsTo(Court, { foreignKey: 'court_id', as: 'court' });
Court.hasMany(CaseDiary, { foreignKey: 'court_id', as: 'diaries' });

CaseDiary.belongsTo(Advocate, { foreignKey: 'conducted_by', as: 'conductedByAdvocate' });
Advocate.hasMany(CaseDiary, { foreignKey: 'conducted_by', as: 'conductedHearings' });

DocumentCategory.hasMany(Document, { foreignKey: 'document_category_id', as: 'documents' });
Document.belongsTo(DocumentCategory, { foreignKey: 'document_category_id', as: 'documentCategory' });

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

Land.hasMany(Opinion, { foreignKey: 'land_id', as: 'opinions' });
Opinion.belongsTo(Land, { foreignKey: 'land_id', as: 'land' });

User.hasMany(Opinion, { foreignKey: 'approved_by', as: 'approvedOpinions' });
Opinion.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

User.hasMany(Opinion, { foreignKey: 'issued_by', as: 'issuedOpinions' });
Opinion.belongsTo(User, { foreignKey: 'issued_by', as: 'issuer' });

Opinion.belongsTo(Document, { foreignKey: 'document_id', as: 'finalPdf' });
Document.hasOne(Opinion, { foreignKey: 'document_id', as: 'opinion' });

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

// 15. LegalTexts
User.hasMany(LegalText, { foreignKey: 'created_by', as: 'createdLegalTexts' });
LegalText.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(LegalText, { foreignKey: 'updated_by', as: 'updatedLegalTexts' });
LegalText.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

PhraseGroup.hasMany(PhraseOccurrence, { foreignKey: 'phrase_group_id', as: 'occurrences', onDelete: 'CASCADE' });
PhraseOccurrence.belongsTo(PhraseGroup, { foreignKey: 'phrase_group_id', as: 'phraseGroup' });

// 15. Land Title Searches
Land.hasMany(LandTitleSearch, { foreignKey: 'land_id', as: 'titleSearches' });
LandTitleSearch.belongsTo(Land, { foreignKey: 'land_id', as: 'land' });

User.hasMany(LandTitleSearch, { foreignKey: 'conducted_by', as: 'titleSearchesConducted' });
LandTitleSearch.belongsTo(User, { foreignKey: 'conducted_by', as: 'conductedByUser' });

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
  DocumentCategory,
  Tenant,
  TenantSetting,
  SubscriptionPlan,
  TenantSubscription,
  GlobalSetting,
  LegalText,
  PhraseGroup,
  PhraseOccurrence,
  LandTitleSearch,
  GroupAdminAdvocate,
};

