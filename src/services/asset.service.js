const prisma = require('../lib/db');

class AssetService {
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

    return prisma.asset.findMany({
      where,
      include: {
        risks: {
          include: {
            risk: {
              include: {
                controls: {
                  include: {
                    control: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id, isAdmin = false) {
    const asset = await prisma.asset.findUnique({
      where: { id: parseInt(id) },
      include: {
        risks: {
          include: {
            risk: {
              include: {
                controls: {
                  include: {
                    control: {
                      include: {
                        compliances: {
                          include: {
                            compliance: true
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!asset || (!isAdmin && asset.isHidden)) throw new Error('Asset not found');
    return asset;
  }

  async create(data) {
    if (!data.name || !data.name.trim() || !data.description || !data.description.trim()) {
      throw new Error('Name and description are required');
    }
    const { riskIds, ...assetData } = data;
    return prisma.asset.create({
      data: {
        ...assetData,
        risks: riskIds?.length
          ? { create: riskIds.map(riskId => ({ riskId })) }
          : undefined
      },
      include: { risks: { include: { risk: true } } }
    });
  }

  async update(id, data, username = 'System') {
    if (data.name !== undefined && (!data.name || !data.name.trim())) throw new Error('Name cannot be empty');
    if (data.description !== undefined && (!data.description || !data.description.trim())) throw new Error('Description cannot be empty');
    
    const existing = await this.findById(id, true);
    await prisma.archive.create({ data: { entityType: 'ASSET', action: 'UPDATE', entityId: existing.id, entityName: existing.name, changedBy: username, originalData: existing } });
    const { riskIds, ...assetData } = data;

    // Update asset and relations in a transaction
    return prisma.$transaction(async (tx) => {
      if (riskIds !== undefined) {
        await tx.assetRisk.deleteMany({ where: { assetId: parseInt(id) } });
        if (riskIds.length > 0) {
          await tx.assetRisk.createMany({
            data: riskIds.map(riskId => ({ assetId: parseInt(id), riskId }))
          });
        }
      }

      return tx.asset.update({
        where: { id: parseInt(id) },
        data: assetData,
        include: { risks: { include: { risk: true } } }
      });
    });
  }

  async delete(id, username = 'System') {
    const existing = await this.findById(id, true);
    await prisma.archive.create({ data: { entityType: 'ASSET', action: 'DELETE', entityId: existing.id, entityName: existing.name, changedBy: username, originalData: existing } });
    return prisma.asset.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new AssetService();
