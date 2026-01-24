import { api } from '@/api/client';

export const EmailTemplate = {
  list: async (sort) => (await api.get('/email-templates', { params: { sort } })).data,
  create: async (data) => (await api.post('/email-templates', data)).data,
  update: async (id, data) => (await api.put(`/email-templates/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/email-templates/${id}`)).data,
};
