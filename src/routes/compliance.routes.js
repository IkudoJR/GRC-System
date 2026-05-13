const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/compliance.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.get('/', requireAuth, requirePermission('COMPLIANCE', 'read'), (req, res) => complianceController.getAll(req, res));
router.get('/:id', requireAuth, requirePermission('COMPLIANCE', 'read'), (req, res) => complianceController.getById(req, res));
router.post('/', requireAuth, requirePermission('COMPLIANCE', 'create'), (req, res) => complianceController.create(req, res));
router.put('/:id', requireAuth, requirePermission('COMPLIANCE', 'update'), (req, res) => complianceController.update(req, res));
router.delete('/:id', requireAuth, requirePermission('COMPLIANCE', 'delete'), (req, res) => complianceController.delete(req, res));

module.exports = router;
