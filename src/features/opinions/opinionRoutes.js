const express = require('express');
const opinionController = require('./opinionController');
const {
  createOpinionRules,
  updateOpinionRules,
  opinionIdParamRules,
} = require('./opinionValidation');
const { protect } = require('../../middleware/auth');
const authorizePermission = require('../../middleware/authorize');
const validate = require('../../middleware/validate');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(authorizePermission('opinions', 'V'), opinionController.getAllOpinions)
  .post(
    authorizePermission('opinions', 'E'),
    ...createOpinionRules,
    validate,
    opinionController.createOpinion
  );

router
  .route('/:id')
  .get(
    authorizePermission('opinions', 'V'),
    ...opinionIdParamRules,
    validate,
    opinionController.getOpinionById
  )
  .put(
    authorizePermission('opinions', 'E'),
    ...updateOpinionRules,
    validate,
    opinionController.updateOpinion
  )
  .delete(
    authorizePermission('opinions', 'E'),
    ...opinionIdParamRules,
    validate,
    opinionController.deleteOpinion
  );

router.post(
  '/:id/submit',
  authorizePermission('opinions', 'E'),
  ...opinionIdParamRules,
  validate,
  opinionController.submitForReview
);

router.post(
  '/:id/approve',
  authorizePermission('opinions', 'E'),
  ...opinionIdParamRules,
  validate,
  opinionController.approve
);

router.post(
  '/:id/reject',
  authorizePermission('opinions', 'E'),
  ...opinionIdParamRules,
  validate,
  opinionController.reject
);

router.post(
  '/:id/issue',
  authorizePermission('opinions', 'E'),
  ...opinionIdParamRules,
  validate,
  opinionController.issue
);

module.exports = router;
