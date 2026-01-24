import { api } from '../client';

export const adminService = {
  setupWebhook: async () => {
    // Assuming backend has a route for this or we invoke a function
    // For now mapping to functions route as per original code structure
    const response = await api.post('/functions/setupWebhook');
    return response.data;
  },
  resetWebhook: async () => {
    const response = await api.post('/functions/resetWebhook');
    return response.data;
  },
  checkWebhookConfig: async () => {
    const response = await api.post('/functions/checkWebhookConfig');
    return response.data;
  },
  testWebhookConnection: async () => {
    const response = await api.post('/functions/testWebhookConnection');
    return response.data;
  },
  createEvolutionInstance: async (params) => {
      const response = await api.post('/functions/createEvolutionInstance', params);
      return response.data;
  }
};
