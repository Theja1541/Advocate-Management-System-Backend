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
  .get(authorizePermission('hearings', 'V'), diaryController.getAllDiaries)
  .post(
    authorizePermission('hearings', 'E'),
    upload.array('files', 10),
    ...createDiaryRules,
    validate,
    diaryController.createDiary
  );

router
  .route('/:id')
  .get(
    authorizePermission('hearings', 'V'),
    ...diaryIdParamRules,
    validate,
    diaryController.getDiaryById
  )
  .put(
    authorizePermission('hearings', 'E'),
    upload.array('files', 10),
    ...updateDiaryRules,
    validate,
    diaryController.updateDiary
  )
  .delete(
    authorizePermission('hearings', 'E'),
    ...diaryIdParamRules,
    validate,
    diaryController.deleteDiary
  );

module.exports = router;
