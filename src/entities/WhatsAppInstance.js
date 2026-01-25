import { api } from '@/api/client';

// WhatsAppInstance wasn't in entities.js, defining it here or adding to entities.js
// It seems to be a specific entity for managing instances
export const WhatsAppInstance = {
  list: async (sort) => (await api.get('/whatsapp-instances', { params: { sort } })).data,
  create: async (data) => (await api.post('/whatsapp-instances', data)).data,
  delete: async (id) => (await api.delete(`/whatsapp-instances/${id}`)).data,
  update: async (id, data) => (await api.put(`/whatsapp-instances/${id}`, data)).data,
  // Add other methods as needed
};
