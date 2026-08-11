const app = require('../src/app');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { sequelize } = require('../src/config/database');

async function runTests() {
  console.log('--- STARTING LAND-DOCUMENT API INTEGRATION TESTS ---');

  // 1. Start express server on a dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  console.log(`Test server listening on ${baseUrl}`);

  // Fetch helper
  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = { ...options.headers };
    // If not FormData, default content-type to json
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, {
      ...options,
      headers,
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

  const createdDocIds = [];

  try {
    // 2. Login as Admin
    console.log('\n[TEST 1] Logging in as admin...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'admin@legaldesk.in',
        password: 'password',
      }),
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }

    const token = loginRes.body.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
    };
    console.log('Logged in successfully.');

    // Retrieve database records to test with
    const firstCase = await sequelize.query('SELECT id, tenant_id FROM cases LIMIT 1', {
      type: sequelize.QueryTypes.SELECT,
    });
    const firstLand = await sequelize.query('SELECT id, tenant_id FROM lands LIMIT 1', {
      type: sequelize.QueryTypes.SELECT,
    });
    const firstCategory = await sequelize.query('SELECT id FROM document_categories WHERE is_active=1 LIMIT 1', {
      type: sequelize.QueryTypes.SELECT,
    });

    if (!firstCase.length || !firstLand.length || !firstCategory.length) {
      throw new Error('Database is missing cases, lands, or active document categories. Run seeders first.');
    }

    const validCaseId = firstCase[0].id;
    const validLandId = firstLand[0].id;
    const validCategoryId = firstCategory[0].id;
    const adminTenantId = firstCase[0].tenant_id;

    console.log(`Using valid Case ID: ${validCaseId}, Land ID: ${validLandId}, Category ID: ${validCategoryId}`);

    // Create a dummy text file blob
    const createTestFileBlob = (content = 'Hello integration test') => {
      return new Blob([content], { type: 'text/plain' });
    };

    // 3. Test existing case-only document creation
    console.log('\n[TEST 2] Verifying case-only document creation...');
    const caseOnlyForm = new FormData();
    caseOnlyForm.append('name', 'Case Only Doc Test');
    caseOnlyForm.append('documentCategoryId', String(validCategoryId));
    caseOnlyForm.append('caseId', String(validCaseId));
    caseOnlyForm.append('file', createTestFileBlob('Extractable text content for testing text extraction.'), 'test_case_only.txt');

    const caseOnlyRes = await request('/documents', {
      method: 'POST',
      headers: authHeaders,
      body: caseOnlyForm,
    });

    console.log(`Status: ${caseOnlyRes.status}`);
    if (caseOnlyRes.status !== 201) {
      throw new Error(`Expected 201, got ${caseOnlyRes.status}: ${JSON.stringify(caseOnlyRes.body)}`);
    }
    const caseOnlyDoc = caseOnlyRes.body.data.document;
    createdDocIds.push(caseOnlyDoc.id);
    console.log(`Document created: ID ${caseOnlyDoc.id}, Code ${caseOnlyDoc.documentCode}`);

    // 4. Test land-only document creation
    console.log('\n[TEST 3] Verifying land-only document creation...');
    const landOnlyForm = new FormData();
    landOnlyForm.append('name', 'Land Only Doc Test');
    landOnlyForm.append('documentCategoryId', String(validCategoryId));
    landOnlyForm.append('landId', String(validLandId));
    landOnlyForm.append('file', createTestFileBlob('Land properties link deed description.'), 'test_land_only.txt');

    const landOnlyRes = await request('/documents', {
      method: 'POST',
      headers: authHeaders,
      body: landOnlyForm,
    });

    console.log(`Status: ${landOnlyRes.status}`);
    if (landOnlyRes.status !== 201) {
      throw new Error(`Expected 201, got ${landOnlyRes.status}: ${JSON.stringify(landOnlyRes.body)}`);
    }
    const landOnlyDoc = landOnlyRes.body.data.document;
    createdDocIds.push(landOnlyDoc.id);
    console.log(`Document created: ID ${landOnlyDoc.id}, Code ${landOnlyDoc.documentCode}`);

    // 5. Test case + land document creation
    console.log('\n[TEST 4] Verifying case + land document creation...');
    const caseLandForm = new FormData();
    caseLandForm.append('name', 'Case and Land Doc Test');
    caseLandForm.append('documentCategoryId', String(validCategoryId));
    caseLandForm.append('caseId', String(validCaseId));
    caseLandForm.append('landId', String(validLandId));
    caseLandForm.append('file', createTestFileBlob('Dual association document.'), 'test_case_land.txt');

    const caseLandRes = await request('/documents', {
      method: 'POST',
      headers: authHeaders,
      body: caseLandForm,
    });

    console.log(`Status: ${caseLandRes.status}`);
    if (caseLandRes.status !== 201) {
      throw new Error(`Expected 201, got ${caseLandRes.status}`);
    }
    const caseLandDoc = caseLandRes.body.data.document;
    createdDocIds.push(caseLandDoc.id);
    console.log(`Document created: ID ${caseLandDoc.id}`);

    // 6. Test rejection of neither caseId nor landId
    console.log('\n[TEST 5] Verifying rejection of neither caseId nor landId...');
    const neitherForm = new FormData();
    neitherForm.append('name', 'Invalid Doc Test');
    neitherForm.append('documentCategoryId', String(validCategoryId));
    neitherForm.append('file', createTestFileBlob('Invalid'), 'test_invalid.txt');

    const neitherRes = await request('/documents', {
      method: 'POST',
      headers: authHeaders,
      body: neitherForm,
    });

    console.log(`Status: ${neitherRes.status}`);
    console.log(`Errors:`, neitherRes.body?.errors || neitherRes.body);
    if (neitherRes.status !== 400) {
      throw new Error('Expected 400 Bad Request');
    }

    // 7. Test invalid landId rejection
    console.log('\n[TEST 6] Verifying invalid landId rejection...');
    const invalidLandForm = new FormData();
    invalidLandForm.append('name', 'Invalid Land Doc');
    invalidLandForm.append('documentCategoryId', String(validCategoryId));
    invalidLandForm.append('landId', '9999999');
    invalidLandForm.append('file', createTestFileBlob('Invalid land'), 'test_invalid_land.txt');

    const invalidLandRes = await request('/documents', {
      method: 'POST',
      headers: authHeaders,
      body: invalidLandForm,
    });

    console.log(`Status: ${invalidLandRes.status}`);
    console.log(`Message: ${invalidLandRes.body?.message}`);
    if (invalidLandRes.status !== 400 || !invalidLandRes.body?.message?.includes('Land record not found')) {
      throw new Error('Expected 400 with Land record not found message');
    }

    // 8. Test invalid caseId rejection
    console.log('\n[TEST 7] Verifying invalid caseId rejection...');
    const invalidCaseForm = new FormData();
    invalidCaseForm.append('name', 'Invalid Case Doc');
    invalidCaseForm.append('documentCategoryId', String(validCategoryId));
    invalidCaseForm.append('caseId', '9999999');
    invalidCaseForm.append('file', createTestFileBlob('Invalid case'), 'test_invalid_case.txt');

    const invalidCaseRes = await request('/documents', {
      method: 'POST',
      headers: authHeaders,
      body: invalidCaseForm,
    });

    console.log(`Status: ${invalidCaseRes.status}`);
    console.log(`Message: ${invalidCaseRes.body?.message}`);
    if (invalidCaseRes.status !== 400 || !invalidCaseRes.body?.message?.includes('Case not found')) {
      throw new Error('Expected 400 with Case not found message');
    }

    // 9. Test cross-tenant case/land references rejection
    console.log('\n[TEST 8] Verifying cross-tenant verification rejection...');
    // Create a client, case, and land for tenant ID 999 to test cross-tenant validation
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.query('INSERT INTO clients (id, tenant_id, name, client_code, mobile, created_at, updated_at) VALUES (999, 999, "Cross Tenant Client", "CT-001", "123", NOW(), NOW()) ON DUPLICATE KEY UPDATE name="Cross Tenant Client"');
    await sequelize.query('INSERT INTO cases (id, tenant_id, client_id, case_no, title, created_at, updated_at) VALUES (999, 999, 999, "CT-CASE-999", "Cross Tenant Title", NOW(), NOW()) ON DUPLICATE KEY UPDATE title="Cross Tenant Title"');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    const crossTenantForm = new FormData();
    crossTenantForm.append('name', 'Cross Tenant Case Doc');
    crossTenantForm.append('documentCategoryId', String(validCategoryId));
    crossTenantForm.append('caseId', '999'); // belongs to tenant 999
    crossTenantForm.append('file', createTestFileBlob('Cross tenant test'), 'test_cross.txt');

    const crossTenantRes = await request('/documents', {
      method: 'POST',
      headers: authHeaders,
      body: crossTenantForm,
    });

    console.log(`Status: ${crossTenantRes.status}`);
    console.log(`Message: ${crossTenantRes.body?.message}`);
    if (crossTenantRes.status !== 403 || !crossTenantRes.body?.message?.includes('Case does not belong to your tenant')) {
      throw new Error('Expected 403 Access Denied for cross-tenant reference');
    }

    // Clean up cross-tenant test entities
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await sequelize.query('DELETE FROM cases WHERE id=999');
    await sequelize.query('DELETE FROM clients WHERE id=999');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 10. Verify List, Get, and Text Extraction content
    console.log('\n[TEST 9] Verifying retrieval and text extraction...');
    const listRes = await request('/documents', {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`List status: ${listRes.status}`);
    const foundCaseOnly = listRes.body.data.documents.some((d) => d.id === caseOnlyDoc.id);
    const foundLandOnly = listRes.body.data.documents.some((d) => d.id === landOnlyDoc.id);
    if (!foundCaseOnly || !foundLandOnly) {
      throw new Error('Uploaded documents were not returned in tenant document list');
    }

    const textContentRes = await request(`/documents/${caseOnlyDoc.id}/text`, {
      method: 'GET',
      headers: authHeaders,
    });
    console.log(`Text content retrieval status: ${textContentRes.status}`);
    console.log(`Extracted text preview: "${textContentRes.body.data.content?.text}"`);
    if (!textContentRes.body.data.content?.text?.includes('Extractable text content')) {
      throw new Error('Text extraction failed or search content was not returned');
    }
    console.log('Text extraction verified successfully.');

    console.log('\n--- ALL LAND-DOCUMENT INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n!!! TEST FAILURE !!!');
    console.error(error);
    process.exitCode = 1;
  } finally {
    // 11. Cleanup
    console.log('\nCleaning up created test documents...');
    for (const docId of createdDocIds) {
      const doc = await sequelize.query(`SELECT file_path FROM documents WHERE id=${docId}`, {
        type: sequelize.QueryTypes.SELECT,
      });
      if (doc.length && doc[0].file_path) {
        const fullPath = path.resolve(doc[0].file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file: ${fullPath}`);
        }
      }
      await sequelize.query(`DELETE FROM documents WHERE id=${docId}`);
      console.log(`Deleted database row: Document ID ${docId}`);
    }
    server.close();
  }
}

runTests();
