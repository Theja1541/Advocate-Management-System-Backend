const diaryService = require('./diaryService');
const logger = require('../../config/logger');
const { requireAdvocateScope } = require('../../utils/advocateScope');

exports.getAllDiaries = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const diaries = await diaryService.getAllDiaries({ advocateId });
    res.status(200).json({
      status: 'success',
      data: { diaries },
    });
  } catch (error) {
    logger.error('GetAllDiaries error:', error);
    next(error);
  }
};

exports.getDiaryById = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const diary = await diaryService.getDiaryById(req.params.id, { advocateId });
    res.status(200).json({
      status: 'success',
      data: { diary },
    });
  } catch (error) {
    logger.error('GetDiaryById error:', error);
    next(error);
  }
};

const fs = require('fs').promises;

exports.createDiary = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const diary = await diaryService.createDiary(
      {
        ...req.body,
        createdBy: req.user?.id,
        updatedBy: req.user?.id,
        files: req.files,
      },
      { advocateId }
    );
    res.status(201).json({
      status: 'success',
      data: { diary },
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.path) {
          try {
            await fs.unlink(file.path);
          } catch {
            // ignore
          }
        }
      }
    }
    logger.error('CreateDiary error:', error);
    next(error);
  }
};

exports.updateDiary = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    const diary = await diaryService.updateDiary(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user?.id,
        files: req.files,
      },
      { advocateId }
    );
    res.status(200).json({
      status: 'success',
      data: { diary },
    });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.path) {
          try {
            await fs.unlink(file.path);
          } catch {
            // ignore
          }
        }
      }
    }
    logger.error('UpdateDiary error:', error);
    next(error);
  }
};

exports.deleteDiary = async (req, res, next) => {
  try {
    const advocateId = requireAdvocateScope(req.user);
    await diaryService.deleteDiary(req.params.id, { advocateId });
    res.status(204).send();
  } catch (error) {
    logger.error('DeleteDiary error:', error);
    next(error);
  }
};
