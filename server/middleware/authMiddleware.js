const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_change_me');
    
    // Buscar usuário e suas organizações
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }, // Assumindo que o token tem o ID do usuário
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;

    // Verificar contexto de organização
    const orgId = req.headers['x-org-id'];
    if (orgId) {
      const membership = user.organizations.find(m => m.organization_id === orgId);
      
      if (!membership) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }

      req.organization = membership.organization;
      req.organizationRole = membership.role;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
