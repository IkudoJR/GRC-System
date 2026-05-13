const prisma = require('../lib/db');
const bcrypt = require('bcryptjs');

class PasswordChangeService {
  /**
   * Submit a password change request from a logged-in user.
   * Verifies the old password, hashes both old & new, stores as PENDING.
   */
  async requestChange(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) throw new Error('Current password is incorrect');

    if (!newPassword || newPassword.length < 6)
      throw new Error('New password must be at least 6 characters');

    // Cancel any existing pending request for this user
    await prisma.passwordChangeRequest.deleteMany({
      where: { userId, status: 'PENDING' }
    });

    // We store hashed versions — admin can never see plain-text passwords
    const hashedOld = await bcrypt.hash(oldPassword, 12);
    const hashedNew = await bcrypt.hash(newPassword, 12);

    return prisma.passwordChangeRequest.create({
      data: { userId, hashedOld, hashedNew }
    });
  }

  /** List all requests (admin view) — returns metadata only, no hashes */
  async listAll() {
    const requests = await prisma.passwordChangeRequest.findMany({
      include: { 
        user: { select: { id: true, username: true } },
        reviewedBy: { select: { id: true, username: true } }
      },
      orderBy: { requestedAt: 'desc' }
    });
    return requests.map(({ hashedOld, hashedNew, ...r }) => r);
  }

  /** List pending requests only */
  async listPending() {
    const requests = await prisma.passwordChangeRequest.findMany({
      where: { status: 'PENDING' },
      include: { 
        user: { select: { id: true, username: true } },
        reviewedBy: { select: { id: true, username: true } }
      },
      orderBy: { requestedAt: 'desc' }
    });
    return requests.map(({ hashedOld, hashedNew, ...r }) => r);
  }

  async getById(id) {
    const req = await prisma.passwordChangeRequest.findUnique({
      where: { id: parseInt(id) },
      include: { 
        user: { select: { id: true, username: true } },
        reviewedBy: { select: { id: true, username: true } }
      }
    });
    if (!req) throw new Error('Request not found');
    const { hashedOld, hashedNew, ...safe } = req;
    return safe;
  }

  /** Admin approves: apply the new hashed password and mark APPROVED */
  async approve(id, reviewerId) {
    const req = await prisma.passwordChangeRequest.findUnique({
      where: { id: parseInt(id) }
    });
    if (!req) throw new Error('Request not found');
    if (req.status !== 'PENDING') throw new Error('Request is no longer pending');

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: req.hashedNew }
    });

    return prisma.passwordChangeRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedById: reviewerId ? parseInt(reviewerId) : undefined
      }
    });
  }

  /** Admin rejects: just mark REJECTED, do not change password */
  async reject(id, reviewerId) {
    const req = await prisma.passwordChangeRequest.findUnique({
      where: { id: parseInt(id) }
    });
    if (!req) throw new Error('Request not found');
    if (req.status !== 'PENDING') throw new Error('Request is no longer pending');

    return prisma.passwordChangeRequest.update({
      where: { id: parseInt(id) },
      data: {
        status: 'REJECTED',
        reviewedAt: new Date(),
        reviewedById: reviewerId ? parseInt(reviewerId) : undefined
      }
    });
  }

  /** Get pending request count for a specific user */
  async userHasPending(userId) {
    const count = await prisma.passwordChangeRequest.count({
      where: { userId, status: 'PENDING' }
    });
    return count > 0;
  }
}

module.exports = new PasswordChangeService();
