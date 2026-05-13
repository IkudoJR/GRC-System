const prisma = require('../lib/db');
const bcrypt = require('bcryptjs');

class UserService {
  async findAll() {
    const users = await prisma.user.findMany({
      include: { permissions: true },
      orderBy: { createdAt: 'desc' }
    });
    return users.map(({ password, ...u }) => u);
  }

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { permissions: true }
    });
    if (!user) throw new Error('User not found');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(data) {
    const { username, password, role } = data;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new Error('Username already exists');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: role || 'USER',
        permissions: {
          create: [
            { entity: 'ASSET', canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            { entity: 'RISK', canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            { entity: 'CONTROL', canCreate: true, canRead: true, canUpdate: false, canDelete: false },
            { entity: 'COMPLIANCE', canCreate: true, canRead: true, canUpdate: false, canDelete: false }
          ]
        }
      },
      include: { permissions: true }
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id, data) {
    const updateData = {};
    if (data.username) updateData.username = data.username;
    if (data.role) updateData.role = data.role;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { permissions: true }
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async delete(id) {
    return prisma.user.delete({ where: { id: parseInt(id) } });
  }

  async getPermissions(userId) {
    return prisma.permission.findMany({
      where: { userId: parseInt(userId) }
    });
  }

  async updatePermissions(userId, permissions) {
    // permissions is an array of { entity, canCreate, canRead, canUpdate, canDelete }
    const results = [];
    for (const perm of permissions) {
      const result = await prisma.permission.upsert({
        where: {
          userId_entity: {
            userId: parseInt(userId),
            entity: perm.entity
          }
        },
        update: {
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete
        },
        create: {
          userId: parseInt(userId),
          entity: perm.entity,
          canCreate: perm.canCreate,
          canRead: perm.canRead,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete
        }
      });
      results.push(result);
    }
    return results;
  }
}

module.exports = new UserService();
