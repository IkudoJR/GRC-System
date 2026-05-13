const prisma = require('../lib/db');

class DashboardService {
  async getStats() {
    const [
      totalAssets,
      totalRisks,
      totalControls,
      totalCompliance,
      totalUsers,
      risksBySeverity,
      controlsByStatus,
      complianceByStatus,
      assetsByClassification,
      recentAssets,
      recentRisks
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.risk.count(),
      prisma.securityControl.count(),
      prisma.compliance.count(),
      prisma.user.count(),
      prisma.risk.groupBy({ by: ['severity'], _count: true }),
      prisma.securityControl.groupBy({ by: ['status'], _count: true }),
      prisma.compliance.groupBy({ by: ['status'], _count: true }),
      prisma.asset.groupBy({ by: ['classification'], _count: true }),
      prisma.asset.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, status: true, createdAt: true } }),
      prisma.risk.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, severity: true, status: true, createdAt: true } })
    ]);

    return {
      counts: { totalAssets, totalRisks, totalControls, totalCompliance, totalUsers },
      risksBySeverity: risksBySeverity.reduce((acc, r) => { acc[r.severity] = r._count; return acc; }, {}),
      controlsByStatus: controlsByStatus.reduce((acc, c) => { acc[c.status] = c._count; return acc; }, {}),
      complianceByStatus: complianceByStatus.reduce((acc, c) => { acc[c.status] = c._count; return acc; }, {}),
      assetsByClassification: assetsByClassification.reduce((acc, a) => { acc[a.classification] = a._count; return acc; }, {}),
      recentAssets,
      recentRisks
    };
  }
}

module.exports = new DashboardService();
