import { api } from '../client';

export const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    InvokeLLM: async (params) => {
        // Assuming backend has a route or we use the new llm utils via a function route
        const response = await api.post('/functions/invokeLLM', params);
        return response.data;
    },
    SendEmail: async (params) => {
        const response = await api.post('/functions/sendCustomEmail', params);
        return response.data;
    }
    // Add other methods as needed based on usage
  }
};
