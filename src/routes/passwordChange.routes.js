const express = require('express');
const router = express.Router();
const passwordChangeController = require('../controllers/passwordChange.controller');
const { requireAuth } = require('../middleware/auth');

// Inline admin guard
const requireAdmin = (req, res, next) => {
  if (req.session.user?.role !== 'ADMIN')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

// Any authenticated user can submit a change request
router.post('/', requireAuth, (req, res) => passwordChangeController.request(req, res));

// Admin-only routes
router.get('/', requireAuth, requireAdmin, (req, res) => passwordChangeController.list(req, res));
router.get('/pending', requireAuth, requireAdmin, (req, res) => passwordChangeController.listPending(req, res));
router.get('/:id', requireAuth, requireAdmin, (req, res) => passwordChangeController.getById(req, res));
router.post('/:id/approve', requireAuth, requireAdmin, (req, res) => passwordChangeController.approve(req, res));
router.post('/:id/reject', requireAuth, requireAdmin, (req, res) => passwordChangeController.reject(req, res));

module.exports = router;
