const complianceService = require('../services/compliance.service');

class ComplianceController {
  async getAll(req, res) {
    try {
      const { search } = req.query;
      const isAdmin = req.session.user?.role === 'ADMIN';
      const items = await complianceService.findAll(search, isAdmin);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const isAdmin = req.session.user?.role === 'ADMIN';
      const item = await complianceService.findById(req.params.id, isAdmin);
      res.json(item);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const item = await complianceService.create(req.body);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const username = req.session.user?.username || 'System';
      const item = await complianceService.update(req.params.id, req.body, username);
      res.json(item);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const username = req.session.user?.username || 'System';
      await complianceService.delete(req.params.id, username);
      res.json({ message: 'Compliance requirement deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ComplianceController();
