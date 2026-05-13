const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');

router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', requireAuth, (req, res) => authController.logout(req, res));
router.get('/me', requireAuth, (req, res) => authController.me(req, res));

module.exports = router;
