import { api } from '@/api/client';

export const RecurringExpense = {
  list: async (sort) => (await api.get('/recurring-expenses', { params: { sort } })).data,
  create: async (data) => (await api.post('/recurring-expenses', data)).data,
  update: async (id, data) => (await api.put(`/recurring-expenses/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/recurring-expenses/${id}`)).data,
};
