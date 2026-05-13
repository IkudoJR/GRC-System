const dashboardService = require('../services/dashboard.service');

class DashboardController {
  async getStats(req, res) {
    try {
      const stats = await dashboardService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new DashboardController();
