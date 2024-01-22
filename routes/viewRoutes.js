const express = require('express');
const { getTour, getOverview } = require('../controllers/viewsController');
const router = express.Router();

router.get('/', getOverview)
router.get('/tour/:slug', getTour)

module.exports = router;
