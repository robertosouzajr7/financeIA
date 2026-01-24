import { transactionService } from '@/api/services/transactionService';

export const exportTransactionsExcel = async (params) => {
  return await transactionService.exportExcel(params);
};
