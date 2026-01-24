import { api } from '@/api/client';

export const SupportTicket = {
  list: async (sort) => (await api.get('/support-tickets', { params: { sort } })).data,
  filter: async (params, sort) => (await api.get('/support-tickets', { params: { ...params, sort } })).data,
  create: async (data) => (await api.post('/support-tickets', data)).data,
  update: async (id, data) => (await api.put(`/support-tickets/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/support-tickets/${id}`)).data,
};
