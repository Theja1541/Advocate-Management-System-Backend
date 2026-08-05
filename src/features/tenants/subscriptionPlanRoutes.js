const express = require('express');
const subscriptionPlanController = require('./subscriptionPlanController');
const { protect } = require('../../middleware/auth');
const checkRole = require('../../middleware/checkRole');

const router = express.Router();

// Only Super Admin can manage subscription plans
router.use(protect);
router.use(checkRole('Super Admin'));

router.route('/')
  .get(subscriptionPlanController.getAllPlans)
  .post(subscriptionPlanController.createPlan);

router.route('/:id')
  .get(subscriptionPlanController.getPlanById)
  .put(subscriptionPlanController.updatePlan)
  .delete(subscriptionPlanController.deletePlan);

module.exports = router;
