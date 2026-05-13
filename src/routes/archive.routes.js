const express = require('express');
const router = express.Router();
const archiveController = require('../controllers/archive.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

// Only allow ADMIN to access archives
const requireAdmin = (req, res, next) => {
  if (req.session.user?.role !== 'ADMIN') return res.status(403).json({ error: 'Admin access required' });
  next();
};

router.use(requireAuth);
router.use(requireAdmin);

router.get('/', archiveController.list);
router.get('/:id', archiveController.getById);
router.post('/:id/restore', archiveController.restore);
router.delete('/:id', archiveController.delete);

module.exports = router;
