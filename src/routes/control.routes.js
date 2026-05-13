const express = require('express');
const router = express.Router();
const controlController = require('../controllers/control.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.get('/', requireAuth, requirePermission('CONTROL', 'read'), (req, res) => controlController.getAll(req, res));
router.get('/:id', requireAuth, requirePermission('CONTROL', 'read'), (req, res) => controlController.getById(req, res));
router.post('/', requireAuth, requirePermission('CONTROL', 'create'), (req, res) => controlController.create(req, res));
router.put('/:id', requireAuth, requirePermission('CONTROL', 'update'), (req, res) => controlController.update(req, res));
router.delete('/:id', requireAuth, requirePermission('CONTROL', 'delete'), (req, res) => controlController.delete(req, res));

module.exports = router;
