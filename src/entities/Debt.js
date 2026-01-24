import { api } from '@/api/client';

// Debt wasn't in entities.js, defining it here
export const Debt = {
  list: async (params) => (await api.get('/debts', { params })).data,
  create: async (data) => (await api.post('/debts', data)).data,
  update: async (id, data) => (await api.put(`/debts/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/debts/${id}`)).data,
};
