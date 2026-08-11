const app = require('../src/app');
const http = require('http');
const { sequelize } = require('../src/config/database');

async function runTests() {
  console.log('--- STARTING LEGAL OPINION WORKFLOW INTEGRATION TESTS ---');

  // 1. Start server on dynamic port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  console.log(`Test server running at ${baseUrl}`);

  // Fetch helper
  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const res = await fetch(url, {
      ...options,
      headers,
    });
    const status = res.status;
    let body = null;
    try {
      body = await res.json();
    } catch (e) {
      // ignore
    }
    return { status, body };
  }

  const createdOpinionIds = [];

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
    console.log('Logged in as admin successfully.');

    // Retrieve database records for testing
    const firstClient = await sequelize.query('SELECT id, tenant_id FROM clients LIMIT 1', {
      type: sequelize.QueryTypes.SELECT,
    });
    const firstAdvocate = await sequelize.query('SELECT id, tenant_id FROM advocates LIMIT 1', {
      type: sequelize.QueryTypes.SELECT,
    });

    if (!firstClient.length || !firstAdvocate.length) {
      throw new Error('Database is missing clients or advocates. Seed database first.');
    }

    const validClientId = firstClient[0].id;
    const validAdvocateId = firstAdvocate[0].id;
    const adminTenantId = firstClient[0].tenant_id;

    console.log(`Using client: ${validClientId}, advocate: ${validAdvocateId}, tenant: ${adminTenantId}`);

    // 3. Create a Draft Opinion
    console.log('\n[TEST 2] Creating a draft opinion...');
    const createRes = await request('/opinions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: validClientId,
        surveyNo: '100/A',
        village: 'Kadanur',
        opinionType: 'Title Clearance',
        findingsNote: 'Initial findings drafted for review.',
        advocateId: validAdvocateId,
      }),
    });

    console.log(`Create Status: ${createRes.status}`);
    if (createRes.status !== 201) {
      throw new Error(`Expected 201, got ${createRes.status}: ${JSON.stringify(createRes.body)}`);
    }
    const opinion = createRes.body.data.opinion;
    createdOpinionIds.push(opinion.id);
    console.log(`Opinion created with ID: ${opinion.id}, Status: ${opinion.status}`);

    if (opinion.status !== 'draft') {
      throw new Error(`Expected status 'draft', got ${opinion.status}`);
    }

    // 4. Test Transition: draft -> pending_review
    console.log('\n[TEST 3] Testing transition: draft -> pending_review...');
    const submitRes = await request(`/opinions/${opinion.id}/submit`, {
      method: 'POST',
      headers: authHeaders,
    });

    console.log(`Submit Status: ${submitRes.status}`);
    if (submitRes.status !== 200) {
      throw new Error(`Submit failed: ${JSON.stringify(submitRes.body)}`);
    }
    const submittedOpinion = submitRes.body.data.opinion;
    console.log(`Submitted Status: ${submittedOpinion.status}`);
    if (submittedOpinion.status !== 'pending_review') {
      throw new Error(`Expected pending_review, got ${submittedOpinion.status}`);
    }

    // 5. Test Transition: pending_review -> rejected
    console.log('\n[TEST 4] Testing transition: pending_review -> rejected...');
    const rejectRes = await request(`/opinions/${opinion.id}/reject`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        rejectReason: 'Clarification needed on the link documents.',
      }),
    });

    console.log(`Reject Status: ${rejectRes.status}`);
    if (rejectRes.status !== 200) {
      throw new Error(`Reject failed: ${JSON.stringify(rejectRes.body)}`);
    }
    const rejectedOpinion = rejectRes.body.data.opinion;
    console.log(`Rejected Status: ${rejectedOpinion.status}, Reason: "${rejectedOpinion.rejectReason}"`);
    if (rejectedOpinion.status !== 'rejected' || rejectedOpinion.rejectReason !== 'Clarification needed on the link documents.') {
      throw new Error('Failed to correctly reject opinion');
    }

    // 6. Test Transition: rejected -> draft (upon edit)
    console.log('\n[TEST 5] Testing transition: rejected -> draft (on update)...');
    const updateRes = await request(`/opinions/${opinion.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        findingsNote: 'Updated findings resolving the link document clarifications.',
      }),
    });

    console.log(`Update Status: ${updateRes.status}`);
    if (updateRes.status !== 200) {
      throw new Error(`Update failed: ${JSON.stringify(updateRes.body)}`);
    }
    const updatedOpinion = updateRes.body.data.opinion;
    console.log(`Updated Status: ${updatedOpinion.status}, Reason: "${updatedOpinion.rejectReason}"`);
    if (updatedOpinion.status !== 'draft' || updatedOpinion.rejectReason !== null) {
      throw new Error('Expected status to reset to draft and clear rejectReason');
    }

    // 7. Test Transition: draft -> pending_review -> approved
    console.log('\n[TEST 6] Testing transition: draft -> pending_review -> approved...');
    // Re-submit
    const resubmitRes = await request(`/opinions/${opinion.id}/submit`, {
      method: 'POST',
      headers: authHeaders,
    });
    if (resubmitRes.status !== 200) throw new Error('Re-submit failed');

    // Approve
    const approveRes = await request(`/opinions/${opinion.id}/approve`, {
      method: 'POST',
      headers: authHeaders,
    });

    console.log(`Approve Status: ${approveRes.status}`);
    if (approveRes.status !== 200) {
      throw new Error(`Approve failed: ${JSON.stringify(approveRes.body)}`);
    }
    const approvedOpinion = approveRes.body.data.opinion;
    console.log(`Approved Status: ${approvedOpinion.status}, ApprovedBy: ${approvedOpinion.approvedBy}, Date: ${approvedOpinion.approvalDate}`);
    if (approvedOpinion.status !== 'approved' || !approvedOpinion.approvedBy || !approvedOpinion.approvalDate) {
      throw new Error('Approval population mismatch');
    }

    // 8. Test Transition: approved -> issued
    console.log('\n[TEST 7] Testing transition: approved -> issued...');
    const issueRes = await request(`/opinions/${opinion.id}/issue`, {
      method: 'POST',
      headers: authHeaders,
    });

    console.log(`Issue Status: ${issueRes.status}`);
    if (issueRes.status !== 200) {
      throw new Error(`Issue failed: ${JSON.stringify(issueRes.body)}`);
    }
    const issuedOpinion = issueRes.body.data.opinion;
    console.log(`Issued Status: ${issuedOpinion.status}, IssuedBy: ${issuedOpinion.issuedBy}, Date: ${issuedOpinion.issueDate}`);
    if (issuedOpinion.status !== 'issued' || !issuedOpinion.issuedBy || !issuedOpinion.issueDate) {
      throw new Error('Issuing population mismatch');
    }

    // 9. Verify Issued opinions cannot be edited or deleted
    console.log('\n[TEST 8] Verifying edit block on issued opinions...');
    const blockEditRes = await request(`/opinions/${opinion.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        findingsNote: 'Attempting to edit issued opinion.',
      }),
    });
    console.log(`Block Edit Status: ${blockEditRes.status}`);
    if (blockEditRes.status !== 400 || !blockEditRes.body?.message?.includes('Cannot edit')) {
      throw new Error('Expected 400 rejection for editing issued opinion');
    }

    const blockDeleteRes = await request(`/opinions/${opinion.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    console.log(`Block Delete Status: ${blockDeleteRes.status}`);
    if (blockDeleteRes.status !== 400 || !blockDeleteRes.body?.message?.includes('Cannot delete')) {
      throw new Error('Expected 400 rejection for deleting issued opinion');
    }

    // 10. Test Invalid Transitions (e.g. submit issued opinion, approve draft opinion)
    console.log('\n[TEST 9] Verifying rejection of invalid transitions...');
    const invalidSubmitRes = await request(`/opinions/${opinion.id}/submit`, {
      method: 'POST',
      headers: authHeaders,
    });
    console.log(`Submit Issued Opinion Status: ${invalidSubmitRes.status}`);
    if (invalidSubmitRes.status !== 400) {
      throw new Error('Expected 400 for submitting issued opinion');
    }

    // Create a new draft to test approve on draft
    const draft2Res = await request('/opinions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: validClientId,
        surveyNo: '101/B',
        village: 'Kadanur',
        opinionType: 'Title Clearance',
        findingsNote: 'Draft 2 content.',
        advocateId: validAdvocateId,
      }),
    });
    const draft2 = draft2Res.body.data.opinion;
    createdOpinionIds.push(draft2.id);

    const invalidApproveRes = await request(`/opinions/${draft2.id}/approve`, {
      method: 'POST',
      headers: authHeaders,
    });
    console.log(`Approve Draft Opinion Status: ${invalidApproveRes.status}`);
    if (invalidApproveRes.status !== 400) {
      throw new Error('Expected 400 for approving draft opinion');
    }

    // 11. Test Tenant Isolation
    console.log('\n[TEST 10] Testing tenant isolation on workflow actions...');

    console.log('Bypassing multi-user token login. Verifying backend tenant checks directly...');
    // We can verify that executing the service directly with a different tenantId fails
    const opinionService = require('../src/features/opinions/opinionService');
    try {
      await opinionService.submitForReview(opinion.id, 999);
      throw new Error('Tenant isolation failed: was able to submit opinion of another tenant');
    } catch (err) {
      console.log(`Isolation Check: submitForReview with tenantId 999 failed as expected: "${err.message}"`);
      if (!err.message.includes('Opinion not found')) {
        throw new Error('Expected "Opinion not found" error for foreign tenant');
      }
    }

    console.log('\n--- ALL LEGAL OPINION WORKFLOW TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n!!! TEST FAILURE !!!');
    console.error(error);
    process.exitCode = 1;
  } finally {
    // 12. Cleanup
    console.log('\nCleaning up created test opinion records...');
    for (const opinionId of createdOpinionIds) {
      await sequelize.query(`DELETE FROM opinions WHERE id=${opinionId}`);
      console.log(`Deleted database row: Opinion ID ${opinionId}`);
    }
    server.close();
  }
}

runTests();
