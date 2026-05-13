const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.get('/', requireAuth, requirePermission('RISK', 'read'), (req, res) => riskController.getAll(req, res));
router.get('/:id', requireAuth, requirePermission('RISK', 'read'), (req, res) => riskController.getById(req, res));
router.post('/', requireAuth, requirePermission('RISK', 'create'), (req, res) => riskController.create(req, res));
router.put('/:id', requireAuth, requirePermission('RISK', 'update'), (req, res) => riskController.update(req, res));
router.delete('/:id', requireAuth, requirePermission('RISK', 'delete'), (req, res) => riskController.delete(req, res));

module.exports = router;
