const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const authMiddleware = require('../middleware/authMiddleware');
const checkLimit = require('../middleware/checkLimit');

// List transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { _limit } = req.query;
    
    // Filter by Organization if context exists, otherwise fall back to user_phone
    const whereClause = req.organization 
      ? { organization_id: req.organization.id }
      : { user_phone: req.user.user_phone };

    const transactions = await prisma.financialTransaction.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: _limit ? parseInt(_limit) : undefined
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post('/', authMiddleware, checkLimit('transactions'), async (req, res) => {
  try {
    const { description, amount, date, category, type } = req.body;

    const transaction = await prisma.financialTransaction.create({
      data: {
        user_phone: req.user.user_phone,
        description,
        amount: parseFloat(amount),
        date: new Date(date),
        category,
        type,
      },
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
