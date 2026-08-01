const logger = require('../../config/logger');
const { requireAdvocateScope } = require('../../utils/advocateScope');
const searchService = require('./searchService');

exports.search = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const data = await searchService.searchNotesAndDocuments({
      keyword: req.query.q,
      limit: req.query.limit,
      advocateId,
    });

    res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    logger.error('Search error:', error);
    next(error);
  }
};
