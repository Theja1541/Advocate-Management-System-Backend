const { generateOpinionPdf } = require('../src/features/opinions/opinionPdfService');
const { Opinion, Client, Advocate, Land } = require('../src/features/associations');
const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function testPdfGeneration() {
  console.log('--- STARTING OPINION PDF GENERATION INTEGRATION TESTS ---');

  const testFilePath = path.join(__dirname, 'test_output.pdf');
  let createdOpinionId = null;

  try {
    // 1. Fetch reference client, advocate and land from database
    const client = await Client.findOne();
    const advocate = await Advocate.findOne();
    const land = await Land.findOne();

    if (!client || !advocate || !land) {
      throw new Error('Database is missing seed clients, advocates, or lands. Seed first.');
    }

    // 2. Create a temporary Opinion with full fields (findings, recommendations, limitations)
    console.log('[TEST 1] Creating temporary opinion with full text contents...');
    const tempOpinion = await Opinion.create({
      tenantId: client.tenant_id,
      referenceNo: `TEST-PDF-${Date.now()}`,
      clientId: client.id,
      surveyNo: land.surveyNo,
      village: land.village,
      opinionType: 'Comprehensive Title Investigation Report',
      findingsNote: 'INVESTIGATION FINDINGS:\n' + '1. The property has been traced back through 30 years of link deeds.\n' + '2. No active attachments or court orders were found registered in the Sub-Registrar Office.\n' + '3. Original document verification matches the registry records.',
      recommendation: 'RECOMMENDATIONS:\n' + '1. It is recommended to obtain a physical possession certificate.\n' + '2. The purchaser can proceed with the execution of the sale deed.',
      limitations: 'LIMITATIONS:\n' + '1. This opinion is valid based on the documents submitted by the client.\n' + '2. Oral claims or family disputes not on record are excluded.',
      advocateId: advocate.id,
      landId: land.id,
      status: 'draft',
    });

    createdOpinionId = tempOpinion.id;
    console.log(`Created opinion ID: ${createdOpinionId}`);

    // 3. Call PDF Service
    console.log('\n[TEST 2] Generating PDF for valid opinion...');
    const pdfBuffer = await generateOpinionPdf(tempOpinion.id, client.tenant_id);

    // Verify Buffer properties
    if (!Buffer.isBuffer(pdfBuffer)) {
      throw new Error('PDF output is not a Buffer');
    }
    console.log(`Generated PDF successfully. Size: ${pdfBuffer.length} bytes.`);

    if (pdfBuffer.length < 1000) {
      throw new Error('PDF buffer size is suspiciously small');
    }

    // Verify PDF header signature
    const pdfHeader = pdfBuffer.toString('utf8', 0, 5);
    console.log(`PDF Magic bytes: "${pdfHeader}"`);
    if (pdfHeader !== '%PDF-') {
      throw new Error('Buffer does not contain valid PDF magic bytes (%PDF-)');
    }

    // Save temporary file to verify disk writing
    fs.writeFileSync(testFilePath, pdfBuffer);
    console.log(`Saved PDF locally to verify formatting: ${testFilePath}`);

    // 4. Test Error Handling for invalid/missing Opinion
    console.log('\n[TEST 3] Testing missing opinion rejection...');
    try {
      await generateOpinionPdf(999999, client.tenant_id);
      throw new Error('Expected generateOpinionPdf to throw for missing opinion ID, but it succeeded');
    } catch (err) {
      console.log(`Rejected invalid opinion ID successfully as expected: "${err.message}"`);
      if (!err.message.includes('Opinion record not found')) {
        throw new Error(`Expected 'Opinion record not found' message, got: ${err.message}`);
      }
    }

    // 5. Test tenant isolation rejection
    console.log('\n[TEST 4] Testing tenant isolation checks...');
    try {
      await generateOpinionPdf(tempOpinion.id, 99999);
      throw new Error('Expected generateOpinionPdf to throw for cross-tenant ID access, but it succeeded');
    } catch (err) {
      console.log(`Rejected foreign tenant ID successfully as expected: "${err.message}"`);
      if (!err.message.includes('Opinion record not found')) {
        throw new Error(`Expected 'Opinion record not found' message, got: ${err.message}`);
      }
    }

    console.log('\n--- ALL PDF INTEGRATION TESTS PASSED SUCCESSFULLY! ---');
  } catch (error) {
    console.error('\n!!! TEST FAILURE !!!');
    console.error(error);
    process.exitCode = 1;
  } finally {
    // 6. Cleanup
    console.log('\nCleaning up generated test files and records...');
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      console.log(`Deleted local PDF file: ${testFilePath}`);
    }
    if (createdOpinionId) {
      await sequelize.query(`DELETE FROM opinions WHERE id=${createdOpinionId}`);
      console.log(`Deleted database row: Opinion ID ${createdOpinionId}`);
    }
  }
}

testPdfGeneration();
