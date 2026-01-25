const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

const createCrudRoutes = (modelName, idField = 'id') => {
  const router = express.Router();
  // Prisma client uses camelCase for model names
  const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const model = prisma[modelKey];

  // Apply auth middleware to all routes
  router.use(authMiddleware);

  // List
  router.get('/', async (req, res) => {
    try {
      // Extract special params
      const { sort, _limit, ...where } = req.query;
      
      // Handle boolean conversion
      Object.keys(where).forEach(key => {
          if (where[key] === 'true') where[key] = true;
          if (where[key] === 'false') where[key] = false;
      });

      // Filter by organization if context exists and model supports it
      if (req.organization && modelName !== 'User' && modelName !== 'SystemSettings') {
         where.organization_id = req.organization.id;
      } else if (modelName === 'User') {
         // Users can only see themselves or if admin (logic to be improved)
         // For now, restrict to self if not admin
         // where.id = req.user.id; // Uncomment to restrict
      }

      // Prepare query options
      const queryOptions = { where };
      
      // Apply sorting
      if (sort) {
          const [field, direction] = sort.startsWith('-') 
              ? [sort.substring(1), 'desc'] 
              : [sort, 'asc'];
          queryOptions.orderBy = { [field]: direction };
      }

      // Apply limit
      if (_limit) {
          queryOptions.take = parseInt(_limit);
      }

      const items = await model.findMany(queryOptions);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get by ID
  router.get('/:id', async (req, res) => {
    try {
      const where = { [idField]: req.params.id };
      
      if (req.organization && modelName !== 'User' && modelName !== 'SystemSettings') {
        where.organization_id = req.organization.id;
      }

      const item = await model.findFirst({ // Changed to findFirst to support where clause with org
        where,
      });
      if (!item) return res.status(404).json({ error: 'Not found' });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create
  router.post('/', async (req, res) => {
    try {
      const data = { ...req.body };
      
      // Inject organization_id if in context
      if (req.organization && modelName !== 'User' && modelName !== 'SystemSettings') {
        data.organization_id = req.organization.id;
      }
      
      // Inject user_phone/email if needed (legacy support)
      if (modelName === 'FinancialTransaction' || modelName === 'Budget' || modelName === 'Goal') {
          if (!data.user_phone && req.user) data.user_phone = req.user.user_phone;
      }

      const item = await model.create({
        data,
      });
      res.json(item);
    } catch (error) {
      console.error(`Error creating ${modelName}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update
  router.put('/:id', async (req, res) => {
    try {
      const where = { [idField]: req.params.id };
      if (req.organization && modelName !== 'User' && modelName !== 'SystemSettings') {
        where.organization_id = req.organization.id;
      }

      // Check if exists first to ensure ownership
      const existing = await model.findFirst({ where });
      if (!existing) return res.status(404).json({ error: 'Not found or access denied' });

      const item = await model.update({
        where: { [idField]: req.params.id },
        data: req.body,
      });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete
  router.delete('/:id', async (req, res) => {
    try {
      const where = { [idField]: req.params.id };
      if (req.organization && modelName !== 'User' && modelName !== 'SystemSettings') {
        where.organization_id = req.organization.id;
      }

      // Check if exists first
      const existing = await model.findFirst({ where });
      if (!existing) return res.status(404).json({ error: 'Not found or access denied' });

      await model.delete({
        where: { [idField]: req.params.id },
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

module.exports = createCrudRoutes;
