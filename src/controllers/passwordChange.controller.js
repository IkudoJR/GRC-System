const passwordChangeService = require('../services/passwordChange.service');

class PasswordChangeController {
  /** POST /api/password-change — user submits request */
  async request(req, res) {
    try {
      const userId = req.session.user?.id;
      if (!userId) return res.status(401).json({ error: 'Not authenticated' });

      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword)
        return res.status(400).json({ error: 'oldPassword and newPassword are required' });

      await passwordChangeService.requestChange(userId, oldPassword, newPassword);
      res.status(201).json({ message: 'Password change request submitted. Awaiting admin approval.' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /** GET /api/password-change — admin lists all requests (no hashes) */
  async list(req, res) {
    try {
      const requests = await passwordChangeService.listAll();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /** GET /api/password-change/pending — admin lists pending requests */
  async listPending(req, res) {
    try {
      const requests = await passwordChangeService.listPending();
      res.json(requests);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  /** GET /api/password-change/:id — get single request */
  async getById(req, res) {
    try {
      const request = await passwordChangeService.getById(req.params.id);
      res.json(request);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  /** POST /api/password-change/:id/approve — admin approves */
  async approve(req, res) {
    try {
      await passwordChangeService.approve(req.params.id, req.session.user?.id);
      res.json({ message: 'Password change approved and applied.' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /** POST /api/password-change/:id/reject — admin rejects */
  async reject(req, res) {
    try {
      await passwordChangeService.reject(req.params.id, req.session.user?.id);
      res.json({ message: 'Password change request rejected.' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

module.exports = new PasswordChangeController();
