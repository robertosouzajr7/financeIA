import { api } from '../client';

export const transactionService = {
  list: async (params) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
  exportExcel: async (filters) => {
    const response = await api.get('/export/transactions/excel', {
      params: filters,
      responseType: 'blob'
    });
    return { data: response.data }; // Match expected format in Transactions.jsx
  }
};
