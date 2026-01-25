const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEFAULT_LIMITS = {
  max_instances: 1,
  max_users: 1,
  max_budgets: 2,
  max_alerts: 2,
  max_transactions: 10
};

const RESOURCE_MAP = {
  'chatbots': 'max_instances',
  'users': 'max_users',
  'budgets': 'max_budgets',
  'alerts': 'max_alerts',
  'transactions': 'max_transactions'
};

const checkLimit = (resource) => {
  return async (req, res, next) => {
    try {
      // 1. Resolve Organization
      let organization = req.organization;
      if (!organization && req.user && req.user.organizations && req.user.organizations.length > 0) {
        organization = req.user.organizations[0].organization;
        req.organization = organization;
      }

      if (!organization) {
         console.warn('⚠️ checkLimit: No organization context found');
         return res.status(403).json({ error: 'Organization context required' });
      }

      // 2. Get Active Subscription & Plan
      const subscription = await prisma.subscription.findFirst({
        where: { 
          organization_id: organization.id,
          status: { in: ['active', 'trialing'] }
        },
        include: { plan: true }
      });

      // 2b. Check Trial Expiration
      if (subscription && subscription.status === 'trialing' && subscription.current_period_end) {
          const now = new Date();
          if (now > subscription.current_period_end) {
              // Expired!
              return res.status(403).json({ 
                  error: 'Seu período de teste expirou. Faça o upgrade para continuar.',
                  code: 'TRIAL_EXPIRED',
                  upgrade_required: true
              });
          }
      }

      // 3. Determine Limits
      let limits = { ...DEFAULT_LIMITS };
      
      if (subscription && subscription.plan && subscription.plan.limits) {
        try {
          const planLimits = typeof subscription.plan.limits === 'string' 
            ? JSON.parse(subscription.plan.limits) 
            : subscription.plan.limits;
            
          limits = { ...limits, ...planLimits };
        } catch (e) {
          console.error("Error parsing plan limits:", e);
        }
      } else if (!subscription) {
        // No subscription? Maybe allow nothing or free tier?
        // Let's stick to defaults (Free)
      }

      // 4. Check Specific Resource Limit
      const limitKey = RESOURCE_MAP[resource];
      const limit = limits[limitKey];

      // If limit is -1 or very high, it's unlimited
      if (limit === -1 || limit >= 999999) {
        return next();
      }

      // 5. Count Usage
      let count = 0;
      switch (resource) {
        case 'chatbots':
          count = await prisma.whatsAppInstance.count({ where: { organization_id: organization.id } });
          break;
        case 'users':
          count = await prisma.organizationMember.count({ where: { organization_id: organization.id } });
          break;
        case 'budgets':
          count = await prisma.budget.count({ where: { organization_id: organization.id } });
          break;
        case 'alerts':
            count = await prisma.alert.count({ where: { organization_id: organization.id } });
            break;
        case 'transactions':
            // For transactions, we usually check count in current period. 
            // Simplified: count all for now, or last 30 days.
            // Let's do nothing for transactions in this simplified verification to avoid blocking main flow
            // unless strict.
            // count = await prisma.financialTransaction.count({ where: { organization_id: organization.id } });
            return next(); 
      }

      if (count >= limit) {
        return res.status(403).json({ 
          error: `Limite do plano atingido para ${resource}. Limite: ${limit}, Atual: ${count}`,
          code: 'LIMIT_REACHED',
          limit,
          current: count,
          upgrade_required: true
        });
      }

      next();
    } catch (error) {
      console.error('Error checking limits:', error);
      res.status(500).json({ error: 'Internal server error checking limits' });
    }
  };
};

module.exports = checkLimit;
