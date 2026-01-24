import { whatsappService } from '@/api/services/whatsappService';

export const checkInstanceConnection = async (params) => {
  return await whatsappService.checkConnection(params.instanceName);
};
