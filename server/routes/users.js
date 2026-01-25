const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

router.use(authMiddleware);

// Helper for generic CRUD list/get
// We can actually use the same logic as generic CRUD for GET/POST/PUT
// but assume we just want to override DELETE.

// LIST
router.get('/', async (req, res) => {
  try {
    const where = { ...req.query };
    // Handle booleans
    Object.keys(where).forEach(key => {
        if (where[key] === 'true') where[key] = true;
        if (where[key] === 'false') where[key] = false;
    });
    
    const organization_id = req.organization?.id;
    if (!organization_id) {
       return res.status(400).json({ error: 'Organization context required' });
    }

    // Find users belonging to this organization via OrganizationMember
    const items = await prisma.user.findMany({
      where: {
        organizations: {
          some: {
            organization_id: organization_id
          }
        },
        ...where
      },
      include: {
        organizations: {
          where: { organization_id } // Include only relevant membership
        }
      }
    });
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET ONE
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    const organization_id = req.organization?.id;
    
    if (!organization_id) {
       return res.status(400).json({ error: 'Organization context required' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { user_phone: data.user_phone }
    });

    if (user) {
        // User exists. Check if they are already a member of THIS organization.
        const existingMember = await prisma.organizationMember.findUnique({
            where: {
                user_id_organization_id: {
                    user_id: user.id,
                    organization_id
                }
            }
        });
        
        if (existingMember) {
             return res.status(409).json({ error: 'User already exists in this organization.' });
        } else {
             // Link existing user to this organization
             // We do NOT update the user's name/password here to preserve their global identity
             await prisma.organizationMember.create({
                data: {
                    user_id: user.id,
                    organization_id,
                    role: 'member'
                }
            });
        }
    } else {
        // Create new user and link to org
        user = await prisma.user.create({
            data: {
                ...data,
                organizations: {
                    create: {
                        organization_id,
                        role: 'member'
                    }
                }
            }
        });
    }

    res.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    // Basic update
    const item = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE (Custom with manual cascade)
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Try to find by ID first, then by phone
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        user = await prisma.user.findUnique({ where: { user_phone: userId } });
    }
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const userPhone = user.user_phone;

    console.log(`🗑️ Deleting user ${userId} (${userPhone})...`);

    // Manually delete related records in order
    // 1. WhatsApp Instances
    await prisma.whatsAppInstance.deleteMany({ where: { user_email: userPhone } });
    
    // 2. Organization Memberships
    await prisma.organizationMember.deleteMany({ where: { user_id: userId } });

    // 3. Financial Data
    await prisma.financialTransaction.deleteMany({ where: { user_phone: userPhone } });
    await prisma.budget.deleteMany({ where: { user_phone: userPhone } });
    await prisma.goal.deleteMany({ where: { user_phone: userPhone } });
    await prisma.debt.deleteMany({ where: { user_phone: userPhone } });
    await prisma.alert.deleteMany({ where: { user_phone: userPhone } });
    await prisma.recurringExpense.deleteMany({ where: { user_phone: userPhone } });

    // 4. Subscriptions (linked by user_email)
    // Note: user_email field in Subscription actually references user_phone based on schema logic seen earlier
    await prisma.subscription.deleteMany({ where: { user_email: userPhone } });

    // 5. Finally, delete the User
    await prisma.user.delete({ where: { id: userId } });

    console.log(`✅ User ${userId} deleted successfully.`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
