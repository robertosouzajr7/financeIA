import api from '../client';

const billingService = {
  createCheckout: async (planId) => {
    // Placeholder for actual checkout creation logic
    // In a real implementation, this would call the backend to create a Stripe/payment session
    // const response = await api.post('/billing/checkout', { planId });
    // return response.data;
    
    console.log('Creating checkout for plan:', planId);
    return { url: '#' }; // Mock response
  },

  getSubscriptions: async () => {
    const response = await api.get('/subscriptions');
    return response.data;
  },
  
  checkRecurringExpenses: async () => {
      const response = await api.post('/functions/checkRecurringExpenses');
      return response.data;
  }
};

export default billingService;
