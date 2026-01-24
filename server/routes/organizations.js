const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const prisma = new PrismaClient();

router.use(authMiddleware);

// Create Organization
router.post('/', async (req, res) => {
  try {
    const { name, slug } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 7);

    const org = await prisma.organization.create({
      data: {
        name,
        slug: orgSlug,
        members: {
          create: {
            user_id: req.user.id,
            role: 'OWNER'
          }
        }
      }
    });

    // Create default free subscription
    const freePlan = await prisma.plan.findFirst({ where: { name: 'Free' } });
    if (freePlan) {
      await prisma.subscription.create({
        data: {
          organization_id: org.id,
          plan_id: freePlan.id,
          user_email: req.user.user_phone, // Legacy
          status: 'active'
        }
      });
    }

    res.json(org);
  } catch (error) {
    console.error('Error creating organization:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update Organization
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug } = req.body;

    // Check ownership via middleware context or direct query
    // Since we might be editing an org we are not currently "switched into", we check membership manually
    const membership = await prisma.organizationMember.findFirst({
      where: {
        organization_id: id,
        user_id: req.user.id,
        role: 'OWNER'
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied. Only owners can update organization settings.' });
    }

    const org = await prisma.organization.update({
      where: { id },
      data: { name, slug }
    });

    res.json(org);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List Members
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check access
    const membership = await prisma.organizationMember.findFirst({
      where: { organization_id: id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ error: 'Access denied' });

    const members = await prisma.organizationMember.findMany({
      where: { organization_id: id },
      include: {
        user: {
          select: {
            id: true,
            user_name: true,
            user_phone: true,
            email: true
          }
        }
      }
    });

    // Format for frontend
    const formattedMembers = members.map(m => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.user_name,
      email: m.user.email || m.user.user_phone,
      role: m.role,
      avatar: '' // Placeholder
    }));

    res.json(formattedMembers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Member (Invite logic simplified for now: add by phone if exists)
router.post('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, role = 'MEMBER' } = req.body;

    // Check admin access
    const membership = await prisma.organizationMember.findFirst({
      where: { organization_id: id, user_id: req.user.id, role: 'OWNER' }
    });
    if (!membership) return res.status(403).json({ error: 'Only owners can add members' });

    // Find user to add
    const userToAdd = await prisma.user.findUnique({ where: { user_phone: phone } });
    if (!userToAdd) return res.status(404).json({ error: 'User not found with this phone number' });

    // Check if already member
    const existingMember = await prisma.organizationMember.findFirst({
      where: { organization_id: id, user_id: userToAdd.id }
    });
    if (existingMember) return res.status(400).json({ error: 'User is already a member' });

    const newMember = await prisma.organizationMember.create({
      data: {
        organization_id: id,
        user_id: userToAdd.id,
        role
      }
    });

    res.json(newMember);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove Member
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;

    // Check admin access
    const membership = await prisma.organizationMember.findFirst({
      where: { organization_id: id, user_id: req.user.id, role: 'OWNER' }
    });
    if (!membership) return res.status(403).json({ error: 'Only owners can remove members' });

    await prisma.organizationMember.delete({
      where: { id: memberId }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
