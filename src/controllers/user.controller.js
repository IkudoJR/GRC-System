const userService = require('../services/user.service');

class UserController {
  async getAll(req, res) {
    try {
      const users = await userService.findAll();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const user = await userService.findById(req.params.id);
      res.json(user);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const targetUserId = parseInt(req.params.id);
      const currentUser = req.session.user;
      const targetUser = await userService.findById(targetUserId);
      if (targetUser.role === 'ADMIN' && targetUserId !== currentUser.id) {
         return res.status(403).json({ error: 'You cannot edit other admins' });
      }
      if (targetUserId === currentUser.id && req.body.role && req.body.role !== targetUser.role) {
         return res.status(403).json({ error: 'You cannot change your own role' });
      }
      const user = await userService.update(req.params.id, req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const targetUserId = parseInt(req.params.id);
      const currentUser = req.session.user;
      if (targetUserId === currentUser.id) {
         return res.status(403).json({ error: 'You cannot delete your own account' });
      }
      const targetUser = await userService.findById(targetUserId);
      await userService.delete(req.params.id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getPermissions(req, res) {
    try {
      const permissions = await userService.getPermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updatePermissions(req, res) {
    try {
      const permissions = await userService.updatePermissions(req.params.id, req.body.permissions);
      res.json(permissions);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new UserController();
