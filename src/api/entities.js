import { api } from './client';

const createEntity = (resource) => ({
  list: async () => (await api.get(`/${resource}`)).data,
  filter: async (params) => (await api.get(`/${resource}`, { params })).data,
  create: async (data) => (await api.post(`/${resource}`, data)).data,
  update: async (id, data) => (await api.put(`/${resource}/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/${resource}/${id}`)).data,
});

export const FinancialTransaction = createEntity('transactions');
export const Budget = createEntity('budgets');
export const Goal = createEntity('goals');
export const SystemSettings = createEntity('system-settings');
export const Subscription = createEntity('subscriptions');
export const KnowledgeDocument = createEntity('knowledge-documents');
export const Alert = createEntity('alerts');
export const LandingPageSettings = createEntity('landing-page-settings');
export const ConversationMessage = createEntity('conversation-messages');

export const AuthenticatedUser = {
  list: async () => (await api.get('/users')).data,
  filter: async (params) => (await api.get('/users', { params })).data,
  create: async (data) => (await api.post('/users', data)).data,
  update: async (id, data) => (await api.put(`/users/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/users/${id}`)).data,
};

const UserEntity = createEntity('users');
export const User = {
  ...UserEntity,
  me: async () => (await api.get('/auth/me')).data,
};

// Mock Query object for compatibility if used elsewhere
export const Query = {
    FinancialTransaction,
    Budget,
    Goal,
    SystemSettings,
    Subscription,
    KnowledgeDocument,
    AuthenticatedUser,
    Alert
};