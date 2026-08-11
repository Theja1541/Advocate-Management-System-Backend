const { Op } = require('sequelize');
const { sequelize } = require('../../config/database');
const PhraseGroup = require('./PhraseGroup');
const PhraseOccurrence = require('./PhraseOccurrence');
const LegalText = require('./LegalText');
const Document = require('../documents/Document');
const CaseDiary = require('../diary/CaseDiary');
const Opinion = require('../opinions/Opinion');
const AppError = require('../../utils/AppError');

// Helper to escape regex
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const extractOccurrences = (content, title, sourceType, sourceId, searchPhrase, phraseGroupId, phraseGroupPhrase) => {
  if (!content) return [];
  const results = [];
  const safePhrase = escapeRegExp(searchPhrase);
  const regex = new RegExp(safePhrase, 'gi');
  let match;
  let occurrenceIndex = 1;

  while ((match = regex.exec(content)) !== null) {
    const matchIndex = match.index;
    const matchedText = match[0];
    
    // Extract snippet around the match
    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(content.length, matchIndex + matchedText.length + 50);
    const snippet = '...' + content.substring(start, end).replace(/\n/g, ' ') + '...';
    
    results.push({
      sourceType,
      sourceId,
      title,
      matchedPhrase: matchedText,
      occurrenceIndex: occurrenceIndex++,
      snippet
    });
  }
  return results;
};

exports.search = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(200).json({ status: 'success', data: { query: q, occurrences: [] } });
    }

    const tenantId = req.user.tenantId;
    const lowerQuery = q.toLowerCase();

    // 1. Search PhraseGroups for exact match
    const phraseGroup = await PhraseGroup.findOne({
      where: { tenantId, phrase: lowerQuery }
    });

    let explicitOccurrences = [];
    if (phraseGroup) {
      explicitOccurrences = await PhraseOccurrence.findAll({
        where: { phraseGroupId: phraseGroup.id, tenantId }
      });
    }

    // Helper to check if explicitly linked
    const isLinked = (type, id) => {
      return explicitOccurrences.some(eo => eo.sourceType === type && eo.sourceId === id);
    };

    const allOccurrences = [];

    // 2. Search LegalTexts
    const legalTexts = await LegalText.findAll({
      where: { tenantId, content: { [Op.like]: `%${q}%` } },
      attributes: ['id', 'title', 'content']
    });
    legalTexts.forEach(lt => {
      const occurrences = extractOccurrences(lt.content, lt.title, 'LegalText', lt.id, q);
      occurrences.forEach(o => {
        o.isExplicitlyLinked = isLinked('LegalText', lt.id);
        o.phraseGroupId = phraseGroup ? phraseGroup.id : null;
        allOccurrences.push(o);
      });
    });

    // 3. Search Documents
    const documents = await Document.findAll({
      where: { tenantId, searchContent: { [Op.like]: `%${q}%` } },
      attributes: ['id', 'name', 'searchContent']
    });
    documents.forEach(doc => {
      const occurrences = extractOccurrences(doc.searchContent, doc.name, 'Document', doc.id, q);
      occurrences.forEach(o => {
        o.isExplicitlyLinked = isLinked('Document', doc.id);
        o.phraseGroupId = phraseGroup ? phraseGroup.id : null;
        allOccurrences.push(o);
      });
    });

    // 4. Search CaseDiary (Hearings)
    const diaries = await CaseDiary.findAll({
      where: { tenantId, note: { [Op.like]: `%${q}%` } },
      attributes: ['id', 'hearingDate', 'note']
    });
    diaries.forEach(diary => {
      const title = `Hearing on ${diary.hearingDate}`;
      const occurrences = extractOccurrences(diary.note, title, 'CaseDiary', diary.id, q);
      occurrences.forEach(o => {
        o.isExplicitlyLinked = isLinked('CaseDiary', diary.id);
        o.phraseGroupId = phraseGroup ? phraseGroup.id : null;
        allOccurrences.push(o);
      });
    });

    // 5. Search Opinions
    const opinions = await Opinion.findAll({
      where: { tenantId, findingsNote: { [Op.like]: `%${q}%` } },
      attributes: ['id', 'referenceNo', 'findingsNote']
    });
    opinions.forEach(op => {
      const title = `Opinion Ref: ${op.referenceNo}`;
      const occurrences = extractOccurrences(op.findingsNote, title, 'Opinion', op.id, q);
      occurrences.forEach(o => {
        o.isExplicitlyLinked = isLinked('Opinion', op.id);
        o.phraseGroupId = phraseGroup ? phraseGroup.id : null;
        allOccurrences.push(o);
      });
    });

    res.status(200).json({
      status: 'success',
      data: {
        query: q,
        phraseGroup: phraseGroup ? { id: phraseGroup.id, phrase: phraseGroup.phrase } : null,
        occurrences: allOccurrences
      }
    });

  } catch (error) {
    next(error);
  }
};

  exports.group = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { phrase, sourceType, sourceId, selectedExisting } = req.body;
    const tenantId = req.user.tenantId;

    if (!phrase || !sourceType || !sourceId) {
      return next(new AppError('Missing required fields for grouping', 400));
    }

    const lowerPhrase = phrase.toLowerCase();

    // 1. Find or create phrase group
    let phraseGroup = await PhraseGroup.findOne({
      where: { tenantId, phrase: lowerPhrase },
      transaction
    });

    if (!phraseGroup) {
      phraseGroup = await PhraseGroup.create({
        tenantId,
        phrase: lowerPhrase
      }, { transaction });
    }

    // 2. Create phrase occurrence linking for the newly saved record
    await PhraseOccurrence.findOrCreate({
      where: {
        tenantId,
        phraseGroupId: phraseGroup.id,
        sourceType,
        sourceId
      },
      transaction
    });

    // 3. If they specifically selected an existing occurrence to group with, link it too
    if (selectedExisting && selectedExisting.sourceType && selectedExisting.sourceId) {
      await PhraseOccurrence.findOrCreate({
        where: {
          tenantId,
          phraseGroupId: phraseGroup.id,
          sourceType: selectedExisting.sourceType,
          sourceId: selectedExisting.sourceId
        },
        transaction
      });
    }

    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: 'Source grouped with phrase successfully',
      data: {
        phraseGroupId: phraseGroup.id
      }
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

