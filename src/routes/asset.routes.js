const express = require('express');
const router = express.Router();
const assetController = require('../controllers/asset.controller');
const { requireAuth } = require('../middleware/auth');
const { requirePermission } = require('../middleware/permission');

router.get('/', requireAuth, requirePermission('ASSET', 'read'), (req, res) => assetController.getAll(req, res));
router.get('/:id', requireAuth, requirePermission('ASSET', 'read'), (req, res) => assetController.getById(req, res));
router.post('/', requireAuth, requirePermission('ASSET', 'create'), (req, res) => assetController.create(req, res));
router.put('/:id', requireAuth, requirePermission('ASSET', 'update'), (req, res) => assetController.update(req, res));
router.delete('/:id', requireAuth, requirePermission('ASSET', 'delete'), (req, res) => assetController.delete(req, res));

module.exports = router;
