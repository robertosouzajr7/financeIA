/**
 * Recurring Expenses Service
 *
 * Serviço para gerenciar despesas recorrentes e criá-las automaticamente
 */

const { PrismaClient } = require('@prisma/client');
const { format, startOfMonth, endOfMonth } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const whatsappMessageService = require('./whatsappMessageService');

const prisma = new PrismaClient();

/**
 * Verifica e cria despesas recorrentes que estão pendentes
 */
async function checkAndCreateExpenses() {
    try {
        console.log('🔄 Verificando despesas recorrentes...');

        const today = new Date();
        const currentDay = today.getDate();
        const startDate = startOfMonth(today);
        const endDate = endOfMonth(today);

        // Buscar despesas recorrentes ativas
        const recurringExpenses = await prisma.recurringExpense.findMany({
            where: {
                is_active: true,
                due_day: currentDay
            }
        });

        console.log(`📋 ${recurringExpenses.length} despesas recorrentes encontradas para hoje`);

        let created = 0;
        let skipped = 0;

        for (const expense of recurringExpenses) {
            // Verificar se já foi criada neste mês
            const existingTransaction = await prisma.financialTransaction.findFirst({
                where: {
                    user_phone: expense.user_phone,
                    description: expense.description,
                    amount: expense.amount,
                    category: expense.category,
                    date: {
                        gte: startDate,
                        lte: endDate
                    },
                    is_recurring: true
                }
            });

            if (existingTransaction) {
                console.log(`⏭️  Despesa "${expense.description}" já criada este mês`);
                skipped++;
                continue;
            }

            // Criar transação se auto_create estiver habilitado
            if (expense.auto_create) {
                const transaction = await prisma.financialTransaction.create({
                    data: {
                        user_phone: expense.user_phone,
                        organization_id: expense.organization_id,
                        description: expense.description,
                        amount: expense.amount,
                        date: today.toISOString().split('T')[0],
                        category: expense.category,
                        type: 'expense',
                        is_recurring: true,
                        priority: 'high',
                        source: 'auto',
                        notes: `Despesa recorrente criada automaticamente (${expense.frequency})`
                    }
                });

                console.log(`✅ Transação criada: ${transaction.description} - R$ ${transaction.amount}`);
                created++;

                // Enviar notificação se habilitado
                if (expense.send_reminder) {
                    await sendReminder(expense, transaction);
                }
            } else if (expense.send_reminder) {
                // Apenas enviar lembrete se auto_create estiver desabilitado
                await sendReminder(expense);
                console.log(`📧 Lembrete enviado: ${expense.description}`);
            }
        }

        console.log(`✅ Processamento concluído: ${created} criadas, ${skipped} ignoradas`);

        return {
            success: true,
            created,
            skipped,
            total: recurringExpenses.length
        };

    } catch (error) {
        console.error('❌ Erro ao processar despesas recorrentes:', error);
        throw error;
    }
}

/**
 * Envia lembrete de despesa recorrente via WhatsApp
 */
async function sendReminder(expense, transaction = null) {
    try {
        // Buscar usuário
        const user = await prisma.user.findUnique({
            where: { user_phone: expense.user_phone }
        });

        if (!user) {
            console.warn(`⚠️  Usuário ${expense.user_phone} não encontrado`);
            return;
        }

        // Buscar instância WhatsApp ativa
        const instance = await prisma.whatsAppInstance.findFirst({
            where: {
                status: 'connected',
                OR: [
                    { user_email: expense.user_phone },
                    { organization_id: expense.organization_id }
                ]
            }
        });

        if (!instance) {
            console.warn('⚠️  Nenhuma instância WhatsApp conectada');
            return;
        }

        let message;

        if (transaction) {
            // Despesa criada automaticamente
            message = `💰 *Despesa Recorrente Registrada*\n\n` +
                `📝 ${expense.description}\n` +
                `💵 R$ ${expense.amount.toFixed(2)}\n` +
                `📂 ${expense.category}\n` +
                `📅 ${format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}\n\n` +
                `Esta despesa foi registrada automaticamente.\n\n` +
                `Para desativar, acesse: Configurações > Despesas Recorrentes`;
        } else {
            // Apenas lembrete
            message = `⏰ *Lembrete de Despesa Recorrente*\n\n` +
                `📝 ${expense.description}\n` +
                `💵 R$ ${expense.amount.toFixed(2)}\n` +
                `📂 ${expense.category}\n` +
                `📅 Vencimento: dia ${expense.due_day}\n\n` +
                `Não esqueça de registrar esta despesa!`;
        }

        await whatsappMessageService.sendMessage({
            user_phone: expense.user_phone,
            message,
            instance_name: instance.instance_name
        });

        console.log(`✅ Lembrete enviado para ${expense.user_phone}`);

    } catch (error) {
        console.error('❌ Erro ao enviar lembrete:', error);
        // Não propagar erro para não interromper o processamento
    }
}

/**
 * Cria uma nova despesa recorrente
 */
async function createRecurringExpense(data) {
    try {
        const expense = await prisma.recurringExpense.create({
            data: {
                user_phone: data.user_phone,
                organization_id: data.organization_id,
                description: data.description,
                amount: data.amount,
                category: data.category,
                frequency: data.frequency || 'monthly',
                due_day: data.due_day,
                is_active: true,
                send_reminder: data.send_reminder !== false,
                auto_create: data.auto_create || false
            }
        });

        console.log(`✅ Despesa recorrente criada: ${expense.description}`);

        return {
            success: true,
            expense
        };

    } catch (error) {
        console.error('❌ Erro ao criar despesa recorrente:', error);
        throw error;
    }
}

/**
 * Atualiza uma despesa recorrente
 */
async function updateRecurringExpense(id, data) {
    try {
        const expense = await prisma.recurringExpense.update({
            where: { id },
            data
        });

        console.log(`✅ Despesa recorrente atualizada: ${expense.description}`);

        return {
            success: true,
            expense
        };

    } catch (error) {
        console.error('❌ Erro ao atualizar despesa recorrente:', error);
        throw error;
    }
}

/**
 * Deleta uma despesa recorrente
 */
async function deleteRecurringExpense(id) {
    try {
        await prisma.recurringExpense.delete({
            where: { id }
        });

        console.log(`✅ Despesa recorrente deletada`);

        return {
            success: true
        };

    } catch (error) {
        console.error('❌ Erro ao deletar despesa recorrente:', error);
        throw error;
    }
}

module.exports = {
    checkAndCreateExpenses,
    createRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    sendReminder
};
