const ExcelJS = require('exceljs');

const HEADER_FILL = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1F3A5F' },
};

const HEADER_FONT = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

const escapeCsvValue = (value) => {
  if (value == null) return '';
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const humanizeKey = (key) =>
  String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const isPlainObject = (value) =>
  value != null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date);

const flattenRow = (row) => {
  if (!isPlainObject(row)) {
    return { value: row };
  }

  const flat = {};
  Object.entries(row).forEach(([key, value]) => {
    if (Array.isArray(value) || isPlainObject(value)) {
      flat[key] = JSON.stringify(value);
    } else if (value instanceof Date) {
      flat[key] = value.toISOString();
    } else {
      flat[key] = value;
    }
  });
  return flat;
};

const collectSheetsFromReportData = (report) => {
  const sheets = [];
  const data = report?.data ?? report ?? {};
  const title = report?.title || report?.reportType || 'Report';

  const pushSheet = (name, rows) => {
    if (!Array.isArray(rows) || !rows.length) return;
    sheets.push({
      name: String(name).slice(0, 31),
      rows: rows.map(flattenRow),
    });
  };

  if (Array.isArray(data)) {
    pushSheet(title, data);
    return sheets;
  }

  if (Array.isArray(data.rows)) {
    pushSheet('Rows', data.rows);
  }
  if (Array.isArray(data.advocateShares)) {
    pushSheet('Advocate Shares', data.advocateShares);
  }
  if (Array.isArray(data.daybook)) {
    pushSheet('Daybook', data.daybook);
  }
  if (Array.isArray(data.hearings)) {
    pushSheet('Hearings', data.hearings);
  }
  if (Array.isArray(data.diary)) {
    pushSheet('Diary', data.diary);
  }

  if (data.summary && isPlainObject(data.summary)) {
    if (Array.isArray(data.summary.byCourt)) {
      pushSheet('By Court', data.summary.byCourt);
    }
    if (Array.isArray(data.summary.byStatus)) {
      pushSheet('By Status', data.summary.byStatus);
    }
    if (Array.isArray(data.summary.byState)) {
      pushSheet('By State', data.summary.byState);
    }

    const scalarSummary = Object.entries(data.summary)
      .filter(([, value]) => !Array.isArray(value) && !isPlainObject(value))
      .map(([key, value]) => ({ metric: humanizeKey(key), value }));
    if (scalarSummary.length) {
      pushSheet('Summary', scalarSummary);
    }
  }

  // Monthly / nested object reports
  ['cases', 'payments', 'daybook', 'diary'].forEach((sectionKey) => {
    const section = data[sectionKey];
    if (!isPlainObject(section)) return;

    if (Array.isArray(section.byCourt)) {
      pushSheet(`${humanizeKey(sectionKey)} By Court`, section.byCourt);
    }

    const scalarRows = Object.entries(section)
      .filter(([, value]) => !Array.isArray(value) && !isPlainObject(value))
      .map(([key, value]) => ({ metric: humanizeKey(key), value }));
    if (scalarRows.length) {
      pushSheet(humanizeKey(sectionKey), scalarRows);
    }
  });

  if (!sheets.length && isPlainObject(data)) {
    const fallbackRows = Object.entries(data)
      .filter(([, value]) => !Array.isArray(value) && !isPlainObject(value))
      .map(([key, value]) => ({ metric: humanizeKey(key), value }));
    if (fallbackRows.length) {
      pushSheet('Summary', fallbackRows);
    }
  }

  if (!sheets.length) {
    sheets.push({
      name: 'Report',
      rows: [{ message: 'No tabular rows available for this report.' }],
    });
  }

  return sheets;
};

const buildCsvFromSheets = (sheets) => {
  const parts = [];

  sheets.forEach((sheet, index) => {
    if (index > 0) parts.push('');
    parts.push(`# ${sheet.name}`);

    const columns = [];
    sheet.rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!columns.includes(key)) columns.push(key);
      });
    });

    parts.push(columns.map(humanizeKey).map(escapeCsvValue).join(','));
    sheet.rows.forEach((row) => {
      parts.push(columns.map((col) => escapeCsvValue(row[col])).join(','));
    });
  });

  return Buffer.from(`\uFEFF${parts.join('\n')}`, 'utf8');
};

const buildWorkbookBuffer = async (report, sheets) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Advocate Management System';
  workbook.created = new Date();
  workbook.modified = new Date();

  const metaSheet = workbook.addWorksheet('Meta');
  metaSheet.columns = [
    { header: 'Field', key: 'field', width: 24 },
    { header: 'Value', key: 'value', width: 60 },
  ];
  metaSheet.getRow(1).font = HEADER_FONT;
  metaSheet.getRow(1).fill = HEADER_FILL;
  metaSheet.addRows([
    { field: 'Title', value: report?.title || 'Report' },
    { field: 'Report Type', value: report?.reportType || '' },
    { field: 'Description', value: report?.description || '' },
    { field: 'Generated At', value: report?.generatedAt || new Date().toISOString() },
  ]);

  sheets.forEach((sheetData) => {
    const worksheet = workbook.addWorksheet(sheetData.name);
    const columns = [];
    sheetData.rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (!columns.includes(key)) columns.push(key);
      });
    });

    worksheet.columns = columns.map((key) => ({
      header: humanizeKey(key),
      key,
      width: Math.min(40, Math.max(14, humanizeKey(key).length + 4)),
    }));

    worksheet.getRow(1).font = HEADER_FONT;
    worksheet.getRow(1).fill = HEADER_FILL;
    worksheet.getRow(1).alignment = { vertical: 'middle' };

    sheetData.rows.forEach((row) => {
      worksheet.addRow(row);
    });
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Accepts generated report data and returns a downloadable file buffer.
 *
 * @param {object} report - Output from reportService.generateReport (or compatible shape)
 * @param {object} [options]
 * @param {'xlsx'|'csv'} [options.format='xlsx']
 * @returns {Promise<{ buffer: Buffer, filename: string, contentType: string, format: string }>}
 */
const buildReportDownload = async (report, options = {}) => {
  const format = String(options.format || 'xlsx').toLowerCase() === 'csv' ? 'csv' : 'xlsx';
  const sheets = collectSheetsFromReportData(report);
  const stamp = new Date().toISOString().slice(0, 10);
  const baseName = String(report?.reportType || report?.title || 'report')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'report';

  if (format === 'csv') {
    return {
      format,
      buffer: buildCsvFromSheets(sheets),
      filename: `${baseName}-${stamp}.csv`,
      contentType: 'text/csv; charset=utf-8',
    };
  }

  const buffer = await buildWorkbookBuffer(report, sheets);
  return {
    format,
    buffer,
    filename: `${baseName}-${stamp}.xlsx`,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

module.exports = {
  buildReportDownload,
  collectSheetsFromReportData,
  escapeCsvValue,
};
