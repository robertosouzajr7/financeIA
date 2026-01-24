import { api } from '../client';

export const whatsappService = {
  listInstances: async () => {
    const response = await api.get('/whatsapp-instances');
    return response.data;
  },
  createInstance: async (data) => {
    const response = await api.post('/whatsapp-instances', data);
    return response.data;
  },
  deleteInstance: async (id) => {
    const response = await api.delete(`/whatsapp-instances/${id}`);
    return response.data;
  },
  sendMessage: async (phone, message, instanceName) => {
    const response = await api.post('/functions/sendWhatsAppMessage', {
      phone,
      message,
      instanceName
    });
    return response.data;
  },
  checkConnection: async (instanceName) => {
     // This might need a specific endpoint or check status in DB
     const response = await api.get(`/whatsapp-instances?name=${instanceName}`);
     return response.data?.[0]?.status === 'connected';
  }
};
