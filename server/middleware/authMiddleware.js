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

    // Verificar/criar contexto de organização
    const orgId = req.headers['x-org-id'];

    if (orgId) {
      const membership = user.organizations.find(m => m.organization_id === orgId);

      if (!membership) {
        return res.status(403).json({ error: 'Access denied to this organization' });
      }

      req.organization = membership.organization;
      req.organizationRole = membership.role;
    } else if (user.organizations && user.organizations.length > 0) {
      // Se não foi especificado x-org-id, usar a primeira organização do usuário
      req.organization = user.organizations[0].organization;
      req.organizationRole = user.organizations[0].role;
    } else {
      // Usuário não tem organização - criar uma padrão
      console.log(`⚠️  User ${user.user_phone} has no organization - creating default`);

      const orgName = user.user_name ? `${user.user_name}'s Org` : 'My Organization';
      const slug = `org-${user.id}`;

      const org = await prisma.organization.create({
        data: {
          name: orgName,
          slug: slug,
          members: {
            create: {
              user_id: user.id,
              role: 'OWNER'
            }
          }
        }
      });

      req.organization = org;
      req.organizationRole = 'OWNER';

      console.log(`✅ Default organization created: ${org.id}`);
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = authMiddleware;
