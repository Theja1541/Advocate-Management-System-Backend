const { Op } = require('sequelize');
const LegalText = require('./LegalText');
const AppError = require('../../utils/AppError');
const { isGroupAdmin } = require('../../utils/roleHelper');
const { applyGroupAdminIsolation } = require('../../utils/groupAdminScope');

const scopeLegalTextWhere = async (where, user) => {
  const role = user?.role || user?.rawRole;
  if (isGroupAdmin(role)) {
    where.created_by = user.id;
    return;
  }
  await applyGroupAdminIsolation(where, user, 'created_by');
};

exports.getSuggestions = async (req, res, next) => {
  try {
    const { search, limit = 5 } = req.query;
    if (!search || search.length < 3) {
      return res.status(200).json({ status: 'success', data: [] });
    }

    const where = {
      tenantId: req.user.tenantId,
      [Op.or]: [
        { title: { [Op.like]: `%${search}%` } },
        { content: { [Op.like]: `%${search}%` } },
      ]
    };
    await scopeLegalTextWhere(where, req.user);

    const rows = await LegalText.findAll({
      where,
      limit: parseInt(limit, 10),
      order: [['created_at', 'DESC']],
    });

    const results = [];
    const lowerSearch = search.toLowerCase();

    for (const row of rows) {
      const content = row.content || '';
      const lowerContent = content.toLowerCase();
      const matchIndex = lowerContent.indexOf(lowerSearch);

      if (matchIndex !== -1) {
        // Extract paragraph
        const paraStart = content.lastIndexOf('\n', matchIndex) + 1;
        let paraEnd = content.indexOf('\n', matchIndex);
        if (paraEnd === -1) paraEnd = content.length;
        const matchedParagraph = content.substring(paraStart, paraEnd).trim();

        // Extract sentence
        // Simplistic sentence boundary detection
        const sentenceBoundaryRegex = /[.?!]\s/g;
        let sentStart = 0;
        let match;
        
        // Find the last sentence boundary before matchIndex
        let lastBoundary = 0;
        sentenceBoundaryRegex.lastIndex = 0;
        while ((match = sentenceBoundaryRegex.exec(content)) !== null) {
          if (match.index < matchIndex) {
            lastBoundary = match.index + match[0].length;
          } else {
            break;
          }
        }
        sentStart = lastBoundary;

        let sentEnd = content.length;
        sentenceBoundaryRegex.lastIndex = matchIndex;
        const endMatch = sentenceBoundaryRegex.exec(content);
        if (endMatch) {
          sentEnd = endMatch.index + 1; // Include the punctuation
        }

        const matchedSentence = content.substring(sentStart, sentEnd).trim();

        results.push({
          id: row.id,
          title: row.title,
          category: row.category,
          matchedParagraph,
          matchedSentence,
          matchedTerm: search,
          isExact: true
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllTexts = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = { tenantId: req.user.tenantId };
    await scopeLegalTextWhere(where, req.user);

    if (category) {
      where.category = category;
    }

    if (search) {
      const searchClause = {
        [Op.or]: [
          { title: { [Op.like]: `%${search}%` } },
          { content: { [Op.like]: `%${search}%` } },
          { category: { [Op.like]: `%${search}%` } }
        ]
      };
      where[Op.and] = where[Op.and] || [];
      where[Op.and].push(searchClause);
    }

    const { count, rows } = await LegalText.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['created_at', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: rows,
      total: count,
      page: parseInt(page, 10),
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    next(error);
  }
};

exports.getTextById = async (req, res, next) => {
  try {
    const where = { id: req.params.id, tenantId: req.user.tenantId };
    await scopeLegalTextWhere(where, req.user);

    const legalText = await LegalText.findOne({ where });

    if (!legalText) {
      return next(new AppError('Legal Text not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: legalText,
    });
  } catch (error) {
    next(error);
  }
};

exports.createText = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;

    const newText = await LegalText.create({
      tenantId: req.user.tenantId,
      title,
      content,
      category,
      createdBy: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      data: newText,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateText = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;

    const where = { id: req.params.id, tenantId: req.user.tenantId };
    await scopeLegalTextWhere(where, req.user);

    const legalText = await LegalText.findOne({ where });

    if (!legalText) {
      return next(new AppError('Legal Text not found', 404));
    }

    legalText.title = title;
    legalText.content = content;
    legalText.category = category;
    legalText.updatedBy = req.user.id;
    
    await legalText.save();

    res.status(200).json({
      status: 'success',
      data: legalText,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteText = async (req, res, next) => {
  try {
    const where = { id: req.params.id, tenantId: req.user.tenantId };
    await scopeLegalTextWhere(where, req.user);

    const legalText = await LegalText.findOne({ where });

    if (!legalText) {
      return next(new AppError('Legal Text not found', 404));
    }

    await legalText.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Legal Text deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
