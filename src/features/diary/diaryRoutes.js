const express = require('express');
const diaryController = require('./diaryController');
const {
  createDiaryRules,
  updateDiaryRules,
  diaryIdParamRules,
} = require('./diaryValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const upload = require('../../middleware/upload');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('diary', 'V'), diaryController.getAllDiaries)
  .post(
    authorizePermission('diary', 'E'),
    upload.array('files', 10),
    ...createDiaryRules,
    validate,
    diaryController.createDiary
  );

router
  .route('/:id')
  .get(
    authorizePermission('diary', 'V'),
    ...diaryIdParamRules,
    validate,
    diaryController.getDiaryById
  )
  .put(
    authorizePermission('diary', 'E'),
    upload.array('files', 10),
    ...updateDiaryRules,
    validate,
    diaryController.updateDiary
  )
  .delete(
    authorizePermission('diary', 'E'),
    ...diaryIdParamRules,
    validate,
    diaryController.deleteDiary
  );

module.exports = router;
