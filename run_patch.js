const fs = require('fs');

const path = 'd:/THEJA/ADVOCATE MANAGEMENT SYSTEM/Backend/src/features/reports/reportService.js';
let content = fs.readFileSync(path, 'utf8');

const filterHelper = `
const getFilterCond = (options = {}, colMap = {}) => {
  const c = typeof colMap === 'string' ? { date: colMap, month: colMap, year: colMap } : colMap;
  if (options.date) return { clause: \`DATE(\${c.date || 'created_at'}) = :fDate\`, reps: { fDate: options.date } };
  if (options.year && options.month) {
    const ms = \`\${options.year}-\${String(options.month).padStart(2, '0')}\`;
    return { clause: \`DATE_FORMAT(\${c.month || 'created_at'}, '%Y-%m') = :fMonth\`, reps: { fMonth: ms } };
  }
  if (options.year) return { clause: \`YEAR(\${c.year || 'created_at'}) = :fYear\`, reps: { fYear: options.year } };
  return { clause: '1=1', reps: {} };
};
`;

if (!content.includes('getFilterCond')) {
  content = content.replace('const toNumber = (value) => Number(value || 0);', 'const toNumber = (value) => Number(value || 0);\n' + filterHelper);
}

// 1. Case Report
content = content.replace(/const getCaseReport = async \(\) => \{/g, 'const getCaseReport = async (options = {}) => {\n  const fc = getFilterCond(options, "c.created_at");');
content = content.replace(/LEFT JOIN case_stages cs ON cs\.id = c\.case_stage_id\s*ORDER BY c\.court ASC/g, 'LEFT JOIN case_stages cs ON cs.id = c.case_stage_id\n    WHERE ${fc.clause}\n    ORDER BY c.court ASC');
content = content.replace(/FROM cases\s*GROUP BY COALESCE\(court, 'Unassigned'\)/g, 'FROM cases c\n    WHERE ${fc.clause}\n    GROUP BY COALESCE(c.court, "Unassigned")');
// Fix replacements for case report
content = content.replace(/\{ type: QueryTypes\.SELECT \}/g, '{ replacements: typeof fc !== "undefined" ? fc.reps : typeof fcC !== "undefined" ? { ...fcC.reps, ...fcP.reps } : {}, type: QueryTypes.SELECT }');

// 2. Advocate Report
content = content.replace(/const getAdvocateReport = async \(\) => \{/g, 'const getAdvocateReport = async (options = {}) => {\n  const fcC = getFilterCond(options, "created_at");\n  const fcP = getFilterCond(options, "transaction_date");');
content = content.replace(/FROM cases\s*GROUP BY advocate_id/g, 'FROM cases\n      WHERE ${fcC.clause}\n      GROUP BY advocate_id');
content = content.replace(/WHERE party_type = 'Advocate'/g, 'WHERE party_type = \\\'Advocate\\\'\n      AND ${fcP.clause}');
content = content.replace(/WHERE p\.party_type = 'Client'/g, 'WHERE p.party_type = \\\'Client\\\'\n      AND ${fcP.clause}');

// 3. Client Report
content = content.replace(/const getClientReport = async \(\) => \{/g, 'const getClientReport = async (options = {}) => {\n  const fcC = getFilterCond(options, "created_at");\n  const fcP = getFilterCond(options, "transaction_date");');
content = content.replace(/FROM cases\s*GROUP BY client_id/g, 'FROM cases\n      WHERE ${fcC.clause}\n      GROUP BY client_id');
content = content.replace(/INNER JOIN cases c ON c\.id = d\.case_id\s*GROUP BY c\.client_id/g, 'INNER JOIN cases c ON c.id = d.case_id\n      WHERE ${fcC.clause}\n      GROUP BY c.client_id');

// 4. Payment Report
content = content.replace(/const getPaymentReport = async \(\) => \{/g, 'const getPaymentReport = async (options = {}) => {\n  const fc = getFilterCond(options, "p.transaction_date");');
content = content.replace(/LEFT JOIN advocates adv ON adv\.id = c\.advocate_id\s*ORDER BY p\.transaction_date DESC/g, 'LEFT JOIN advocates adv ON adv.id = c.advocate_id\n    WHERE ${fc.clause}\n    ORDER BY p.transaction_date DESC');
content = content.replace(/FROM payments\s*`,/g, 'FROM payments\n    WHERE ${fc.clause}\n    `,');

// 5. Membership Report
content = content.replace(/const getMembershipReport = async \(\) => \{/g, 'const getMembershipReport = async (options = {}) => {\n  const fc = getFilterCond(options, "m.start_date");');
content = content.replace(/LEFT JOIN advocates a ON a\.id = m\.advocate_id\s*ORDER BY m\.expiry_date ASC/g, 'LEFT JOIN advocates a ON a.id = m.advocate_id\n    WHERE ${fc.clause}\n    ORDER BY m.expiry_date ASC');
content = content.replace(/FROM memberships\s*GROUP BY status/g, 'FROM memberships m\n    WHERE ${fc.clause.replace(/m\\./g, "")}\n    GROUP BY status');

// 6. State-wise Report
content = content.replace(/const getStateWiseReport = async \(\) => \{/g, 'const getStateWiseReport = async (options = {}) => {\n  const fcC = getFilterCond(options, "c.created_at");\n  const fcP = getFilterCond(options, "transaction_date");');
content = content.replace(/LEFT JOIN lands l ON l\.case_id = c\.id\s*GROUP BY c\.id, c\.client_id, c\.title/g, 'LEFT JOIN lands l ON l.case_id = c.id\n      WHERE ${fcC.clause}\n      GROUP BY c.id, c.client_id, c.title');
content = content.replace(/FROM payments\s*GROUP BY case_id/g, 'FROM payments\n      WHERE ${fcP.clause}\n      GROUP BY case_id');
content = content.replace(/FROM cases c\s*LEFT JOIN \(/g, 'FROM cases c\n    LEFT JOIN ('); 
content = content.replace(/\) pay ON pay\.case_id = c\.id\s*`/g, ') pay ON pay.case_id = c.id\n    WHERE ${fcC.clause}\n    `');

// 7. Monthly Report
const oldMonthlyStart = `const getMonthlyReport = async ({ month, year } = {}) => {
  const now = new Date();
  const reportYear = Number(year) || now.getFullYear();
  const reportMonth = Number(month) || now.getMonth() + 1;
  const monthStart = \`\${reportYear}-\${String(reportMonth).padStart(2, '0')}-01\`;`;

const newMonthlyStart = `const getMonthlyReport = async (options = {}) => {
  const now = new Date();
  let reportYear = now.getFullYear();
  let reportMonth = null;
  let isAllMonths = false;
  let isAllTime = false;
  let monthStart = null;

  if (options.date) {
    const d = new Date(options.date);
    if (!isNaN(d.getTime())) {
      reportYear = d.getFullYear();
      reportMonth = d.getMonth() + 1;
    }
  } else if (options.month && options.year) {
    reportYear = Number(options.year);
    reportMonth = Number(options.month);
  } else if (options.year) {
    reportYear = Number(options.year);
    isAllMonths = true;
  } else {
    isAllTime = true;
  }

  if (reportMonth) {
    monthStart = \`\${reportYear}-\${String(reportMonth).padStart(2, '0')}-01\`;
  }

  let caseWhere = "1=1";
  let payWhere = "1=1";
  let dayWhere = "1=1";
  let diaryWhere = "1=1";

  if (!isAllTime) {
    if (isAllMonths) {
      caseWhere = "YEAR(created_at) = :reportYear";
      payWhere = "YEAR(transaction_date) = :reportYear";
      dayWhere = "YEAR(transaction_date) = :reportYear";
      diaryWhere = "YEAR(hearing_date) = :reportYear";
    } else {
      caseWhere = "DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(:monthStart, '%Y-%m')";
      payWhere = "DATE_FORMAT(transaction_date, '%Y-%m') = DATE_FORMAT(:monthStart, '%Y-%m')";
      dayWhere = "DATE_FORMAT(transaction_date, '%Y-%m') = DATE_FORMAT(:monthStart, '%Y-%m')";
      diaryWhere = "DATE_FORMAT(hearing_date, '%Y-%m') = DATE_FORMAT(:monthStart, '%Y-%m')";
    }
  }`;
content = content.replace(oldMonthlyStart, newMonthlyStart);
content = content.replace(/SUM\(CASE WHEN DATE_FORMAT\(created_at, '%Y-%m'\) = DATE_FORMAT\(:monthStart, '%Y-%m'\) THEN 1 ELSE 0 END\) AS openedThisMonth/g, 'SUM(CASE WHEN ${caseWhere} THEN 1 ELSE 0 END) AS openedThisMonth');
content = content.replace(/WHERE DATE_FORMAT\(transaction_date, '%Y-%m'\) = DATE_FORMAT\(:monthStart, '%Y-%m'\)/g, 'WHERE ${payWhere}');
content = content.replace(/WHERE DATE_FORMAT\(hearing_date, '%Y-%m'\) = DATE_FORMAT\(:monthStart, '%Y-%m'\)/g, 'WHERE ${diaryWhere}');
// The daybook one matches payWhere's regex. So let's make sure it's correct. 
// Since we globally replaced it above, both got replaced with `WHERE ${payWhere}`. 
// For daybook, payWhere is fine since it evaluates to the same string!
// Let's replace `const [daybookStats]` query to fix the variable if needed:
// actually ${payWhere} is the same as ${dayWhere}, so it's perfectly fine.

// 8. Daily Report
const oldDaily = `const getDailyReport = async ({ date } = {}) => {
  const reportDate = date || new Date().toISOString().slice(0, 10);`;
const newDaily = `const getDailyReport = async (options = {}) => {
  let reportDate = options.date;
  if (!reportDate) {
    if (options.year && options.month) {
      reportDate = \`\${options.year}-\${String(options.month).padStart(2, '0')}-01\`;
    } else if (options.year) {
      reportDate = \`\${options.year}-01-01\`;
    } else {
      reportDate = new Date().toISOString().slice(0, 10);
    }
  }`;
content = content.replace(oldDaily, newDaily);


fs.writeFileSync('d:/THEJA/ADVOCATE MANAGEMENT SYSTEM/Backend/patch_report.js', content, 'utf8');
console.log('Script ran successfully');
