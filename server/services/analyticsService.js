const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AnalyticsService {
  
  // Obter resumo financeiro de uma organização
  async getOrganizationSummary(organizationId, startDate, endDate) {
    try {
      const where = {
        organization_id: organizationId,
        date: {
          gte: startDate,
          lte: endDate
        }
      };

      const transactions = await prisma.financialTransaction.findMany({ where });
      const memberCount = await prisma.organizationMember.count({
        where: { organization_id: organizationId }
      });

      let totalIncome = 0;
      let totalExpense = 0;
      const categoryBreakdown = {};

      transactions.forEach(t => {
        if (t.type === 'income') {
          totalIncome += t.amount;
        } else {
          totalExpense += t.amount;
          
          if (!categoryBreakdown[t.category]) {
            categoryBreakdown[t.category] = 0;
          }
          categoryBreakdown[t.category] += t.amount;
        }
      });

      return {
        totalIncome,
        totalExpense,
        netIncome: totalIncome - totalExpense,
        categoryBreakdown,
        transactionCount: transactions.length,
        memberCount
      };

    } catch (error) {
      console.error('Error fetching organization summary:', error);
      throw error;
    }
  }

  // Gerar relatório mensal (Mock)
  async generateMonthlyReport(organizationId, month, year) {
    // Implementar lógica real de geração de PDF/Excel aqui
    // Por enquanto, retorna os dados brutos
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return await this.getOrganizationSummary(organizationId, startDate, endDate);
  }
}

module.exports = new AnalyticsService();
