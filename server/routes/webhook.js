const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let stripe;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('STRIPE_SECRET_KEY not found. Stripe webhook will not function.');
}

// Stripe Webhook Handler
// NOTA: Este endpoint precisa receber o corpo raw para validação de assinatura
router.post('/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      await handleInvoicePaymentSucceeded(invoice);
      break;
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionUpdated(subscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

async function handleCheckoutSessionCompleted(session) {
  const organizationId = session.metadata.organizationId;
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (organizationId) {
    // Atualizar organização com customer ID (redundante se já feito no checkout, mas seguro)
    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripe_customer_id: customerId }
    });
    console.log(`Organization ${organizationId} linked to customer ${customerId}`);
  }
}

async function handleInvoicePaymentSucceeded(invoice) {
  // Lógica para registrar pagamento e estender assinatura
  // Aqui você buscaria a assinatura local pelo stripe_subscription_id e atualizaria o status
  console.log(`Invoice paid: ${invoice.id}`);
}

async function handleSubscriptionUpdated(subscription) {
  const status = subscription.status;
  const stripeCustomerId = subscription.customer;
  
  // Encontrar organização pelo customer ID
  const org = await prisma.organization.findFirst({
    where: { stripe_customer_id: stripeCustomerId }
  });

  if (org) {
    // Atualizar status da assinatura local
    // Isso assume que temos um campo stripe_subscription_id no modelo Subscription
    // Como ainda não temos, vamos apenas logar por enquanto
    console.log(`Subscription updated for org ${org.id}: ${status}`);
  }
}

module.exports = router;
