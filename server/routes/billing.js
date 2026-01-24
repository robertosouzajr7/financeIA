const express = require('express');
const router = express.Router();
const stripeService = require('../services/stripeService');
const authMiddleware = require('../middleware/authMiddleware');

// Create Checkout Session
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const { priceId } = req.body;
    const organizationId = req.organization.id;
    
    // URLs de retorno (frontend)
    const successUrl = `${req.headers.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${req.headers.origin}/billing/cancel`;

    const session = await stripeService.createCheckoutSession(organizationId, priceId, successUrl, cancelUrl);
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create Customer Portal Session
router.post('/portal', authMiddleware, async (req, res) => {
  try {
    const organizationId = req.organization.id;
    const returnUrl = `${req.headers.origin}/OrganizationSettings`;

    const session = await stripeService.createPortalSession(organizationId, returnUrl);
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

module.exports = router;
