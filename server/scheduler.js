/**
 * Scheduler
 *
 * Sistema de agendamento de tarefas periódicas
 * Usa node-cron para executar tarefas em horários específicos
 */

const cron = require('node-cron');
const recurringExpensesService = require('./services/recurringExpensesService');

console.log('🕐 Scheduler iniciado');

/**
 * Verifica despesas recorrentes diariamente às 9h
 * Cron format: second minute hour day month day-of-week
 */
cron.schedule('0 9 * * *', async () => {
    console.log('🔄 Executando verificação de despesas recorrentes...');

    try {
        const result = await recurringExpensesService.checkAndCreateExpenses();

        console.log(`✅ Despesas recorrentes processadas:`);
        console.log(`   - Criadas: ${result.created}`);
        console.log(`   - Ignoradas: ${result.skipped}`);
        console.log(`   - Total: ${result.total}`);
    } catch (error) {
        console.error('❌ Erro ao processar despesas recorrentes:', error);
    }
}, {
    timezone: "America/Sao_Paulo"
});

/**
 * Health check a cada hora
 */
cron.schedule('0 * * * *', () => {
    console.log('💓 Scheduler está ativo:', new Date().toISOString());
});

/**
 * Limpeza de dados antigos (opcional)
 * Executa todo domingo às 3h
 */
cron.schedule('0 3 * * 0', async () => {
    console.log('🧹 Executando limpeza de dados antigos...');

    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Limpar alertas lidos com mais de 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const deletedAlerts = await prisma.alert.deleteMany({
            where: {
                is_read: true,
                created_at: {
                    lt: thirtyDaysAgo
                }
            }
        });

        console.log(`✅ ${deletedAlerts.count} alertas antigos removidos`);

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Erro na limpeza de dados:', error);
    }
});

console.log('📋 Tarefas agendadas:');
console.log('   - Despesas recorrentes: Diariamente às 9h');
console.log('   - Health check: A cada hora');
console.log('   - Limpeza de dados: Domingos às 3h');

module.exports = {
    // Exporta para que possa ser usado em testes ou chamado manualmente
    runRecurringExpensesCheck: recurringExpensesService.checkAndCreateExpenses
};
