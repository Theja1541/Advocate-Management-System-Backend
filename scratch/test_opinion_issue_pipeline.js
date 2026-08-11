const app = require('../src/app');
const http = require('http');
const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- STARTING OPINION ISSUE + PDF PIPELINE INTEGRATION TESTS ---');

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;
  console.log(`Test server at ${baseUrl}`);

  const generatedOpinionIds = [];
  const generatedDocumentIds = [];
  const generatedFiles = [];

  async function request(path, options = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
    let body = null;
    try { body = await res.json(); } catch {}
    return { status: res.status, body };
  }

  try {
    // LOGIN
    console.log('\n[SETUP] Logging in...');
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@legaldesk.in', password: 'password' }),
    });
    if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    const authHeaders = { Authorization: `Bearer ${loginRes.body.token}` };
    console.log('Logged in successfully.');

    // Fetch seed data IDs
    const [[client], [advocate]] = await Promise.all([
      sequelize.query('SELECT id, tenant_id FROM clients LIMIT 1', { type: sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT id FROM advocates LIMIT 1', { type: sequelize.QueryTypes.SELECT }),
    ]);
    const tenantId = client.tenant_id;

    // CREATE OPINION
    console.log('\n[TEST 1] Creating draft opinion...');
    const createRes = await request('/opinions', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        clientId: client.id,
        surveyNo: '200/A',
        village: 'Puram',
        opinionType: 'Title Clearance',
        findingsNote: 'Detailed findings for integration test purposes.',
        recommendation: 'Recommended to proceed.',
        limitations: 'Limited to documents provided.',
        advocateId: advocate.id,
      }),
    });
    if (createRes.status !== 201) throw new Error(`Create failed: ${JSON.stringify(createRes.body)}`);
    const opinion = createRes.body.data.opinion;
    generatedOpinionIds.push(opinion.id);
    console.log(`Created opinion ID: ${opinion.id}, status: ${opinion.status}`);
    if (opinion.status !== 'draft') throw new Error('Expected draft status');

    // SUBMIT
    console.log('\n[TEST 2] Submitting for review...');
    const submitRes = await request(`/opinions/${opinion.id}/submit`, { method: 'POST', headers: authHeaders });
    if (submitRes.status !== 200) throw new Error(`Submit failed: ${JSON.stringify(submitRes.body)}`);
    if (submitRes.body.data.opinion.status !== 'pending_review') throw new Error('Expected pending_review');
    console.log('Submitted. Status: pending_review ✓');

    // APPROVE
    console.log('\n[TEST 3] Approving opinion...');
    const approveRes = await request(`/opinions/${opinion.id}/approve`, { method: 'POST', headers: authHeaders });
    if (approveRes.status !== 200) throw new Error(`Approve failed: ${JSON.stringify(approveRes.body)}`);
    const approved = approveRes.body.data.opinion;
    if (approved.status !== 'approved' || !approved.approvedBy || !approved.approvalDate) {
      throw new Error('Approval population mismatch');
    }
    console.log(`Approved. approvedBy: ${approved.approvedBy}, date: ${approved.approvalDate} ✓`);

    // ISSUE (PDF generation + document storage should happen here)
    console.log('\n[TEST 4] Issuing opinion (PDF + Document pipeline)...');
    const issueRes = await request(`/opinions/${opinion.id}/issue`, { method: 'POST', headers: authHeaders });
    if (issueRes.status !== 200) throw new Error(`Issue failed: ${JSON.stringify(issueRes.body)}`);
    const issued = issueRes.body.data.opinion;
    console.log(`Issue response status: ${issued.status}`);

    if (issued.status !== 'issued') throw new Error(`Expected issued, got ${issued.status}`);
    if (!issued.issuedBy) throw new Error('issuedBy not populated');
    if (!issued.issueDate) throw new Error('issueDate not set');
    if (!issued.documentId) throw new Error('documentId not linked after issue');

    console.log(`issuedBy: ${issued.issuedBy} ✓`);
    console.log(`issueDate: ${issued.issueDate} ✓`);
    console.log(`documentId: ${issued.documentId} ✓`);

    // Track generated document for cleanup
    generatedDocumentIds.push(issued.documentId);

    // Verify finalPdf is included in the response
    if (!issued.finalPdf || !issued.finalPdf.id) {
      throw new Error('finalPdf association not returned in response');
    }
    console.log(`finalPdf.id: ${issued.finalPdf.id}, name: ${issued.finalPdf.name} ✓`);

    // Verify the PDF file exists on disk
    const { filePath } = issued.finalPdf;
    if (filePath) {
      const resolvedPath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(__dirname, '..', filePath);
      const fileExists = fs.existsSync(resolvedPath);
      console.log(`PDF file on disk (${resolvedPath}): ${fileExists ? 'EXISTS ✓' : 'NOT FOUND ✗'}`);
      if (fileExists) generatedFiles.push(resolvedPath);
      if (!fileExists) throw new Error('Generated PDF file is missing from disk');
    }

    // TEST DUPLICATE ISSUE REJECTION
    console.log('\n[TEST 5] Verifying duplicate issue is rejected...');
    const duplicateRes = await request(`/opinions/${opinion.id}/issue`, { method: 'POST', headers: authHeaders });
    if (duplicateRes.status !== 400) throw new Error(`Expected 400 for duplicate issue, got ${duplicateRes.status}`);
    console.log(`Duplicate issue blocked: "${duplicateRes.body.message}" ✓`);

    // TEST EDIT BLOCK ON ISSUED
    console.log('\n[TEST 6] Verifying edit block on issued opinion...');
    const editRes = await request(`/opinions/${opinion.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ findingsNote: 'Attempt to change issued opinion' }),
    });
    if (editRes.status !== 400) throw new Error(`Expected 400 for edit on issued, got ${editRes.status}`);
    console.log(`Edit blocked: "${editRes.body.message}" ✓`);

    console.log('\n--- ALL ISSUE + PDF PIPELINE TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n!!! TEST FAILURE !!!');
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    console.log('\nCleaning up test records and files...');
    // Delete documents (need to do before opinions due to FK)
    for (const docId of generatedDocumentIds) {
      await sequelize.query(`DELETE FROM documents WHERE id=${docId}`);
      console.log(`Deleted Document ID ${docId}`);
    }
    // Delete opinions
    for (const opId of generatedOpinionIds) {
      await sequelize.query(`UPDATE opinions SET document_id=NULL WHERE id=${opId}`);
      await sequelize.query(`DELETE FROM opinions WHERE id=${opId}`);
      console.log(`Deleted Opinion ID ${opId}`);
    }
    // Delete generated PDF files
    for (const filePath of generatedFiles) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted PDF file: ${filePath}`);
      }
    }
    server.close();
  }
}

runTests();
