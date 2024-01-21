const express = require('express');
const { getTour, fetchAllTourSlugs } = require('../controllers/viewsController');
const router = express.Router();

router.get('/tour/:slug', getTour)

module.exports = router;
