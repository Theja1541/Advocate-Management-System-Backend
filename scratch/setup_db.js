const { sequelize } = require('../src/config/database');
const bcrypt = require('bcrypt');
const {
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
} = require('../src/features/associations');

async function setup() {
  try {
    console.log('Starting Database sync and seeding...');
    await sequelize.authenticate();
    console.log('Connected to database successfully.');

    // Disable foreign keys to bypass constraint blockages while drops occur
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('Foreign key checks disabled.');

    // 1. Sync all tables (Drop existing and recreate based on model definitions)
    await sequelize.sync({ force: true });
    console.log('Tables synced and created successfully.');

    // Enable foreign key checks back
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('Foreign key checks enabled.');

    // 2. Seed Roles
    const roles = await Role.bulkCreate([
      { name: 'Super Admin', description: 'Full system access' },
      { name: 'Admin', description: 'Advocates, cases, payments and reports management' },
      { name: 'Sub Admin', description: 'Case updates, land and diary data helper' },
      { name: 'Advocate', description: 'Practitioner login for assigned matters' },
      { name: 'Staff/Bearer', description: 'Day book and field visit records' }
    ]);
    console.log('Roles seeded.');

    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.name] = r.id;
    });

    // 3. Seed Modules
    const modules = await Module.bulkCreate([
      { name: 'Cases', keyCode: 'cases' },
      { name: 'Case Approval', keyCode: 'approve' },
      { name: 'Case Diary', keyCode: 'diary' },
      { name: 'Documents', keyCode: 'docs' },
      { name: 'Land Details', keyCode: 'land' },
      { name: 'Legal Opinions', keyCode: 'opinions' },
      { name: 'Advocates', keyCode: 'advs' },
      { name: 'Clients', keyCode: 'clients' },
      { name: 'Membership', keyCode: 'member' },
      { name: 'Day Book', keyCode: 'daybook' },
      { name: 'Payments', keyCode: 'pay' },
      { name: 'Reports', keyCode: 'reports' },
      { name: 'Bare Acts', keyCode: 'acts' },
      { name: 'Settings', keyCode: 'roles' }
    ]);
    console.log('Modules seeded.');

    // 4. Seed Permissions
    const matrix = {
      'Super Admin':  ['VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA','VEA'],
      'Admin':        ['VEA','VEA','VE','VE','VE','V','VEA','VEA','VE','VE','VEA','VE','V','—'],
      'Sub Admin':    ['VE','V','VE','VE','VE','V','V','VE','V','VE','V','V','V','—'],
      'Advocate':     ['V','VA','VE','VE','VE','VEA','V','V','V','—','V','V','V','—'],
      'Staff/Bearer': ['V','VA','V','VE','VE','—','—','V','—','VE','—','—','V','—']
    };

    const permissions = [];
    for (const [roleName, levels] of Object.entries(matrix)) {
      const roleId = roleMap[roleName];
      levels.forEach((level, idx) => {
        const dbModule = modules[idx];
        permissions.push({
          roleId,
          moduleId: dbModule.id,
          accessLevel: level
        });
      });
    }
    await Permission.bulkCreate(permissions);
    console.log('Permissions seeded.');

    // 5. Seed Default Users (one per role; password for all: password)
    const passwordHash = await bcrypt.hash('password', 10);
    const users = await User.bulkCreate([
      {
        name: 'P. Raghavendra Rao',
        email: 'raghavendra@legaldesk.in',
        passwordHash,
        roleId: roleMap['Super Admin'],
        status: 'active'
      },
      {
        name: 'Office Admin',
        email: 'admin@legaldesk.in',
        passwordHash,
        roleId: roleMap['Admin'],
        status: 'active'
      },
      {
        name: 'Sub Admin',
        email: 'subadmin@legaldesk.in',
        passwordHash,
        roleId: roleMap['Sub Admin'],
        status: 'active'
      },
      {
        name: 'M. Sailaja',
        email: 'advocate@legaldesk.in',
        passwordHash,
        roleId: roleMap['Advocate'],
        status: 'active'
      },
      {
        name: 'Staff Bearer',
        email: 'staff@legaldesk.in',
        passwordHash,
        roleId: roleMap['Staff/Bearer'],
        status: 'active'
      }
    ]);
    console.log('Default users seeded.');

    // 6. Seed Advocates
    const advocates = await Advocate.bulkCreate([
      { id: 1, name: 'P. Raghavendra Rao', mobile: '9876543412', email: 'raghavendra@legaldesk.in', relation: 'Senior', specialization: 'Civil & Property', experience: '22', enrolment: 'AP/1142/2003', status: 'active', userId: users[0].id },
      { id: 2, name: 'M. Sailaja', mobile: '9123456776', email: 'advocate@legaldesk.in', relation: 'Junior', specialization: 'Civil, Land Acquisition', experience: '9', enrolment: 'AP/2871/2016', status: 'active', userId: users[3].id },
      { id: 3, name: 'B. Narasimhulu', mobile: '9988776203', email: 'narasimhulu@legaldesk.in', relation: 'Junior', specialization: 'Land & Revenue', experience: '6', enrolment: 'AP/3390/2019', status: 'active' },
      { id: 4, name: 'G. Praveen Kumar', mobile: '9440011558', email: 'praveen@legaldesk.in', relation: 'Referral', specialization: 'Civil Appeals', experience: '14', enrolment: 'AP/1904/2011', status: 'active' },
      { id: 5, name: 'S. Haritha', mobile: '7012345931', email: 'haritha@legaldesk.in', relation: 'Junior', specialization: 'Family & Civil', experience: '4', enrolment: 'AP/3712/2021', status: 'active' }
    ]);
    console.log('Advocates seeded.');

    // 7. Seed Memberships
    await Membership.bulkCreate([
      { advocateId: 1, planName: 'Firm — Annual', feeAmount: 24000.00, startDate: '2026-04-01', expiryDate: '2027-03-31', status: 'active' },
      { advocateId: 2, planName: 'Associate — Annual', feeAmount: 12000.00, startDate: '2026-04-01', expiryDate: '2027-03-31', status: 'active' },
      { advocateId: 3, planName: 'Associate — Annual', feeAmount: 12000.00, startDate: '2025-08-01', expiryDate: '2026-07-31', status: 'expiring' },
      { advocateId: 4, planName: 'Referral — Annual', feeAmount: 8000.00, startDate: '2026-04-01', expiryDate: '2027-03-31', status: 'active' },
      { advocateId: 5, planName: 'Associate — Half yearly', feeAmount: 6500.00, startDate: '2026-02-01', expiryDate: '2026-07-31', status: 'expiring' }
    ]);
    console.log('Memberships seeded.');

    // 8. Seed Clients
    const clients = await Client.bulkCreate([
      { id: 1, clientCode: 'CL-01', name: 'K. Subbarayudu', mobile: '9876543771', email: 'subbarayudu@legaldesk.in', village: 'Kalikiri', aadhaarMasked: '2345 6789 4412', panMasked: 'ABCPK1234F', docsCount: 3, createdBy: users[0].id },
      { id: 2, clientCode: 'CL-02', name: 'R. Lakshmi Devi', mobile: '9123456330', email: 'lakshmi.d@mail.in', village: 'Pileru', aadhaarMasked: '3456 7890 8890', panMasked: 'BDKPL5678M', docsCount: 5, createdBy: users[0].id },
      { id: 3, clientCode: 'CL-03', name: 'Sri Venkateswara Traders', mobile: '9440011102', email: 'svtraders@mail.in', village: 'Madanapalle', aadhaarMasked: '—', panMasked: 'AAFCS9012K', docsCount: 8, createdBy: users[0].id },
      { id: 4, clientCode: 'CL-04', name: 'M. Chandrasekhar', mobile: '9988776645', email: 'chandra@legaldesk.in', village: 'Tirupati', aadhaarMasked: '4567 8901 1207', panMasked: 'CKMPC3456R', docsCount: 2, createdBy: users[0].id },
      { id: 5, clientCode: 'CL-05', name: 'Kalikiri Rythu Sangham', mobile: '7012345418', email: 'krs.kalikiri@mail.in', village: 'Kalikiri', aadhaarMasked: '—', panMasked: 'AAGAK7890Q', docsCount: 6, createdBy: users[0].id },
      { id: 6, clientCode: 'CL-06', name: 'D. Anasuya', mobile: '9345678889', email: 'anasuya@legaldesk.in', village: 'Vayalpad', aadhaarMasked: '5678 9012 6634', panMasked: 'DLNPA2345H', docsCount: 1, createdBy: users[0].id }
    ]);
    console.log('Clients seeded.');

    // 9. Seed Cases
    const cases = await Case.bulkCreate([
      { id: 1, caseNo: 'O.S. 214/2024', court: 'Sr. Civil Judge Court, Madanapalle', title: 'Partition Suit — vs K. Venkataramana & 3 others :: Evidence :: 1850000 :: 12', status: 'Active', nextHearing: '2026-07-16', advocateId: 2, clientId: 1, approvalLevel: 4 },
      { id: 2, caseNo: 'O.S. 88/2025', court: 'Jr. Civil Judge Court, Pileru', title: 'Permanent Injunction — vs Mandal Revenue Officer, Pileru :: Arguments :: 640000 :: 10', status: 'Active', nextHearing: '2026-07-16', advocateId: 3, clientId: 2, approvalLevel: 4 },
      { id: 3, caseNo: 'A.S. 31/2025', court: 'Principal District Court, Tirupati', title: 'Appeal Suit — vs D. Mohan Rao :: Final Hearing :: 4200000 :: 15', status: 'Active', nextHearing: '2026-07-16', advocateId: 4, clientId: 3, approvalLevel: 4 },
      { id: 4, caseNo: 'E.P. 12/2026', court: 'District Court, Chittoor', title: 'Execution Petition — vs Y. Bhaskar Reddy :: Execution :: 980000 :: 10', status: 'Active', nextHearing: '2026-07-16', advocateId: 2, clientId: 4, approvalLevel: 4 },
      { id: 5, caseNo: 'O.S. 305/2025', court: 'Sr. Civil Judge Court, Madanapalle', title: 'Permanent Injunction — vs A.P.S.R.T.C. :: Written Statement :: 2750000 :: 12', status: 'Active', nextHearing: '2026-07-16', advocateId: 1, clientId: 5, approvalLevel: 4 },
      { id: 6, caseNo: 'O.S. 402/2025', court: 'Jr. Civil Judge Court, Pileru', title: 'Specific Performance — vs T. Ramanaiah :: Trial :: 1320000 :: 12', status: 'Active', nextHearing: '2026-07-24', advocateId: 5, clientId: 6, approvalLevel: 3 },
      { id: 7, caseNo: 'O.S. 117/2026', court: 'Sr. Civil Judge Court, Madanapalle', title: 'Declaration of Title — vs K. Sudhakar :: Filing :: 3100000 :: 12', status: 'Pending Approval', nextHearing: '2026-07-29', advocateId: 3, clientId: 1, approvalLevel: 2 },
      { id: 8, caseNo: 'O.S. 133/2026', court: 'District Court, Chittoor', title: 'Money Recovery — vs Sai Balaji Enterprises :: Filing :: 875000 :: 10', status: 'Pending Approval', nextHearing: null, advocateId: 4, clientId: 3, approvalLevel: 1 },
      { id: 9, caseNo: 'O.S. 61/2023', court: 'Principal District Court, Tirupati', title: 'Partition Suit — vs R. Sivaramakrishna :: Disposed :: 2400000 :: 12', status: 'Closed', nextHearing: null, advocateId: 1, clientId: 2, approvalLevel: 4 },
      { id: 10, caseNo: 'O.S. 290/2023', court: 'Jr. Civil Judge Court, Pileru', title: 'Permanent Injunction — vs Gram Panchayat, Vayalpad :: Disposed :: 410000 :: 10', status: 'Closed', nextHearing: null, advocateId: 5, clientId: 4, approvalLevel: 4 }
    ]);
    console.log('Cases seeded.');

    // 10. Seed Diaries
    await CaseDiary.bulkCreate([
      { caseId: 1, hearingDate: '2026-07-15', hearingTime: '10:30:00', advocateId: 2, courtIndex: 0, note: 'PW-2 chief examination recorded. Cross deferred at the request of the respondent counsel.', nextHearingDate: '2026-07-16', attachmentsCount: 2, createdBy: users[0].id },
      { caseId: 2, hearingDate: '2026-07-15', hearingTime: '11:00:00', advocateId: 3, courtIndex: 1, note: 'Arguments part-heard. Court directed written arguments to be filed before the next date.', nextHearingDate: '2026-07-16', attachmentsCount: 1, createdBy: users[0].id },
      { caseId: 5, hearingDate: '2026-07-14', hearingTime: '11:30:00', advocateId: 1, courtIndex: 0, note: 'Written statement filed on behalf of the respondent. Rejoinder to be filed.', nextHearingDate: '2026-07-16', attachmentsCount: 3, createdBy: users[0].id },
      { caseId: 6, hearingDate: '2026-07-14', hearingTime: '14:15:00', advocateId: 5, courtIndex: 1, note: 'Adjourned. Presiding officer on leave.', nextHearingDate: '2026-07-24', attachmentsCount: 0, createdBy: users[0].id },
      { caseId: 3, hearingDate: '2026-07-11', hearingTime: '11:00:00', advocateId: 4, courtIndex: 2, note: 'Appeal admitted. Lower court records called for.', nextHearingDate: '2026-07-16', attachmentsCount: 4, createdBy: users[0].id }
    ]);
    console.log('Case Diaries seeded.');

    // 11. Seed Daybook
    await Daybook.bulkCreate([
      { daybookCode: 'DB-001', transactionDate: '2026-07-01', category: 'Opening', particulars: 'Opening balance carried forward', paymentMode: 'Bank', type: 'in', amount: 485000.00, recordedBy: users[0].id },
      { daybookCode: 'DB-002', transactionDate: '2026-07-03', category: 'Court Visit', particulars: 'Court fee — O.S. 117/2026 filing, Madanapalle', paymentMode: 'Cash', type: 'out', amount: 18600.00, recordedBy: users[2].id },
      { daybookCode: 'DB-003', transactionDate: '2026-07-06', category: 'Client Payment', particulars: 'Part fee received — Sri Venkateswara Traders (A.S. 31/2025)', paymentMode: 'Bank', type: 'in', amount: 150000.00, recordedBy: users[0].id },
      { daybookCode: 'DB-004', transactionDate: '2026-07-08', category: 'Field Visit', particulars: 'Site inspection & party location — Kalikiri survey no. 214/2', paymentMode: 'Cash', type: 'out', amount: 3400.00, recordedBy: users[4].id },
      { daybookCode: 'DB-005', transactionDate: '2026-07-09', category: 'Office Expense', particulars: 'Typing, xerox & bundle binding — July', paymentMode: 'Cash', type: 'out', amount: 5250.00, recordedBy: users[0].id },
      { daybookCode: 'DB-006', transactionDate: '2026-07-10', category: 'Party Meeting', particulars: 'Conference with Kalikiri Rythu Sangham office bearers', paymentMode: 'Cash', type: 'out', amount: 1200.00, recordedBy: users[0].id },
      { daybookCode: 'DB-007', transactionDate: '2026-07-13', category: 'Client Payment', particulars: 'Fee received — K. Subbarayudu (O.S. 214/2024)', paymentMode: 'UPI', type: 'in', amount: 75000.00, recordedBy: users[0].id },
      { daybookCode: 'DB-008', transactionDate: '2026-07-14', category: 'Advocate Payment', particulars: 'Referral share — G. Praveen Kumar (A.S. 31/2025)', paymentMode: 'Bank', type: 'out', amount: 42000.00, recordedBy: users[0].id }
    ]);
    console.log('Daybook seeded.');

    // 12. Seed Payments
    await Payment.bulkCreate([
      { receiptNo: 'PY-041', caseId: 1, partyType: 'Client', partyId: 1, amountReceived: 75000.00, amountOutstanding: 222000.00, status: 'part', transactionDate: '2026-07-13', createdBy: users[0].id },
      { receiptNo: 'PY-042', caseId: 3, partyType: 'Client', partyId: 3, amountReceived: 150000.00, amountOutstanding: 630000.00, status: 'part', transactionDate: '2026-07-06', createdBy: users[0].id },
      { receiptNo: 'PY-043', caseId: 3, partyType: 'Advocate', partyId: 4, amountReceived: 42000.00, amountOutstanding: 0.00, status: 'paid', transactionDate: '2026-07-14', createdBy: users[0].id },
      { receiptNo: 'PY-044', caseId: 5, partyType: 'Client', partyId: 5, amountReceived: 0.00, amountOutstanding: 330000.00, status: 'pending', transactionDate: '2026-07-25', createdBy: users[0].id },
      { receiptNo: 'PY-045', caseId: 2, partyType: 'Client', partyId: 2, amountReceived: 64000.00, amountOutstanding: 0.00, status: 'paid', transactionDate: '2026-07-02', createdBy: users[0].id },
      { receiptNo: 'PY-046', caseId: 4, partyType: 'Client', partyId: 4, amountReceived: 0.00, amountOutstanding: 98000.00, status: 'pending', transactionDate: '2026-07-25', createdBy: users[0].id }
    ]);
    console.log('Payments seeded.');

    // 13. Seed Lands
    await Land.bulkCreate([
      { surveyNo: 'Survey No. 214/2', clientId: 1, village: 'Kalikiri', mandal: 'Kalikiri', district: 'Chittoor', extent: '2.45 Acres', classification: '18.5 L', pattaNo: 'Patta 88', encumbranceStatus: 'clear', titleStatus: 'disputed', caseId: 1, createdBy: users[0].id },
      { surveyNo: 'Survey No. 89/1A', clientId: 2, village: 'Pileru', mandal: 'Pileru', district: 'Chittoor', extent: '1.20 Acres', classification: '6.4 L', pattaNo: 'Patta 104', encumbranceStatus: 'clear', titleStatus: 'disputed', caseId: 2, createdBy: users[0].id },
      { surveyNo: 'Survey No. 331', clientId: 3, village: 'Madanapalle', mandal: 'Madanapalle', district: 'Chittoor', extent: '4.80 Acres', classification: '42.0 L', pattaNo: 'Patta 19', encumbranceStatus: 'clear', titleStatus: 'under_scrutiny', caseId: 3, createdBy: users[0].id },
      { surveyNo: 'Survey No. 412/C', clientId: 5, village: 'Kalikiri', mandal: 'Kalikiri', district: 'Chittoor', extent: '3.10 Acres', classification: '27.5 L', pattaNo: 'Patta 255', encumbranceStatus: 'clear', titleStatus: 'clear', caseId: 5, createdBy: users[0].id }
    ]);
    console.log('Lands seeded.');

    // 14. Seed Opinions
    await Opinion.bulkCreate([
      { referenceNo: 'LO-01', clientId: 1, surveyNo: 'Survey No. 214/2', village: 'Kalikiri', opinionType: 'Title Suit Opinion', issueDate: '2026-07-08', titleStatus: 'disputed', advocateId: 1, findingsNote: 'Draft findings show minor title dispute.', createdBy: users[0].id },
      { referenceNo: 'LO-02', clientId: 3, surveyNo: 'Survey No. 331', village: 'Madanapalle', opinionType: 'Purchase clearance certificate', issueDate: '2026-07-12', titleStatus: 'under_scrutiny', advocateId: 2, findingsNote: 'Under scrutiny for partition deeds.', createdBy: users[0].id }
    ]);
    console.log('Opinions seeded.');

    // 15. Seed Alerts
    await Alert.bulkCreate([
      { type: 'O.S. 214/2024', description: 'cross-examination of PW-2 deferred', severity: 'tape', dueInfo: '15 Jul 2026', isResolved: false },
      { type: 'O.S. 88/2025', description: 'Arguments part-heard, written arguments called for', severity: 'tape', dueInfo: '15 Jul 2026', isResolved: false },
      { type: 'Payments Due', description: 'Part fee received — Sri Venkateswara Traders (A.S. 31/2025)', severity: 'brass', dueInfo: '2 days ago', isResolved: false }
    ]);
    console.log('Alerts seeded.');

    // 16. Seed Bare Acts (from frontend mock ACTS)
    await BareAct.bulkCreate([
      { name: 'Bharatiya Nyaya Sanhita, 2023', abbreviation: 'BNS', effectiveDate: '2024-07-01', type: 'Central', description: 'Replaces the Indian Penal Code, 1860. 358 sections.', sectionsCount: 358, isBookmarked: true, pdfFile: 'BNS.pdf' },
      { name: 'Bharatiya Nagarik Suraksha Sanhita, 2023', abbreviation: 'BNSS', effectiveDate: '2024-07-01', type: 'Central', description: 'Replaces the Code of Criminal Procedure, 1973. 531 sections.', sectionsCount: 531, isBookmarked: false, pdfFile: 'BNSS.pdf' },
      { name: 'Bharatiya Sakshya Adhiniyam, 2023', abbreviation: 'BSA', effectiveDate: '2024-07-01', type: 'Central', description: 'Replaces the Indian Evidence Act, 1872. 170 sections.', sectionsCount: 170, isBookmarked: true, pdfFile: 'BSA.pdf' },
      { name: 'Code of Civil Procedure, 1908', abbreviation: 'CPC', effectiveDate: '1908-01-01', type: 'Central', description: 'Procedure for civil courts. Sections and Orders I–LI.', sectionsCount: 158, isBookmarked: true, pdfFile: 'CPC.pdf' },
      { name: 'Transfer of Property Act, 1882', abbreviation: 'TPA', effectiveDate: '1882-01-01', type: 'Central', description: 'Sale, mortgage, lease, exchange and gift of immovable property.', sectionsCount: 137, isBookmarked: true, pdfFile: 'TPA.pdf' },
      { name: 'Registration Act, 1908', abbreviation: 'RA', effectiveDate: '1908-01-01', type: 'Central', description: 'Registration of documents relating to immovable property.', sectionsCount: 91, isBookmarked: false, pdfFile: 'RA.pdf' },
      { name: 'Specific Relief Act, 1963', abbreviation: 'SRA', effectiveDate: '1963-01-01', type: 'Central', description: 'Specific performance, injunctions and declaratory decrees.', sectionsCount: 44, isBookmarked: true, pdfFile: 'SRA.pdf' },
      { name: 'A.P. Rights in Land and Pattadar Pass Books Act, 1971', abbreviation: 'ROR', effectiveDate: '1971-01-01', type: 'State — A.P.', description: 'Record of rights, pattadar pass books and title deeds.', sectionsCount: 19, isBookmarked: false, pdfFile: 'ROR.pdf' },
      { name: 'A.P. Land Grabbing (Prohibition) Act, 1982', abbreviation: 'APLG', effectiveDate: '1982-01-01', type: 'State — A.P.', description: 'Special courts and tribunal for land grabbing matters.', sectionsCount: 17, isBookmarked: false, pdfFile: 'APLG.pdf' }
    ]);
    console.log('Bare Acts seeded.');

    // 17. Seed Amendments (from frontend mock AMEND)
    const amendEffective = '2024-07-01';
    await Amendment.bulkCreate([
      // IPC → BNS
      { sourceAct: 'Indian Penal Code, 1860', targetAct: 'Bharatiya Nyaya Sanhita, 2023', oldSection: '302', oldTitle: 'Murder', newSection: '103', newTitle: 'Murder', effectiveDate: amendEffective },
      { sourceAct: 'Indian Penal Code, 1860', targetAct: 'Bharatiya Nyaya Sanhita, 2023', oldSection: '420', oldTitle: 'Cheating and dishonestly inducing delivery of property', newSection: '318(4)', newTitle: 'Cheating', effectiveDate: amendEffective },
      { sourceAct: 'Indian Penal Code, 1860', targetAct: 'Bharatiya Nyaya Sanhita, 2023', oldSection: '379', oldTitle: 'Theft', newSection: '303(2)', newTitle: 'Theft', effectiveDate: amendEffective },
      { sourceAct: 'Indian Penal Code, 1860', targetAct: 'Bharatiya Nyaya Sanhita, 2023', oldSection: '376', oldTitle: 'Rape', newSection: '64', newTitle: 'Rape', effectiveDate: amendEffective },
      { sourceAct: 'Indian Penal Code, 1860', targetAct: 'Bharatiya Nyaya Sanhita, 2023', oldSection: '499', oldTitle: 'Defamation', newSection: '356', newTitle: 'Defamation', effectiveDate: amendEffective },
      { sourceAct: 'Indian Penal Code, 1860', targetAct: 'Bharatiya Nyaya Sanhita, 2023', oldSection: '406', oldTitle: 'Criminal breach of trust', newSection: '316', newTitle: 'Criminal breach of trust', effectiveDate: amendEffective },
      { sourceAct: 'Indian Penal Code, 1860', targetAct: 'Bharatiya Nyaya Sanhita, 2023', oldSection: '506', oldTitle: 'Criminal intimidation', newSection: '351', newTitle: 'Criminal intimidation', effectiveDate: amendEffective },
      // CrPC → BNSS
      { sourceAct: 'Code of Criminal Procedure, 1973', targetAct: 'Bharatiya Nagarik Suraksha Sanhita, 2023', oldSection: '154', oldTitle: 'Information in cognizable cases (FIR)', newSection: '173', newTitle: 'Information in cognizable cases', effectiveDate: amendEffective },
      { sourceAct: 'Code of Criminal Procedure, 1973', targetAct: 'Bharatiya Nagarik Suraksha Sanhita, 2023', oldSection: '41', oldTitle: 'When police may arrest without warrant', newSection: '35', newTitle: 'When police may arrest without warrant', effectiveDate: amendEffective },
      { sourceAct: 'Code of Criminal Procedure, 1973', targetAct: 'Bharatiya Nagarik Suraksha Sanhita, 2023', oldSection: '161', oldTitle: 'Examination of witnesses by police', newSection: '180', newTitle: 'Examination of witnesses by police', effectiveDate: amendEffective },
      { sourceAct: 'Code of Criminal Procedure, 1973', targetAct: 'Bharatiya Nagarik Suraksha Sanhita, 2023', oldSection: '125', oldTitle: 'Maintenance of wives, children and parents', newSection: '144', newTitle: 'Maintenance of wives, children and parents', effectiveDate: amendEffective },
      { sourceAct: 'Code of Criminal Procedure, 1973', targetAct: 'Bharatiya Nagarik Suraksha Sanhita, 2023', oldSection: '438', oldTitle: 'Anticipatory bail', newSection: '482', newTitle: 'Anticipatory bail', effectiveDate: amendEffective },
      // Evidence Act → BSA
      { sourceAct: 'Indian Evidence Act, 1872', targetAct: 'Bharatiya Sakshya Adhiniyam, 2023', oldSection: '3', oldTitle: 'Interpretation clause', newSection: '2', newTitle: 'Definitions', effectiveDate: amendEffective },
      { sourceAct: 'Indian Evidence Act, 1872', targetAct: 'Bharatiya Sakshya Adhiniyam, 2023', oldSection: '65B', oldTitle: 'Admissibility of electronic records', newSection: '63', newTitle: 'Admissibility of electronic records', effectiveDate: amendEffective },
      { sourceAct: 'Indian Evidence Act, 1872', targetAct: 'Bharatiya Sakshya Adhiniyam, 2023', oldSection: '45', oldTitle: 'Opinion of experts', newSection: '39', newTitle: 'Opinion of experts', effectiveDate: amendEffective },
      { sourceAct: 'Indian Evidence Act, 1872', targetAct: 'Bharatiya Sakshya Adhiniyam, 2023', oldSection: '32', oldTitle: 'Statement of person who cannot be called as witness', newSection: '26', newTitle: 'Statement of person who cannot be called', effectiveDate: amendEffective }
    ]);
    console.log('Amendments seeded.');

    console.log('Database setup complete!');

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await sequelize.close();
  }
}

setup();
