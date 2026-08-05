const { Op, fn, col, where, QueryTypes } = require('sequelize');
const { sequelize, tenantContext } = require('../../config/database');
const { CaseDiary, Document, Case } = require('../associations');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const SNIPPET_WINDOW = 80;
const SEARCH_ENGINE = (process.env.SEARCH_ENGINE || 'mysql_like').toLowerCase();
const isMissingSearchContentColumnError = (error) => {
  const message = String(error?.message || '');
  return message.includes('search_content') && message.includes('Unknown column');
};

const createSnippet = (text = '', keyword = '') => {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  const lowerText = normalized.toLowerCase();
  const lowerKeyword = String(keyword || '').toLowerCase().trim();
  const hitIndex = lowerKeyword ? lowerText.indexOf(lowerKeyword) : -1;

  if (hitIndex === -1) {
    return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
  }

  const start = Math.max(0, hitIndex - SNIPPET_WINDOW);
  const end = Math.min(normalized.length, hitIndex + lowerKeyword.length + SNIPPET_WINDOW);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < normalized.length ? '...' : '';
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
};

const buildLikePattern = (keyword) => `%${keyword.toLowerCase()}%`;

const scopeCaseFilter = (advocateId, alias = 'case') => {
  const caseWhere = {};
  if (advocateId != null) {
    caseWhere.advocateId = advocateId;
  }
  return {
    model: Case,
    as: alias,
    attributes: ['id', 'caseNo'],
    where: caseWhere,
    required: true,
  };
};

const searchNotes = async ({ keyword, limit, advocateId }) => {
  const noteWhere = {
    [Op.and]: [where(fn('LOWER', col('CaseDiary.note')), { [Op.like]: buildLikePattern(keyword) })],
  };

  const rows = await CaseDiary.findAll({
    where: noteWhere,
    attributes: ['id', 'note'],
    include: [scopeCaseFilter(advocateId, 'case')],
    order: [['id', 'DESC']],
    limit,
    subQuery: false,
  });

  return rows.map((row) => {
    const plain = row.get({ plain: true });
    return {
      documentId: plain.id,
      type: 'NOTE',
      name: plain.case?.caseNo ? `Note - ${plain.case.caseNo}` : `Note - ${plain.id}`,
      snippet: createSnippet(plain.note, keyword),
    };
  });
};

const searchDocuments = async ({ keyword, limit, advocateId }) => {
  const documentWhere = {
    [Op.and]: [
      where(fn('LOWER', col('Document.search_content')), { [Op.like]: buildLikePattern(keyword) }),
    ],
  };

  let rows = [];
  try {
    rows = await Document.findAll({
      where: documentWhere,
      attributes: ['id', 'name', 'searchContent'],
      include: [
        {
          ...scopeCaseFilter(advocateId, 'case'),
          attributes: ['id'],
        },
      ],
      order: [['id', 'DESC']],
      limit,
      subQuery: false,
    });
  } catch (error) {
    if (!isMissingSearchContentColumnError(error)) throw error;
    return [];
  }

  return rows.map((row) => {
    const plain = row.get({ plain: true });
    return {
      documentId: plain.id,
      type: 'DOCUMENT',
      name: plain.name,
      snippet: createSnippet(plain.searchContent, keyword),
    };
  });
};

const searchWithMySqlFullText = async ({ keyword, limit, advocateId }) => {
  const store = tenantContext.getStore() || {};
  const tenantId = store.tenantId;
  const tenantClauseCd = tenantId ? 'AND cd.tenant_id = :tenantId' : '';
  const tenantClauseC = tenantId ? 'AND c.tenant_id = :tenantId' : '';
  
  const advocateClause = advocateId != null ? 'AND c.advocate_id = :advocateId' : '';
  const against = `${keyword}*`;

  const notes = await sequelize.query(
    `
      SELECT
        cd.id AS id,
        cd.note AS content,
        c.case_no AS caseNo
      FROM case_diaries cd
      INNER JOIN cases c ON c.id = cd.case_id
      WHERE MATCH(cd.note) AGAINST(:against IN BOOLEAN MODE)
      ${tenantClauseCd}
      ${tenantClauseC}
      ${advocateClause}
      ORDER BY cd.id DESC
      LIMIT :limit
    `,
    {
      replacements: { against, advocateId, limit, tenantId },
      type: QueryTypes.SELECT,
    }
  );

  const tenantClauseD = tenantId ? 'AND d.tenant_id = :tenantId' : '';

  const documents = await sequelize.query(
    `
      SELECT
        d.id AS id,
        d.name AS name,
        d.search_content AS content
      FROM documents d
      INNER JOIN cases c ON c.id = d.case_id
      WHERE MATCH(d.search_content) AGAINST(:against IN BOOLEAN MODE)
      ${tenantClauseD}
      ${tenantClauseC}
      ${advocateClause}
      ORDER BY d.id DESC
      LIMIT :limit
    `,
    {
      replacements: { against, advocateId, limit, tenantId },
      type: QueryTypes.SELECT,
    }
  );

  return {
    notes: notes.map((row) => ({
      documentId: row.id,
      type: 'NOTE',
      name: row.caseNo ? `Note - ${row.caseNo}` : `Note - ${row.id}`,
      snippet: createSnippet(row.content, keyword),
    })),
    documents: documents.map((row) => ({
      documentId: row.id,
      type: 'DOCUMENT',
      name: row.name,
      snippet: createSnippet(row.content, keyword),
    })),
  };
};

const searchNotesAndDocuments = async ({ keyword, limit, advocateId }) => {
  const boundedLimit = Math.max(1, Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT));
  const lowerKeyword = String(keyword || '').trim().toLowerCase();

  let notes = [];
  let documents = [];

  if (SEARCH_ENGINE === 'mysql_fulltext') {
    try {
      const fullTextResult = await searchWithMySqlFullText({
        keyword: lowerKeyword,
        limit: boundedLimit,
        advocateId,
      });
      notes = fullTextResult.notes;
      documents = fullTextResult.documents;
    } catch {
      const fallback = await Promise.all([
        searchNotes({ keyword: lowerKeyword, limit: boundedLimit, advocateId }),
        searchDocuments({ keyword: lowerKeyword, limit: boundedLimit, advocateId }),
      ]);
      [notes, documents] = fallback;
    }
  } else {
    const fallback = await Promise.all([
      searchNotes({ keyword: lowerKeyword, limit: boundedLimit, advocateId }),
      searchDocuments({ keyword: lowerKeyword, limit: boundedLimit, advocateId }),
    ]);
    [notes, documents] = fallback;
  }

  return {
    keyword: lowerKeyword,
    total: notes.length + documents.length,
    notes,
    documents,
    results: [...notes, ...documents],
  };
};

module.exports = {
  searchNotesAndDocuments,
};
