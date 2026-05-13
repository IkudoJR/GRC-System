const controlService = require('../services/control.service');

class ControlController {
  async getAll(req, res) {
    try {
      const { search } = req.query;
      const isAdmin = req.session.user?.role === 'ADMIN';
      const controls = await controlService.findAll(search, isAdmin);
      res.json(controls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const isAdmin = req.session.user?.role === 'ADMIN';
      const control = await controlService.findById(req.params.id, isAdmin);
      res.json(control);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const control = await controlService.create(req.body);
      res.status(201).json(control);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const username = req.session.user?.username || 'System';
      const control = await controlService.update(req.params.id, req.body, username);
      res.json(control);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const username = req.session.user?.username || 'System';
      await controlService.delete(req.params.id, username);
      res.json({ message: 'Security Control deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ControlController();
