const prisma = require('../lib/db');

class RiskService {
  async findAll(search = '', isAdmin = false) {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    if (!isAdmin) where.isHidden = false;

    return prisma.risk.findMany({
      where,
      include: {
        assets: { include: { asset: true } },
        controls: { include: { control: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id, isAdmin = false) {
    const risk = await prisma.risk.findUnique({
      where: { id: parseInt(id) },
      include: {
        assets: { include: { asset: true } },
        controls: {
          include: {
            control: {
              include: {
                compliances: {
                  include: { compliance: true }
                }
              }
            }
          }
        }
      }
    });

    if (!risk || (!isAdmin && risk.isHidden)) throw new Error('Risk not found');
    return risk;
  }

  async create(data) {
    if (!data.name || !data.name.trim() || !data.description || !data.description.trim()) {
      throw new Error('Name and description are required');
    }
    const { assetIds, controlIds, ...riskData } = data;
    return prisma.risk.create({
      data: {
        ...riskData,
        assets: assetIds?.length
          ? { create: assetIds.map(assetId => ({ assetId })) }
          : undefined,
        controls: controlIds?.length
          ? { create: controlIds.map(controlId => ({ controlId })) }
          : undefined
      },
      include: {
        assets: { include: { asset: true } },
        controls: { include: { control: true } }
      }
    });
  }

  async update(id, data, username = 'System') {
    if (data.name !== undefined && (!data.name || !data.name.trim())) throw new Error('Name cannot be empty');
    if (data.description !== undefined && (!data.description || !data.description.trim())) throw new Error('Description cannot be empty');
    
    const existing = await this.findById(id, true);
    await prisma.archive.create({ data: { entityType: 'RISK', action: 'UPDATE', entityId: existing.id, entityName: existing.name, changedBy: username, originalData: existing } });
    const { assetIds, controlIds, ...riskData } = data;

    return prisma.$transaction(async (tx) => {
      if (assetIds !== undefined) {
        await tx.assetRisk.deleteMany({ where: { riskId: parseInt(id) } });
        if (assetIds.length > 0) {
          await tx.assetRisk.createMany({
            data: assetIds.map(assetId => ({ assetId, riskId: parseInt(id) }))
          });
        }
      }

      if (controlIds !== undefined) {
        await tx.riskControl.deleteMany({ where: { riskId: parseInt(id) } });
        if (controlIds.length > 0) {
          await tx.riskControl.createMany({
            data: controlIds.map(controlId => ({ controlId, riskId: parseInt(id) }))
          });
        }
      }

      return tx.risk.update({
        where: { id: parseInt(id) },
        data: riskData,
        include: {
          assets: { include: { asset: true } },
          controls: { include: { control: true } }
        }
      });
    });
  }

  async delete(id, username = 'System') {
    const existing = await this.findById(id, true);
    await prisma.archive.create({ data: { entityType: 'RISK', action: 'DELETE', entityId: existing.id, entityName: existing.name, changedBy: username, originalData: existing } });
    return prisma.risk.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new RiskService();
