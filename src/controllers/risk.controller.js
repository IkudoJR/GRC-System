const riskService = require('../services/risk.service');

class RiskController {
  async getAll(req, res) {
    try {
      const { search } = req.query;
      const isAdmin = req.session.user?.role === 'ADMIN';
      const risks = await riskService.findAll(search, isAdmin);
      res.json(risks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const isAdmin = req.session.user?.role === 'ADMIN';
      const risk = await riskService.findById(req.params.id, isAdmin);
      res.json(risk);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const risk = await riskService.create(req.body);
      res.status(201).json(risk);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const username = req.session.user?.username || 'System';
      const risk = await riskService.update(req.params.id, req.body, username);
      res.json(risk);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const username = req.session.user?.username || 'System';
      await riskService.delete(req.params.id, username);
      res.json({ message: 'Risk deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new RiskController();
