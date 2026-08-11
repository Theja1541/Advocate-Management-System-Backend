const app = require('../src/app');
const http = require('http');
const { sequelize } = require('../src/config/database');

async function runTests() {
  console.log('--- STARTING TITLE SEARCH API INTEGRATION TESTS ---');

  // 1. Start express server on a dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  console.log(`Test server listening on ${baseUrl}`);

  // Fetch helper
  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const status = res.status;
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      // no json response
    }
    return { status, body, headers: res.headers };
  }

  try {
    // 2. Login as Admin to get token/cookies
    console.log('\n[TEST 1] Logging in as admin...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@legaldesk.in',
        password: 'password',
      }),
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    }

    const token = loginRes.body.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
    };
    console.log('Login successful. Auth token received.');

    // Get client / land details from DB to use valid ids
    const firstLand = await sequelize.query('SELECT id, tenant_id FROM lands LIMIT 1', {
      type: sequelize.QueryTypes.SELECT,
    });
    if (!firstLand || firstLand.length === 0) {
      throw new Error('No lands seeded in DB to test with. Run seed first.');
    }
    const validLandId = firstLand[0].id;
    const adminTenantId = firstLand[0].tenant_id;
    console.log(`Using valid land_id: ${validLandId} and tenant_id: ${adminTenantId}`);

    // Get conducted_by user ID (Admin user)
    const adminUser = await sequelize.query('SELECT id FROM users WHERE email="admin@legaldesk.in"', {
      type: sequelize.QueryTypes.SELECT,
    });
    const validConductedBy = adminUser[0].id;

    // 3. Test validation errors on Create
    console.log('\n[TEST 2] Verifying validation errors (empty payload)...');
    const emptyCreateRes = await request('/title-searches', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({}),
    });
    console.log(`Status: ${emptyCreateRes.status}`);
    console.log(`Errors:`, emptyCreateRes.body?.errors || emptyCreateRes.body);
    if (emptyCreateRes.status !== 400) {
      throw new Error('Expected 400 Bad Request for empty payload');
    }

    // 4. Test invalid land_id rejection
    console.log('\n[TEST 3] Verifying invalid land_id rejection...');
    const invalidLandRes = await request('/title-searches', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        landId: 9999999, // non-existent
        searchDate: '2026-08-11',
        periodFrom: '2020-01-01',
        periodTo: '2025-12-31',
        ecStatus: 'clear',
        conductedBy: validConductedBy,
      }),
    });
    console.log(`Status: ${invalidLandRes.status}`);
    console.log(`Message: ${invalidLandRes.body?.message}`);
    if (invalidLandRes.status !== 400 || !invalidLandRes.body?.message?.includes('Land record not found')) {
      throw new Error('Expected 400 with Land record not found message');
    }

    // 5. Test invalid conducted_by rejection
    console.log('\n[TEST 4] Verifying invalid conducted_by rejection...');
    const invalidUserRes = await request('/title-searches', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        landId: validLandId,
        searchDate: '2026-08-11',
        periodFrom: '2020-01-01',
        periodTo: '2025-12-31',
        ecStatus: 'clear',
        conductedBy: 9999999, // non-existent
      }),
    });
    console.log(`Status: ${invalidUserRes.status}`);
    console.log(`Message: ${invalidUserRes.body?.message}`);
    if (invalidUserRes.status !== 400 || !invalidUserRes.body?.message?.includes('Conducted by user not found')) {
      throw new Error('Expected 400 with Conducted by user not found message');
    }

    // 6. Test successful creation
    console.log('\n[TEST 5] Creating a valid Title Search record...');
    const createPayload = {
      landId: validLandId,
      searchDate: '2026-08-11',
      periodFrom: '2020-01-01',
      periodTo: '2025-12-31',
      ecStatus: 'clear',
      ecReferenceNo: 'EC-123456',
      revenueRecordsVerified: true,
      registrationRecordsVerified: true,
      litigationChecked: false,
      documentsVerified: true,
      remarks: 'Validated against revenue ledger records',
      conductedBy: validConductedBy,
    };
    const createRes = await request('/title-searches', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify(createPayload),
    });
    console.log(`Status: ${createRes.status}`);
    if (createRes.status !== 201) {
      throw new Error(`Create failed: ${JSON.stringify(createRes.body)}`);
    }
    const createdSearch = createRes.body.data.titleSearch;
    console.log(`Created Title Search record ID: ${createdSearch.id}`);

    // 7. Verify List and Get by ID
    console.log('\n[TEST 6] Verifying list and find by ID...');
    const listRes = await request('/title-searches', {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`List status: ${listRes.status}`);
    const foundInList = listRes.body.data.titleSearches.some((s) => s.id === createdSearch.id);
    if (!foundInList) {
      throw new Error('Created search was not found in the list');
    }
    console.log('Found created search in the list.');

    const getRes = await request(`/title-searches/${createdSearch.id}`, {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`Get by ID status: ${getRes.status}`);
    if (getRes.status !== 200) {
      throw new Error('Get by ID failed');
    }
    console.log(`Land survey loaded: Sy. ${getRes.body.data.titleSearch.land?.surveyNo}`);
    console.log(`Conducted by name: ${getRes.body.data.titleSearch.conductedByUser?.name}`);

    // 8. Verify Update
    console.log('\n[TEST 7] Verifying update...');
    const updatePayload = {
      remarks: 'Updated remarks via integration test',
      litigationChecked: true,
    };
    const updateRes = await request(`/title-searches/${createdSearch.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify(updatePayload),
    });
    console.log(`Update status: ${updateRes.status}`);
    if (updateRes.status !== 200 || updateRes.body.data.titleSearch.remarks !== 'Updated remarks via integration test') {
      throw new Error('Update failed or remarks not updated');
    }
    console.log('Update verified successfully.');

    // 9. Verify Delete
    console.log('\n[TEST 8] Verifying delete...');
    const deleteRes = await request(`/title-searches/${createdSearch.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`Delete status: ${deleteRes.status}`);
    if (deleteRes.status !== 204) {
      throw new Error('Delete returned non-204 status');
    }

    const checkDeletedRes = await request(`/title-searches/${createdSearch.id}`, {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`Verify delete status (expected 404): ${checkDeletedRes.status}`);
    if (checkDeletedRes.status !== 404) {
      throw new Error('Expected 404 Not Found after deletion');
    }
    console.log('Delete verified successfully.');

    console.log('\n--- ALL TITLE SEARCH API TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n!!! TEST FAILURE FAILURE !!!');
    console.error(error);
    process.exitCode = 1;
  } finally {
    server.close();
  }
}

runTests();
