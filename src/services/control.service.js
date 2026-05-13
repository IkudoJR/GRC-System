const prisma = require('../lib/db');

class ControlService {
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

    return prisma.securityControl.findMany({
      where,
      include: {
        risks: { include: { risk: true } },
        compliances: { include: { compliance: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id, isAdmin = false) {
    const control = await prisma.securityControl.findUnique({
      where: { id: parseInt(id) },
      include: {
        risks: {
          include: {
            risk: {
              include: {
                assets: { include: { asset: true } }
              }
            }
          }
        },
        compliances: { include: { compliance: true } }
      }
    });

    if (!control || (!isAdmin && control.isHidden)) throw new Error('Security Control not found');
    return control;
  }

  async create(data) {
    if (!data.name || !data.name.trim() || !data.description || !data.description.trim()) {
      throw new Error('Name and description are required');
    }
    const { riskIds, complianceIds, ...controlData } = data;
    return prisma.securityControl.create({
      data: {
        ...controlData,
        risks: riskIds?.length
          ? { create: riskIds.map(riskId => ({ riskId })) }
          : undefined,
        compliances: complianceIds?.length
          ? { create: complianceIds.map(complianceId => ({ complianceId })) }
          : undefined
      },
      include: {
        risks: { include: { risk: true } },
        compliances: { include: { compliance: true } }
      }
    });
  }

  async update(id, data, username = 'System') {
    if (data.name !== undefined && (!data.name || !data.name.trim())) throw new Error('Name cannot be empty');
    if (data.description !== undefined && (!data.description || !data.description.trim())) throw new Error('Description cannot be empty');
    
    const existing = await this.findById(id, true);
    await prisma.archive.create({ data: { entityType: 'CONTROL', action: 'UPDATE', entityId: existing.id, entityName: existing.name, changedBy: username, originalData: existing } });
    const { riskIds, complianceIds, ...controlData } = data;

    return prisma.$transaction(async (tx) => {
      if (riskIds !== undefined) {
        await tx.riskControl.deleteMany({ where: { controlId: parseInt(id) } });
        if (riskIds.length > 0) {
          await tx.riskControl.createMany({
            data: riskIds.map(riskId => ({ riskId, controlId: parseInt(id) }))
          });
        }
      }

      if (complianceIds !== undefined) {
        await tx.controlCompliance.deleteMany({ where: { controlId: parseInt(id) } });
        if (complianceIds.length > 0) {
          await tx.controlCompliance.createMany({
            data: complianceIds.map(complianceId => ({ complianceId, controlId: parseInt(id) }))
          });
        }
      }

      return tx.securityControl.update({
        where: { id: parseInt(id) },
        data: controlData,
        include: {
          risks: { include: { risk: true } },
          compliances: { include: { compliance: true } }
        }
      });
    });
  }

  async delete(id, username = 'System') {
    const existing = await this.findById(id, true);
    await prisma.archive.create({ data: { entityType: 'CONTROL', action: 'DELETE', entityId: existing.id, entityName: existing.name, changedBy: username, originalData: existing } });
    return prisma.securityControl.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new ControlService();
