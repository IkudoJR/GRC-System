const prisma = require('../lib/db');

class ArchiveService {
  // Store the reviewer for the next operation (approve/delete)
  setReviewer(user) {
    this.currentReviewer = user ? { username: user.username } : null;
  }

  async list() {
    return prisma.archive.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getById(id) {
    const archive = await prisma.archive.findUnique({ where: { id: parseInt(id) } });
    if (!archive) throw new Error('Archive not found');
    return archive;
  }

  // Instead of hard‑deleting, we mark the archive as reviewed (approved)
  async delete(id) {
    const reviewer = this.currentReviewer?.username || null;
    return await prisma.archive.update({
      where: { id: parseInt(id) },
      data: {
        reviewStatus: 'APPROVED',
        reviewedBy: reviewer,
        reviewedAt: new Date()
      }
    });
  }

  async restore(id) {
    const archive = await prisma.archive.findUnique({ where: { id: parseInt(id) } });
    if (!archive) throw new Error('Archive not found');

    const data = archive.originalData;
    const eId = archive.entityId;

    if (archive.entityType === 'ASSET') {
      const { id: _, risks, createdAt, updatedAt, ...rest } = data;
      if (archive.action === 'DELETE') {
        await prisma.asset.create({
          data: { ...rest, id: eId, risks: { create: (risks||[]).map(r => ({ riskId: r.riskId })) } }
        });
      } else {
        await prisma.assetRisk.deleteMany({ where: { assetId: eId } });
        await prisma.asset.update({
          where: { id: eId },
          data: { ...rest, risks: { create: (risks||[]).map(r => ({ riskId: r.riskId })) } }
        });
      }
    } else if (archive.entityType === 'RISK') {
      const { id: _, assets, controls, createdAt, updatedAt, ...rest } = data;
      if (archive.action === 'DELETE') {
        await prisma.risk.create({
          data: { ...rest, id: eId, 
            assets: { create: (assets||[]).map(a => ({ assetId: a.assetId })) },
            controls: { create: (controls||[]).map(c => ({ controlId: c.controlId })) }
          }
        });
      } else {
        await prisma.assetRisk.deleteMany({ where: { riskId: eId } });
        await prisma.riskControl.deleteMany({ where: { riskId: eId } });
        await prisma.risk.update({
          where: { id: eId },
          data: { ...rest, 
            assets: { create: (assets||[]).map(a => ({ assetId: a.assetId })) },
            controls: { create: (controls||[]).map(c => ({ controlId: c.controlId })) }
          }
        });
      }
    } else if (archive.entityType === 'CONTROL') {
      const { id: _, risks, compliances, createdAt, updatedAt, ...rest } = data;
      if (archive.action === 'DELETE') {
        await prisma.securityControl.create({
          data: { ...rest, id: eId, 
            risks: { create: (risks||[]).map(r => ({ riskId: r.riskId })) },
            compliances: { create: (compliances||[]).map(c => ({ complianceId: c.complianceId })) }
          }
        });
      } else {
        await prisma.riskControl.deleteMany({ where: { controlId: eId } });
        await prisma.controlCompliance.deleteMany({ where: { controlId: eId } });
        await prisma.securityControl.update({
          where: { id: eId },
          data: { ...rest, 
            risks: { create: (risks||[]).map(r => ({ riskId: r.riskId })) },
            compliances: { create: (compliances||[]).map(c => ({ complianceId: c.complianceId })) }
          }
        });
      }
    } else if (archive.entityType === 'COMPLIANCE') {
      const { id: _, controls, createdAt, updatedAt, ...rest } = data;
      if (archive.action === 'DELETE') {
        await prisma.compliance.create({
          data: { ...rest, id: eId, 
            controls: { create: (controls||[]).map(c => ({ controlId: c.controlId })) }
          }
        });
      } else {
        await prisma.controlCompliance.deleteMany({ where: { complianceId: eId } });
        await prisma.compliance.update({
          where: { id: eId },
          data: { ...rest, 
            controls: { create: (controls||[]).map(c => ({ controlId: c.controlId })) }
          }
        });
      }
    }

    // Record the review (approved) after successful restore
    const reviewer = this.currentReviewer?.username || null;
    await prisma.archive.update({
      where: { id: archive.id },
      data: {
        reviewStatus: 'RESTORED',
        reviewedBy: reviewer,
        reviewedAt: new Date()
      }
    });
  }
}

module.exports = new ArchiveService();
