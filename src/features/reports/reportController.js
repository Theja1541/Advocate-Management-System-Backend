const reportService = require('./reportService');
const { buildReportDownload } = require('../../utils/reportExport');
const logger = require('../../config/logger');

exports.getReport = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const { date, month, year } = req.query;

    const report = await reportService.generateReport(reportType, {
      date,
      month,
      year,
    });

    res.status(200).json({
      status: 'success',
      data: { report },
    });
  } catch (error) {
    logger.error('GetReport error:', error);
    next(error);
  }
};

exports.exportReport = async (req, res, next) => {
  try {
    const { reportType } = req.params;
    const { date, month, year, format } = req.query;

    const report = await reportService.generateReport(reportType, {
      date,
      month,
      year,
    });

    const file = await buildReportDownload(report, { format });

    res.setHeader('Content-Type', file.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`
    );
    res.setHeader('Content-Length', file.buffer.length);
    return res.status(200).send(file.buffer);
  } catch (error) {
    logger.error('ExportReport error:', error);
    next(error);
  }
};

exports.listReportTypes = async (req, res, next) => {
  try {
    const types = reportService.REPORT_TYPES.map((reportType) => ({
      reportType,
      ...reportService.REPORT_META[reportType],
    }));

    res.status(200).json({
      status: 'success',
      results: types.length,
      data: { types },
    });
  } catch (error) {
    logger.error('ListReportTypes error:', error);
    next(error);
  }
};
