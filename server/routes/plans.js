const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const stripeService = require('../services/stripeService');

const prisma = new PrismaClient();

router.use(authMiddleware);

// Apenas ADMIN pode acessar as rotas de planos
function requireAdminRole(req, res, next) {
  if (req.organizationRole !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: ADMIN role required' });
  }

  return next();
}

router.use(requireAdminRole);

// LIST plans
router.get('/', async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' }
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE Plan
router.post('/', async (req, res) => {
  try {
    const { name, description, price, interval, features, limits } = req.body;

    // 1. Create on Stripe
    const stripeData = await stripeService.createProductAndPrice(
      name, 
      description, 
      price, 
      interval
    );

    // 2. Create in DB
    const plan = await prisma.plan.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        interval,
        features: JSON.stringify(features), // Array -> JSON String
        limits: JSON.stringify(limits),     // JSON Object -> JSON String
        stripe_product_id: stripeData.stripe_product_id,
        stripe_price_id: stripeData.stripe_price_id
      }
    });

    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE Plan (Caution: Stripe prices are immutable usually, so we might only update metadata)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, features, limits, is_active } = req.body;
    
    // We update local data. For Stripe, usually we'd archive old price and create new if price changed.
    // For now, let's assume we update name/desc/features/limits only.
    
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        features: typeof features === 'object' ? JSON.stringify(features) : features,
        limits: typeof limits === 'object' ? JSON.stringify(limits) : limits,
        is_active
      }
    });

    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (Soft delete preferably)
router.delete('/:id', async (req, res) => {
  try {
    await prisma.plan.update({
      where: { id: req.params.id },
      data: { is_active: false }
    });
    res.json({ message: 'Plan deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.requireAdminRole = requireAdminRole;
