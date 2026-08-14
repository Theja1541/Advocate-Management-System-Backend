const actService = require('./actService');
const amendmentService = require('./amendmentService');
const auditService = require('./auditService');
const logger = require('../../config/logger');

exports.getAllActs = async (req, res, next) => {
  try {
    const { name, abbreviation, section, q, search, includeDeleted } = req.query;
    const acts = await actService.getAllActs({
      name,
      abbreviation,
      section,
      q,
      search,
      includeDeleted,
    }, req.user);
    res.status(200).json({
      status: 'success',
      results: acts.length,
      data: { acts },
    });
  } catch (error) {
    logger.error('GetAllActs error:', error);
    next(error);
  }
};

exports.getActById = async (req, res, next) => {
  try {
    const { includeDeleted } = req.query;
    const act = await actService.getActById(req.params.id, includeDeleted === 'true' || includeDeleted === true);
    res.status(200).json({
      status: 'success',
      data: { act },
    });
  } catch (error) {
    logger.error('GetActById error:', error);
    next(error);
  }
};

exports.openActPdf = async (req, res, next) => {
  try {
    const { absolutePath, filename, act } = await actService.getActPdf(req.params.id);
    
    // Log access audit trail
    auditService.logEvent(auditService.actions.VIEWED, req, { actId: req.params.id, actName: act.name });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    return res.sendFile(absolutePath);
  } catch (error) {
    logger.error('OpenActPdf error:', error);
    next(error);
  }
};

exports.downloadActPdf = async (req, res, next) => {
  try {
    const { absolutePath, downloadName, act } = await actService.getActPdf(req.params.id);
    
    // Log download audit trail
    auditService.logEvent(auditService.actions.DOWNLOADED, req, { actId: req.params.id, actName: act.name });
    
    return res.download(absolutePath, downloadName);
  } catch (error) {
    logger.error('DownloadActPdf error:', error);
    next(error);
  }
};

exports.toggleBookmark = async (req, res, next) => {
  try {
    const act = await actService.toggleBookmark(req.body);
    res.status(200).json({
      status: 'success',
      data: { act },
    });
  } catch (error) {
    logger.error('ToggleBookmark error:', error);
    next(error);
  }
};

exports.getAllAmendments = async (req, res, next) => {
  try {
    const { name, abbreviation, section, q, search, limit, offset, sourceAct, targetAct, effectiveDate } = req.query;
    
    if (limit !== undefined || offset !== undefined) {
      const { amendments, totalCount } = await amendmentService.getAllAmendments({
        name,
        abbreviation,
        section,
        q,
        search,
        limit,
        offset,
        sourceAct,
        targetAct,
        effectiveDate,
      }, req.user);

      res.status(200).json({
        status: 'success',
        results: amendments.length,
        totalCount,
        data: { amendments },
      });
    } else {
      const amendments = await amendmentService.getAllAmendments({
        name,
        abbreviation,
        section,
        q,
        search,
        sourceAct,
        targetAct,
        effectiveDate,
      }, req.user);
      res.status(200).json({
        status: 'success',
        results: amendments.length,
        data: { amendments },
      });
    }
  } catch (error) {
    logger.error('GetAllAmendments error:', error);
    next(error);
  }
};

exports.createAct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file; // Provided by actUpload middleware
    const act = await actService.createAct(req.body, file, userId);
    
    // Audit creation
    auditService.logEvent(auditService.actions.CREATED, req, { actId: act.id, actName: act.name });
    if (file) {
      auditService.logEvent(auditService.actions.UPLOADED, req, { actId: act.id, filename: file.originalname });
    }

    res.status(201).json({
      status: 'success',
      data: { act },
    });
  } catch (error) {
    logger.error('CreateAct error:', error);
    next(error);
  }
};

exports.updateAct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const act = await actService.updateAct(req.params.id, req.body, userId);
    
    // Audit updates
    auditService.logEvent(auditService.actions.UPDATED, req, { actId: act.id, actName: act.name });

    res.status(200).json({
      status: 'success',
      data: { act },
    });
  } catch (error) {
    logger.error('UpdateAct error:', error);
    next(error);
  }
};

exports.replacePdf = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;
    const act = await actService.replacePdf(req.params.id, file, userId);
    
    // Audit file replacement
    auditService.logEvent(auditService.actions.REPLACED, req, { actId: act.id, filename: file.originalname });

    res.status(200).json({
      status: 'success',
      data: { act },
    });
  } catch (error) {
    logger.error('ReplacePdf error:', error);
    next(error);
  }
};

exports.deleteAct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await actService.deleteAct(req.params.id, userId);
    
    // Audit soft-deletion
    auditService.logEvent(auditService.actions.DELETED, req, { actId: req.params.id });

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    logger.error('DeleteAct error:', error);
    next(error);
  }
};

exports.restoreAct = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const act = await actService.restoreAct(req.params.id, userId);
    
    // Audit restoration
    auditService.logEvent(auditService.actions.RESTORED, req, { actId: act.id, actName: act.name });

    res.status(200).json({
      status: 'success',
      data: { act },
    });
  } catch (error) {
    logger.error('RestoreAct error:', error);
    next(error);
  }
};

exports.getAmendmentById = async (req, res, next) => {
  try {
    const amendment = await amendmentService.getAmendmentById(req.params.id);
    res.status(200).json({
      status: 'success',
      data: { amendment },
    });
  } catch (error) {
    logger.error('GetAmendmentById error:', error);
    next(error);
  }
};

exports.createAmendment = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user.id, updatedBy: req.user.id };
    const amendment = await amendmentService.createAmendment(payload);
    res.status(201).json({
      status: 'success',
      data: { amendment },
    });
  } catch (error) {
    logger.error('CreateAmendment error:', error);
    next(error);
  }
};

exports.updateAmendment = async (req, res, next) => {
  try {
    const payload = { ...req.body, updatedBy: req.user.id };
    const amendment = await amendmentService.updateAmendment(req.params.id, payload);
    res.status(200).json({
      status: 'success',
      data: { amendment },
    });
  } catch (error) {
    logger.error('UpdateAmendment error:', error);
    next(error);
  }
};

exports.deleteAmendment = async (req, res, next) => {
  try {
    await amendmentService.deleteAmendment(req.params.id);
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteAmendment error:', error);
    next(error);
  }
};

exports.importAmendments = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('Please upload a file.', 400));
    }
    const report = await amendmentService.importAmendments(
      req.file.buffer,
      req.file.mimetype,
      req.file.originalname,
      req.user.id
    );
    res.status(200).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    logger.error('ImportAmendments error:', error);
    next(error);
  }
};
