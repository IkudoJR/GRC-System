const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAdmin } = require('../middleware/auth');

// All user management routes require admin access
router.get('/', requireAdmin, (req, res) => userController.getAll(req, res));
router.get('/:id', requireAdmin, (req, res) => userController.getById(req, res));
router.post('/', requireAdmin, (req, res) => userController.create(req, res));
router.put('/:id', requireAdmin, (req, res) => userController.update(req, res));
router.delete('/:id', requireAdmin, (req, res) => userController.delete(req, res));
router.get('/:id/permissions', requireAdmin, (req, res) => userController.getPermissions(req, res));
router.put('/:id/permissions', requireAdmin, (req, res) => userController.updatePermissions(req, res));

module.exports = router;
