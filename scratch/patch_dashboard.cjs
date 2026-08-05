const fs = require('fs');
let content = fs.readFileSync('src/features/dashboard/dashboardService.js', 'utf8');

content = content.replace(
  "require('../associations');",
  "require('../associations');\nconst { tenantContext } = require('../../config/database');"
);

const searchStr = `  const duePaymentAmountResult = await Payment.sum('amount_outstanding', {
    where: { amountOutstanding: { [Op.gt]: 0 } },`;

const replaceStr = `  const store = tenantContext.getStore();
  const paymentWhere = { amountOutstanding: { [Op.gt]: 0 } };
  if (store && store.tenantId) {
    paymentWhere.tenantId = store.tenantId;
  }

  const duePaymentAmountResult = await Payment.sum('amount_outstanding', {
    where: paymentWhere,`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync('src/features/dashboard/dashboardService.js', content);
  console.log('dashboardService patched successfully!');
} else {
  console.log('Search string not found, trying regex fallback');
  const fallbackSearch = /const duePaymentAmountResult = await Payment\.sum\('amount_outstanding', {\s*where: { amountOutstanding: { \[Op\.gt\]: 0 } },/;
  content = content.replace(fallbackSearch, replaceStr);
  fs.writeFileSync('src/features/dashboard/dashboardService.js', content);
  console.log('dashboardService patched with regex!');
}
