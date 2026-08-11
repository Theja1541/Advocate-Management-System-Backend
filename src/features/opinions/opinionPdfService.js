const PDFDocument = require('pdfkit');
const { Opinion, Client, Advocate, User, Land, Tenant, LandTitleSearch } = require('../associations');
const AppError = require('../../utils/AppError');

/**
 * Generates a professional multipage Legal Opinion PDF.
 * @param {number|string} opinionId - ID of the target legal opinion.
 * @param {number|string} tenantId - Tenant ID for isolation check.
 * @returns {Promise<Buffer>} Buffer containing the compiled PDF document.
 */
const generateOpinionPdf = async (opinionId, tenantId) => {
  // 1. Fetch opinion with all associations
  const opinion = await Opinion.findOne({
    where: { id: opinionId, tenantId },
    include: [
      { model: Client, as: 'client' },
      { model: Advocate, as: 'advocate' },
      { model: Land, as: 'land' },
      { model: Tenant, as: 'tenant' },
    ],
  });

  if (!opinion) {
    throw new AppError('Opinion record not found', 404);
  }

  // 2. Fetch title searches related to the property
  let titleSearches = [];
  if (opinion.landId) {
    titleSearches = await LandTitleSearch.findAll({
      where: { landId: opinion.landId, tenantId },
      include: [{ model: User, as: 'conductedByUser', attributes: ['name'] }],
      order: [['searchDate', 'DESC']],
    });
  }

  // 3. Compile PDF using PDFKit
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => {
        const resultBuffer = Buffer.concat(buffers);
        resolve(resultBuffer);
      });
      doc.on('error', (err) => reject(err));

      // --- LETTERHEAD ---
      const firmName = opinion.tenant?.name || 'LEGAL ASSOCIATES & COUNSELS';
      doc.fontSize(18).font('Helvetica-Bold').fillColor('#1E3A8A').text(firmName.toUpperCase(), { align: 'center' });
      
      const firmAddress = opinion.tenant?.address
        ? `${opinion.tenant.address}, ${opinion.tenant.city || ''}, ${opinion.tenant.state || ''} - ${opinion.tenant.pincode || ''}`
        : 'Chamber #24, High Court Buildings, Legal District';
      doc.fontSize(8.5).font('Helvetica').fillColor('#475569').text(firmAddress, { align: 'center' });
      
      const contactInfo = `Email: ${opinion.tenant?.email || 'contact@legaldesk.in'} | Phone: ${opinion.tenant?.phone || '—'} | Web: ${opinion.tenant?.website || 'www.legaldesk.in'}`;
      doc.fontSize(8.5).text(contactInfo, { align: 'center' });
      doc.moveDown(0.4);

      // Accent border lines
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2563EB').lineWidth(1.5).stroke();
      doc.moveDown(0.1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#93C5FD').lineWidth(0.5).stroke();
      doc.moveDown(1.5);

      // --- DOCUMENT TITLE ---
      doc.fontSize(13).font('Helvetica-Bold').fillColor('#1E293B').text('LEGAL CERTIFICATE OF TITLE & SCRUTINY OPINION', { align: 'center', underline: true });
      doc.moveDown(1.5);

      // --- SECTION 1: OPINION METADATA ---
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A').text('1. OPINION GENERAL DETAILS');
      doc.moveTo(50, doc.y).lineTo(200, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
      doc.moveDown(0.5);

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#334155');
      doc.text('Opinion Reference No: ', { continued: true }).font('Helvetica').text(opinion.referenceNo);
      doc.font('Helvetica-Bold').text('Opinion Type: ', { continued: true }).font('Helvetica').text(opinion.opinionType || 'Title Clearance');
      doc.font('Helvetica-Bold').text('Issue Date: ', { continued: true }).font('Helvetica').text(opinion.issueDate ? String(opinion.issueDate) : 'Pending / Not Issued');
      doc.font('Helvetica-Bold').text('Client Name: ', { continued: true }).font('Helvetica').text(opinion.client?.name || '—');
      doc.font('Helvetica-Bold').text('Drafting Counsel: ', { continued: true }).font('Helvetica').text(opinion.advocate?.name || '—');
      doc.moveDown(1.2);

      // --- SECTION 2: LAND DETAILS ---
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A').text('2. DESCRIPTION OF THE PROPERTY / DEED DETAILS');
      doc.moveTo(50, doc.y).lineTo(280, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
      doc.moveDown(0.5);

      const land = opinion.land;
      if (land) {
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#334155');
        doc.text('Survey Number: ', { continued: true }).font('Helvetica').text(land.surveyNo);
        doc.font('Helvetica-Bold').text('Sub-Division No: ', { continued: true }).font('Helvetica').text(land.subDivisionNo || '—');
        doc.font('Helvetica-Bold').text('Village / Locality: ', { continued: true }).font('Helvetica').text(land.village);
        doc.font('Helvetica-Bold').text('Mandal / Tehsil: ', { continued: true }).font('Helvetica').text(land.mandal || '—');
        doc.font('Helvetica-Bold').text('District: ', { continued: true }).font('Helvetica').text(land.district || '—');
        doc.font('Helvetica-Bold').text('Extent (Area): ', { continued: true }).font('Helvetica').text(land.extent || '—');
        doc.font('Helvetica-Bold').text('Patta No: ', { continued: true }).font('Helvetica').text(land.pattaNo || '—');
        doc.font('Helvetica-Bold').text('Current Owner Name: ', { continued: true }).font('Helvetica').text(land.currentOwnerName || '—');
        
        // Deed particulars
        const docNoText = land.documentNo ? `${land.documentNo} / ${land.documentYear || ''}` : '—';
        doc.font('Helvetica-Bold').text('Registration Deed No: ', { continued: true }).font('Helvetica').text(docNoText);
        doc.font('Helvetica-Bold').text('SRO (Sub-Registrar Office): ', { continued: true }).font('Helvetica').text(land.sro || '—');
        doc.font('Helvetica-Bold').text('Acquisition Method: ', { continued: true }).font('Helvetica').text(land.acquisitionType || '—');
      } else {
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#334155');
        doc.text('Survey Number: ', { continued: true }).font('Helvetica').text(opinion.surveyNo);
        doc.font('Helvetica-Bold').text('Village / Locality: ', { continued: true }).font('Helvetica').text(opinion.village);
      }
      doc.moveDown(1.2);

      // --- SECTION 3: TITLE SEARCH HISTORY LOG ---
      if (titleSearches.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A').text('3. TRANSCRIPT OF HISTORICAL TITLE SEARCHES');
        doc.moveTo(50, doc.y).lineTo(280, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
        doc.moveDown(0.5);

        titleSearches.forEach((ts, index) => {
          doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569')
             .text(`Search Entry #${index + 1} - Date: `, { continued: true })
             .font('Helvetica').text(`${ts.searchDate} (Search Period: ${ts.periodFrom} to ${ts.periodTo})`);
          
          doc.text(`Encumbrance Certificate Status: ${ts.ecStatus.toUpperCase()} | Ref: ${ts.ecReferenceNo || '—'}`);
          doc.text(`Conducted By: ${ts.conductedByUser?.name || '—'}`);
          
          // Checklist flags
          const checks = [
            ts.revenueRecordsVerified ? 'Revenue Verified' : null,
            ts.registrationRecordsVerified ? 'Deed Verified' : null,
            ts.litigationChecked ? 'Litigation Checked' : null,
            ts.documentsVerified ? 'Originals Inspected' : null,
          ].filter(Boolean).join(' · ');
          
          if (checks) {
            doc.font('Helvetica-Oblique').fontSize(8.5).text(`Checks Performed: ${checks}`).font('Helvetica').fontSize(9);
          }
          doc.moveDown(0.4);
        });
        doc.moveDown(1.0);
      }

      // --- SECTION 4: MARKETABILITY STATUS ---
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A').text('4. SCRUTINY CONCLUSION & TITLE VIABILITY');
      doc.moveTo(50, doc.y).lineTo(280, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
      doc.moveDown(0.5);

      const titleStatusLabels = {
        clear: 'Clear and Marketable Title (Fit for purchase/loan sanction)',
        disputed: 'Adverse Title / Under Court Litigation (High Risk)',
        under_scrutiny: 'Under Scrutiny (Awaiting secondary link documentation)',
      };

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#334155')
         .text('Title Classification: ', { continued: true })
         .font('Helvetica').text(titleStatusLabels[opinion.titleStatus] || opinion.titleStatus);

      if (land) {
        doc.font('Helvetica-Bold').text('Liability / Charge Status: ', { continued: true })
           .font('Helvetica').text(land.encumbranceStatus === 'clear' ? 'Clear (No active mortgages, liens, or third-party liabilities)' : 'Active charges or encumbrances noted');
      }
      doc.moveDown(1.2);

      // --- SECTION 5: DETAILED FINDINGS ---
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A').text('5. COMPREHENSIVE FINDINGS & DETAILED ANALYSIS');
      doc.moveTo(50, doc.y).lineTo(310, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
      doc.moveDown(0.5);
      
      doc.fontSize(9).font('Helvetica').fillColor('#334155').text(opinion.findingsNote, { align: 'justify', lineGap: 3.5 });
      doc.moveDown(1.2);

      // --- SECTION 6: RECOMMENDATION ---
      if (opinion.recommendation) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A').text('6. ADVISORY RECOMMENDATIONS');
        doc.moveTo(50, doc.y).lineTo(200, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(opinion.recommendation, { align: 'justify', lineGap: 3.5 });
        doc.moveDown(1.2);
      }

      // --- SECTION 7: LIMITATIONS ---
      if (opinion.limitations) {
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1E3A8A').text('7. CONDITIONS, LIMITATIONS & DISCLAIMERS');
        doc.moveTo(50, doc.y).lineTo(280, doc.y).strokeColor('#CBD5E1').lineWidth(0.8).stroke();
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica').fillColor('#334155').text(opinion.limitations, { align: 'justify', lineGap: 3.5 });
        doc.moveDown(1.2);
      }

      // --- SIGN OFF ---
      doc.moveDown(2);
      
      // Prevent signature wrapping onto a new page alone if possible
      if (doc.y > 680) {
        doc.addPage();
      }

      const advName = opinion.advocate?.name || 'Authorized Legal Counsel';
      const advEnrolment = opinion.advocate?.enrolment ? `Bar Council Enrolment No: ${opinion.advocate.enrolment}` : 'Enrolment No: Not Available';
      const advSpecialization = opinion.advocate?.specialization ? `Specialization: ${opinion.advocate.specialization}` : '';

      doc.fontSize(9.5).font('Helvetica-Bold').fillColor('#1E293B').text('ISSUING AUTHORITY & SIGNATURE', 320, doc.y);
      doc.moveDown(0.4);
      doc.font('Helvetica').fillColor('#475569')
         .text(advName)
         .text(opinion.advocate?.relation || 'Senior Legal Counsel')
         .text(advEnrolment);
      
      if (advSpecialization) {
        doc.text(advSpecialization);
      }

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  generateOpinionPdf,
};
