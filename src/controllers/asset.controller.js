const assetService = require('../services/asset.service');

class AssetController {
  async getAll(req, res) {
    try {
      const { search } = req.query;
      const isAdmin = req.session.user?.role === 'ADMIN';
      const assets = await assetService.findAll(search, isAdmin);
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req, res) {
    try {
      const isAdmin = req.session.user?.role === 'ADMIN';
      const asset = await assetService.findById(req.params.id, isAdmin);
      res.json(asset);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const asset = await assetService.create(req.body);
      res.status(201).json(asset);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const username = req.session.user?.username || 'System';
      const asset = await assetService.update(req.params.id, req.body, username);
      res.json(asset);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async delete(req, res) {
    try {
      const username = req.session.user?.username || 'System';
      await assetService.delete(req.params.id, username);
      res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new AssetController();
