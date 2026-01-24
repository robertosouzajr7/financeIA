import { adminService } from '@/api/services/adminService';

export const createEvolutionInstance = async (params) => {
  return await adminService.createEvolutionInstance(params);
};
