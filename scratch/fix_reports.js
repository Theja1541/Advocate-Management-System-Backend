const fs = require('fs');

let content = fs.readFileSync('src/features/reports/reportService.js', 'utf8');

content = content.replace(/const \{ QueryTypes \} = require\('sequelize'\);/, 'const { QueryTypes } = require(\'sequelize\');\nconst { tenantContext } = require(\'../../config/database\');');

content = content.replace(/const getFilterCond = \(options = \{\}, colMap = \{\}\) => \{[\s\S]*?return \{ clause: '1=1', reps: \{\} \};\n\};/, `const getFilterCond = (options = {}, colMap = {}) => {
  const store = tenantContext.getStore() || {};
  const tenantId = store.tenantId;
  const c = typeof colMap === 'string' ? { date: colMap, month: colMap, year: colMap } : colMap;
  const defaultCol = c.date || c.month || c.year || 'created_at';
  const dotIndex = defaultCol.indexOf('.');
  const prefix = dotIndex > -1 ? defaultCol.substring(0, dotIndex + 1) : '';
  const tClause = tenantId ? \`\${prefix}tenant_id = :tenantId AND \` : '';
  const repsBase = tenantId ? { tenantId } : {};

  if (options.date) return { clause: \`\${tClause}DATE(\${c.date || 'created_at'}) = :fDate\`, reps: { ...repsBase, fDate: options.date } };
  if (options.year && options.month) {
    const ms = \`\${options.year}-\${String(options.month).padStart(2, '0')}\`;
    return { clause: \`\${tClause}DATE_FORMAT(\${c.month || 'created_at'}, '%Y-%m') = :fMonth\`, reps: { ...repsBase, fMonth: ms } };
  }
  if (options.year) return { clause: \`\${tClause}YEAR(\${c.year || 'created_at'}) = :fYear\`, reps: { ...repsBase, fYear: options.year } };
  return { clause: tenantId ? \`\${prefix}tenant_id = :tenantId\` : '1=1', reps: repsBase };
};`);

content = content.replace(/WHERE d\.transaction_date = :reportDate/g, 'WHERE ${tenantId ? \'d.tenant_id = :tenantId AND \' : \'\'}d.transaction_date = :reportDate');
content = content.replace(/WHERE c\.next_hearing = :reportDate/g, 'WHERE ${tenantId ? \'c.tenant_id = :tenantId AND \' : \'\'}c.next_hearing = :reportDate');
content = content.replace(/WHERE cd\.hearing_date = :reportDate/g, 'WHERE ${tenantId ? \'cd.tenant_id = :tenantId AND \' : \'\'}cd.hearing_date = :reportDate');

content = content.replace(/const reportDate = date \|\| new Date\(\)\.toISOString\(\)\.slice\(0, 10\);/g, 'const reportDate = date || new Date().toISOString().slice(0, 10);\n  const store = tenantContext.getStore() || {};\n  const tenantId = store.tenantId;');
content = content.replace(/\{ replacements: \{ reportDate \}/g, '{ replacements: { reportDate, tenantId }');

content = content.replace(/const monthStart = \`\$\{reportYear\}-\$\{String\(reportMonth\)\.padStart\(2, '0'\)\}-01\`;/g, 'const monthStart = `${reportYear}-${String(reportMonth).padStart(2, \'0\')}-01`;\n  const store = tenantContext.getStore() || {};\n  const tenantId = store.tenantId;\n  const tClause = tenantId ? \'tenant_id = :tenantId\' : \'1=1\';\n  const tClauseAnd = tenantId ? \'tenant_id = :tenantId AND \' : \'\';');
content = content.replace(/FROM cases\n    \`/g, 'FROM cases\n    WHERE ${tClause}\n    `');
content = content.replace(/WHERE \$\{payWhere\}/g, 'WHERE ${tClauseAnd}${payWhere}');
content = content.replace(/WHERE \$\{diaryWhere\}/g, 'WHERE ${tClauseAnd}${diaryWhere}');
content = content.replace(/\{ replacements: \{ monthStart \}/g, '{ replacements: { monthStart, tenantId }');

fs.writeFileSync('src/features/reports/reportService.js', content);
console.log('Fixed reportService.js');
