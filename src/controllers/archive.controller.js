const archiveService = require('../services/archive.service');

class ArchiveController {
  async list(req, res) {
    try {
      const archives = await archiveService.list();
      res.json(archives);
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  async delete(req, res) {
    try {
      await archiveService.setReviewer(req.session.user);
      await archiveService.delete(req.params.id);
      res.json({ message: 'Deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }

  async getById(req, res) {
    try {
      const archive = await archiveService.getById(req.params.id);
      res.json(archive);
    } catch (err) { res.status(404).json({ error: err.message }); }
  }

  async restore(req, res) {
    try {
      await archiveService.setReviewer(req.session.user);
      await archiveService.restore(req.params.id);
      res.status(200).json({ message: 'Restored successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  }
}

module.exports = new ArchiveController();
