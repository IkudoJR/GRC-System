const prisma = require('../lib/db');

class ComplianceService {
  async findAll(search = '', isAdmin = false) {
    const where = search
      ? {
          OR: [
            { requirement: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {};

    if (!isAdmin) where.isHidden = false;

    return prisma.compliance.findMany({
      where,
      include: {
        controls: {
          include: {
            control: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findById(id, isAdmin = false) {
    const compliance = await prisma.compliance.findUnique({
      where: { id: parseInt(id) },
      include: {
        controls: {
          include: {
            control: {
              include: {
                risks: {
                  include: {
                    risk: {
                      include: {
                        assets: { include: { asset: true } }
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

    if (!compliance || (!isAdmin && compliance.isHidden)) throw new Error('Compliance requirement not found');
    return compliance;
  }

  async create(data) {
    if (!data.requirement || !data.requirement.trim() || !data.description || !data.description.trim()) {
      throw new Error('Requirement and description are required');
    }
    const { controlIds, ...complianceData } = data;
    return prisma.compliance.create({
      data: {
        ...complianceData,
        controls: controlIds?.length
          ? { create: controlIds.map(controlId => ({ controlId })) }
          : undefined
      },
      include: {
        controls: { include: { control: true } }
      }
    });
  }

  async update(id, data, username = 'System') {
    if (data.requirement !== undefined && (!data.requirement || !data.requirement.trim())) throw new Error('Requirement cannot be empty');
    if (data.description !== undefined && (!data.description || !data.description.trim())) throw new Error('Description cannot be empty');
    
    const existing = await this.findById(id, true);
    await prisma.archive.create({ data: { entityType: 'COMPLIANCE', action: 'UPDATE', entityId: existing.id, entityName: existing.requirement, changedBy: username, originalData: existing } });
    const { controlIds, ...complianceData } = data;

    return prisma.$transaction(async (tx) => {
      if (controlIds !== undefined) {
        await tx.controlCompliance.deleteMany({ where: { complianceId: parseInt(id) } });
        if (controlIds.length > 0) {
          await tx.controlCompliance.createMany({
            data: controlIds.map(controlId => ({ controlId, complianceId: parseInt(id) }))
          });
        }
      }

      return tx.compliance.update({
        where: { id: parseInt(id) },
        data: complianceData,
        include: {
          controls: { include: { control: true } }
        }
      });
    });
  }

  async delete(id, username = 'System') {
    const existing = await this.findById(id, true);
    await prisma.archive.create({ data: { entityType: 'COMPLIANCE', action: 'DELETE', entityId: existing.id, entityName: existing.requirement, changedBy: username, originalData: existing } });
    return prisma.compliance.delete({ where: { id: parseInt(id) } });
  }
}

module.exports = new ComplianceService();
