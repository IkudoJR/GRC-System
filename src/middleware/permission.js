const prisma = require('../lib/db');

/**
 * Permission Middleware Factory
 * Checks if the logged-in user has the required permission for an entity
 * @param {string} entity - ASSET, RISK, CONTROL, COMPLIANCE
 * @param {string} action - create, read, update, delete
 */
function requirePermission(entity, action) {
  return async (req, res, next) => {
    try {
      const user = req.session.user;

      // Admins have full access
      if (user.role === 'ADMIN') {
        return next();
      }

      const permission = await prisma.permission.findUnique({
        where: {
          userId_entity: {
            userId: user.id,
            entity: entity
          }
        }
      });

      if (!permission) {
        return res.status(403).json({ error: 'No permissions configured for this resource' });
      }

      const actionMap = {
        create: 'canCreate',
        read: 'canRead',
        update: 'canUpdate',
        delete: 'canDelete'
      };

      const field = actionMap[action];
      if (!permission[field]) {
        return res.status(403).json({ error: `You do not have ${action} permission for ${entity.toLowerCase()}s` });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

module.exports = { requirePermission };
