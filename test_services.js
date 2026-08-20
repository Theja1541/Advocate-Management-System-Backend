const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { sequelize } = require('./src/config/database');
const paymentService = require('./src/features/payments/paymentService');
const daybookService = require('./src/features/daybook/daybookService');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');

    const mockSuperAdmin = {
      id: 1,
      role: 'Super Admin',
      rawRole: 'Super Admin',
      tenantId: null
    };

    console.log('Testing daybookService...');
    const daybookEntries = await daybookService.getAllEntries(mockSuperAdmin, 1);
    console.log('Daybook entries:', daybookEntries.length);

    console.log('Testing paymentService...');
    const payments = await paymentService.getAllPayments(mockSuperAdmin, 1);
    console.log('Payments:', payments.length);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await sequelize.close();
  }
}

test();
