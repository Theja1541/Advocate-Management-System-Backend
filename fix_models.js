const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'src', 'features');

const fixes = [
  {
    file: 'clients/Client.js',
    replacements: [
      { from: /unique:\s*true,\s*field:\s*'client_code'/g, to: `field: 'client_code'` },
      { from: /\{\s*unique:\s*true,\s*fields:\s*\['client_code'\]\s*\}/g, to: `{ unique: true, fields: ['tenant_id', 'client_code'] }` }
    ]
  },
  {
    file: 'daybook/Daybook.js',
    replacements: [
      { from: /unique:\s*true,\s*field:\s*'daybook_code'/g, to: `field: 'daybook_code'` },
      { from: /\{\s*unique:\s*true,\s*fields:\s*\['daybook_code'\]\s*\}/g, to: `{ unique: true, fields: ['tenant_id', 'daybook_code'] }` }
    ]
  },
  {
    file: 'documents/Document.js',
    replacements: [
      { from: /unique:\s*true,\s*field:\s*'document_code'/g, to: `field: 'document_code'` },
      { from: /\{\s*unique:\s*true,\s*fields:\s*\['document_code'\]\s*\}/g, to: `{ unique: true, fields: ['tenant_id', 'document_code'] }` }
    ]
  },
  {
    file: 'memberships/Membership.js',
    replacements: [
      { from: /unique:\s*true,\s*field:\s*'membership_id'/g, to: `field: 'membership_id'` },
      { from: /\{\s*unique:\s*true,\s*fields:\s*\['membership_id'\]\s*\}/g, to: `{ unique: true, fields: ['tenant_id', 'membership_id'] }` }
    ]
  },
  {
    file: 'opinions/Opinion.js',
    replacements: [
      { from: /unique:\s*true,\s*field:\s*'reference_no'/g, to: `field: 'reference_no'` },
      { from: /\{\s*unique:\s*true,\s*fields:\s*\['reference_no'\]\s*\}/g, to: `{ unique: true, fields: ['tenant_id', 'reference_no'] }` }
    ]
  },
  {
    file: 'payments/Payment.js',
    replacements: [
      { from: /unique:\s*true,\s*field:\s*'receipt_no'/g, to: `field: 'receipt_no'` },
      { from: /unique:\s*true,\s*field:\s*'transaction_id'/g, to: `field: 'transaction_id'` },
      { from: /\{\s*unique:\s*true,\s*fields:\s*\['receipt_no'\]\s*\}/g, to: `{ unique: true, fields: ['tenant_id', 'receipt_no'] }` },
      { from: /\{\s*unique:\s*true,\s*fields:\s*\['transaction_id'\]\s*\}/g, to: `{ unique: true, fields: ['tenant_id', 'transaction_id'] }` }
    ]
  },
  {
    file: 'refs/Reference.js',
    replacements: [
      { from: /unique:\s*true,\s*field:\s*'reference_no'/g, to: `field: 'reference_no'` },
      { from: /\{\s*unique:\s*true,\s*fields:\s*\['reference_no'\]\s*\}/g, to: `{ unique: true, fields: ['tenant_id', 'reference_no'] }` }
    ]
  }
];

fixes.forEach(fix => {
  const filePath = path.join(basePath, fix.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    fix.replacements.forEach(rep => {
      content = content.replace(rep.from, rep.to);
    });
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${fix.file}`);
  } else {
    console.log(`File not found: ${fix.file}`);
  }
});
