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
    const successUrl = `${req.headers.origin}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${req.headers.origin}/Pricing`;

    const session = await stripeService.createCheckoutSession(organizationId, priceId, successUrl, cancelUrl);
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create Checkout Session (legacy - compatibilidade com Base44)
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body;
    const user = req.user;

    if (!['basic', 'pro'].includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid plan'
      });
    }

    // Mapear plano para price ID
    const priceId = plan === 'basic'
      ? process.env.STRIPE_PRICE_ID_BASIC
      : process.env.STRIPE_PRICE_ID_PRO;

    if (!priceId) {
      return res.status(500).json({
        success: false,
        error: `Price ID not configured for plan ${plan}`
      });
    }

    const organizationId = req.organization?.id;

    const successUrl = `${req.headers.origin}/PaymentSuccess?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${req.headers.origin}/Pricing`;

    const session = await stripeService.createCheckoutSession(organizationId, priceId, successUrl, cancelUrl);

    res.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
