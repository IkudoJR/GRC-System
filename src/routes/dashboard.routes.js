const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');

router.get('/stats', requireAuth, (req, res) => dashboardController.getStats(req, res));

module.exports = router;
