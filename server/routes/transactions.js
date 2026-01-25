const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

const authMiddleware = require('../middleware/authMiddleware');
const checkLimit = require('../middleware/checkLimit');

// List transactions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { _limit, user_phone, start_date, end_date, category, type } = req.query;

    // Base filter: Organization if context exists, otherwise user_phone
    const whereClause = req.organization
      ? { organization_id: req.organization.id }
      : { user_phone: req.user.user_phone };

    // Add optional filters
    if (user_phone) whereClause.user_phone = user_phone;
    if (category) whereClause.category = category;
    if (type) whereClause.type = type;

    // Date range filter
    if (start_date || end_date) {
      whereClause.date = {};
      if (start_date) whereClause.date.gte = new Date(start_date);
      if (end_date) whereClause.date.lte = new Date(end_date);
    }

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
        organization_id: req.organization?.id, // Include organization_id if available
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

// Update transaction
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, date, category, type } = req.body;

    const data = {};
    if (description) data.description = description;
    if (amount) data.amount = parseFloat(amount);
    if (date) data.date = new Date(date);
    if (category) data.category = category;
    if (type) data.type = type;

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data
    });
    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.financialTransaction.delete({
      where: { id }
    });
    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
