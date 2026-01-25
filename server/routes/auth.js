const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_change_me'; // Must match middleware

// Register
router.post('/register', async (req, res) => {
  const { phone, password, name } = req.body;

  if (!phone || !password || !name) {
    return res.status(400).json({ message: 'Phone, password and name are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { user_phone: phone } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password (using bcrypt if possible, or base64 for legacy consistency if preferred, but let's stick to base64 for now to match existing patterns unless bcrypt is fully enforced)
    // Ideally we should use bcrypt. Let's try to use bcrypt if the project has it, otherwise fallback.
    // The project has bcryptjs in package.json (seen in previous logs).
    // However, to maintain compatibility with the "simple check" in login, we might need to be careful.
    // The login logic checks: if (startsWith $2a$) bcrypt else base64.
    // So we can safely use bcrypt here.
    
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User and Organization in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create User
      const user = await prisma.user.create({
        data: {
          user_phone: phone,
          user_name: name,
          password_hash: passwordHash,
          is_authenticated: true, // Auto-login after register?
          authentication_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        }
      });

      // 2. Create Organization
      const orgName = `${name}'s Org`;
      const slug = orgName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
      
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

      // 3. Create Default Subscription (Pro Trial)
      // Try to find Pro plan first, fallback to Free if not found (or create one?)
      let plan = await prisma.plan.findFirst({ where: { name: 'Pro' } });
      if (!plan) {
         // Fallback to Free or create Pro? Let's fallback to any plan
         plan = await prisma.plan.findFirst();
      }

      if (plan) {
        await prisma.subscription.create({
          data: {
            organization_id: org.id,
            plan_id: plan.id,
            user_email: user.user_phone,
            status: 'trialing',
            current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days trial
          }
        });
      }

      return { user, org };
    });

    // Generate token
    const token = jwt.sign({ id: result.user.id, phone: result.user.user_phone }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ 
      message: 'User registered successfully', 
      token, 
      user: result.user,
      organization: result.org
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { user_phone: phone },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    }); 
    
    if (user) {
        console.log('DEBUG LOGIN:');
        console.log('Phone:', phone);
        console.log('Hash in DB:', user.password_hash);
        console.log('Password received:', password);
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    let isValid = false;
    if (user.password_hash && (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2y$'))) {
        // Bcrypt hash
        isValid = await bcrypt.compare(password, user.password_hash);
        console.log('Bcrypt compare result:', isValid);
    } else {
        // Legacy or simple check
        const providedHash = Buffer.from(password).toString('base64');
        isValid = providedHash === user.password_hash;
    }

      if (!isValid) {
        return res.status(401).json({ 
          message: 'Invalid credentials',
          debug: {
            receivedPassword: password,
            receivedPasswordLength: password.length,
            hashInDb: user.password_hash,
            hashStartsWith2b: user.password_hash.startsWith('$2b$'),
            compareResult: isValid
          }
        });
      }

    const token = jwt.sign({ id: user.id, phone: user.user_phone }, JWT_SECRET, { expiresIn: '24h' });

    // Update user auth status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_authenticated: true,
        last_authenticated: new Date(),
        authentication_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    res.json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Temporary seed endpoint
router.post('/seed', async (req, res) => {
  try {
    const phone = '5511999999999';
    const password = 'password123';
    const passwordHash = Buffer.from(password).toString('base64');

    const user = await prisma.user.upsert({
      where: { user_phone: phone },
      update: {},
      create: {
        user_phone: phone,
        password_hash: passwordHash,
        is_authenticated: false,
      },
    });
    res.json({ message: 'Seeded successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  // authMiddleware already attaches user with organizations to req.user
  res.json(req.user);
});

module.exports = router;
