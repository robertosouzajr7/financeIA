const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Middleware to verify token (reused from auth, should be in a separate file)
const authenticateToken = (req, res, next) => {
    // ... (same as in auth.js, better to extract to middleware/auth.js)
    // For brevity, copying here or assuming we extract it later
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

    if (!token) return res.sendStatus(401);

    const jwt = require('jsonwebtoken');
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// List transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const transactions = await prisma.financialTransaction.findMany({
      where: { user_phone: req.user.phone },
      orderBy: { date: 'desc' },
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { description, amount, date, category, type } = req.body;
    const transaction = await prisma.financialTransaction.create({
      data: {
        user_phone: req.user.phone,
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
