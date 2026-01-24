const Stripe = require('stripe');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

class StripeService {
  
  // Criar ou obter Customer no Stripe
  async getOrCreateCustomer(organizationId, email, name) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    
    if (org.stripe_customer_id) {
      return org.stripe_customer_id;
    }

    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        organizationId
      }
    });

    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripe_customer_id: customer.id }
    });

    return customer.id;
  }

  // Criar Sessão de Checkout
  async createCheckoutSession(organizationId, priceId, successUrl, cancelUrl) {
    const org = await prisma.organization.findUnique({ 
      where: { id: organizationId },
      include: { members: { include: { user: true } } } // Get owner email
    });

    const owner = org.members.find(m => m.role === 'OWNER')?.user;
    const customerId = await this.getOrCreateCustomer(organizationId, owner?.user_email || 'billing@financeia.com', org.name);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        organizationId
      }
    });

    return session;
  }

  // Portal do Cliente
  async createPortalSession(organizationId, returnUrl) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    
    if (!org.stripe_customer_id) {
      throw new Error('Organization has no Stripe Customer ID');
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: returnUrl,
    });

    return session;
  }
}

module.exports = new StripeService();