exports.append = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { sourceType, sourceId, occurrenceIndex, matchedPhrase, newText } = req.body;
    const tenantId = req.user.tenantId;

    if (!sourceType || !sourceId || !occurrenceIndex || !matchedPhrase || !newText) {
      return next(new AppError('Missing required fields for appending', 400));
    }

    let Model, contentField;
    if (sourceType === 'LegalText') { Model = LegalText; contentField = 'content'; }
    else if (sourceType === 'CaseDiary') { Model = CaseDiary; contentField = 'note'; }
    else if (sourceType === 'Opinion') { Model = Opinion; contentField = 'findingsNote'; }
    else {
      return next(new AppError('Invalid or unsupported source type for appending', 400));
    }

    const record = await Model.findOne({ where: { id: sourceId, tenantId }, transaction });
    if (!record) {
      await transaction.rollback();
      return next(new AppError('Source not found or access denied', 404));
    }

    const content = record[contentField] || '';
    const safePhrase = escapeRegExp(matchedPhrase);
    const regex = new RegExp(safePhrase, 'gi');
    let match;
    let count = 0;
    let insertionIndex = -1;

    while ((match = regex.exec(content)) !== null) {
      count++;
      if (count === parseInt(occurrenceIndex, 10)) {
        const matchEnd = match.index + match[0].length;
        let nextDoubleNewline = content.indexOf('\n\n', matchEnd);
        if (nextDoubleNewline === -1) {
          let nextSingleNewline = content.indexOf('\n', matchEnd);
          if (nextSingleNewline === -1) {
            insertionIndex = content.length;
          } else {
            insertionIndex = nextSingleNewline;
          }
        } else {
          insertionIndex = nextDoubleNewline;
        }
        break;
      }
    }

    if (insertionIndex === -1) {
      await transaction.rollback();
      return next(new AppError('The selected text has changed. Please search again.', 409));
    }

    const updatedContent = content.slice(0, insertionIndex) + '\n\n' + newText + content.slice(insertionIndex);
    
    record[contentField] = updatedContent;
    await record.save({ transaction });
    await transaction.commit();

    res.status(200).json({
      status: 'success',
      message: 'Text appended successfully'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};
