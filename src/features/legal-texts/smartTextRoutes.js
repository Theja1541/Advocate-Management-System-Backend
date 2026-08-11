const express = require('express');
const router = express.Router();
const smartTextController = require('./smartTextController');
const { protect } = require('../../middleware/auth');

router.use(protect);

router.get('/search', smartTextController.search);
router.post('/group', smartTextController.group);
router.post('/append', smartTextController.append);

module.exports = router;
