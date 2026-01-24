const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class BillingService {
  
  // Criar ou atualizar uma assinatura
  async createSubscription(organizationId, planId, paymentMethodId = null) {
    try {
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) throw new Error('Plan not found');

      // Calcular fim do período (ex: 30 dias)
      const now = new Date();
      const currentPeriodEnd = new Date(now);
      if (plan.interval === 'year') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      // Criar assinatura
      const subscription = await prisma.subscription.create({
        data: {
          organization_id: organizationId,
          plan_id: planId,
          status: 'active',
          current_period_end: currentPeriodEnd,
          user_email: 'system@financeia.com' // Placeholder required by schema legacy
        }
      });

      // Gerar fatura inicial (paga)
      await this.createInvoice(subscription.id, plan.price, 'paid');

      return subscription;
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  // Gerar fatura
  async createInvoice(subscriptionId, amount, status = 'open') {
    return await prisma.invoice.create({
      data: {
        subscription_id: subscriptionId,
        amount: amount,
        status: status,
        paid_at: status === 'paid' ? new Date() : null
      }
    });
  }

  // Cancelar assinatura
  async cancelSubscription(subscriptionId) {
    return await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        cancel_at_period_end: true
      }
    });
  }

  // Listar planos disponíveis
  async getPlans() {
    return await prisma.plan.findMany({
      where: { is_active: true }
    });
  }
}

module.exports = new BillingService();
