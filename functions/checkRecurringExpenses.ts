import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';
import { format, addDays } from 'npm:date-fns@3.0.0';
import { ptBR } from 'npm:date-fns@3.0.0/locale';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const today = new Date();
        const currentDay = today.getDate();
        const tomorrow = addDays(today, 1);
        const tomorrowDay = tomorrow.getDate();

        console.log(`📅 Verificando despesas recorrentes - Dia ${currentDay}`);

        // Buscar todas as despesas recorrentes ativas
        const allExpenses = await base44.asServiceRole.entities.RecurringExpense.filter({ is_active: true });
        
        console.log(`📊 Total de despesas ativas: ${allExpenses.length}`);

        // 1. LEMBRETES - Enviar 1 dia antes
        const expensesToRemind = allExpenses.filter(e => 
            e.send_reminder && e.due_day === tomorrowDay
        );

        console.log(`🔔 Despesas para lembrar: ${expensesToRemind.length}`);

        for (const expense of expensesToRemind) {
            try {
                const message = 
                    `🔔 *LEMBRETE DE VENCIMENTO*\n\n` +
                    `📝 ${expense.name}\n` +
                    `💰 Valor: R$ ${expense.amount.toFixed(2)}\n` +
                    `📅 Vence amanhã (dia ${expense.due_day})\n` +
                    `📂 Categoria: ${expense.category}\n\n` +
                    `Não esqueça de pagar! 😊`;

                // Enviar via WhatsApp
                await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
                    user_phone: expense.user_phone,
                    message: message
                });

                console.log(`✅ WhatsApp enviado: ${expense.name} para ${expense.user_phone}`);

                // Buscar usuário para pegar email
                const users = await base44.asServiceRole.entities.AuthenticatedUser.filter({ 
                    user_phone: expense.user_phone 
                });

                if (users.length > 0 && users[0].user_email) {
                    // Enviar via Email também
                    try {
                        await base44.asServiceRole.functions.invoke('sendCustomEmail', {
                            to: users[0].user_email,
                            subject: `🔔 Lembrete: ${expense.name} vence amanhã`,
                            body: message,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 10px 10px 0 0;">
                                        <h1 style="color: white; margin: 0;">🔔 Lembrete de Vencimento</h1>
                                    </div>
                                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                        <h2 style="color: #1f2937; margin-top: 0;">${expense.name}</h2>
                                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                            <p style="margin: 10px 0;"><strong>💰 Valor:</strong> R$ ${expense.amount.toFixed(2)}</p>
                                            <p style="margin: 10px 0;"><strong>📅 Vencimento:</strong> Amanhã (dia ${expense.due_day})</p>
                                            <p style="margin: 10px 0;"><strong>📂 Categoria:</strong> ${expense.category}</p>
                                        </div>
                                        ${expense.notes ? `<p style="color: #6b7280;"><strong>Obs:</strong> ${expense.notes}</p>` : ''}
                                        <p style="color: #059669; font-weight: bold; margin-top: 20px;">Não esqueça de pagar! 😊</p>
                                        <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
                                        <p style="color: #6b7280; font-size: 12px; text-align: center;">
                                            Este é um lembrete automático do FinanceIA
                                        </p>
                                    </div>
                                </div>
                            `,
                            from_name: "FinanceIA - Lembretes"
                        });
                        console.log(`✅ Email enviado: ${expense.name} para ${users[0].user_email}`);
                    } catch (emailError) {
                        console.log(`⚠️ Erro ao enviar email (não crítico): ${emailError.message}`);
                    }
                }

            } catch (error) {
                console.error(`❌ Erro ao enviar lembrete para ${expense.user_phone}:`, error);
            }
        }

        // 2. CRIAR TRANSAÇÕES AUTOMÁTICAS - No dia do vencimento
        const expensesToCreate = allExpenses.filter(e => 
            e.auto_create_transaction && e.due_day === currentDay
        );

        console.log(`💾 Transações a criar automaticamente: ${expensesToCreate.length}`);

        for (const expense of expensesToCreate) {
            try {
                // Verificar se já foi criada hoje
                const existingTransactions = await base44.asServiceRole.entities.FinancialTransaction.filter({
                    user_phone: expense.user_phone,
                    description: expense.name,
                    date: format(today, 'yyyy-MM-dd')
                });

                if (existingTransactions.length > 0) {
                    console.log(`⏭️ Transação já criada hoje: ${expense.name}`);
                    continue;
                }

                // Criar transação
                const transaction = await base44.asServiceRole.entities.FinancialTransaction.create({
                    user_phone: expense.user_phone,
                    description: expense.name,
                    amount: expense.amount,
                    date: format(today, 'yyyy-MM-dd'),
                    category: expense.category,
                    type: 'expense',
                    is_recurring: true,
                    priority: 'high',
                    source: 'manual',
                    notes: `Despesa recorrente criada automaticamente`
                });

                console.log(`✅ Transação criada: ${expense.name} - R$ ${expense.amount}`);

                // Enviar notificação
                const message = 
                    `✅ *TRANSAÇÃO CRIADA AUTOMATICAMENTE*\n\n` +
                    `📝 ${expense.name}\n` +
                    `💰 R$ ${expense.amount.toFixed(2)}\n` +
                    `📅 ${format(today, 'dd/MM/yyyy', { locale: ptBR })}\n\n` +
                    `A despesa recorrente foi registrada automaticamente.`;

                await base44.asServiceRole.functions.invoke('sendWhatsAppMessage', {
                    user_phone: expense.user_phone,
                    message: message
                });

                // Enviar email também
                const users = await base44.asServiceRole.entities.AuthenticatedUser.filter({ 
                    user_phone: expense.user_phone 
                });

                if (users.length > 0 && users[0].user_email) {
                    try {
                        await base44.asServiceRole.functions.invoke('sendCustomEmail', {
                            to: users[0].user_email,
                            subject: `✅ Transação Criada: ${expense.name}`,
                            body: message,
                            html: `
                                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                    <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 30px; border-radius: 10px 10px 0 0;">
                                        <h1 style="color: white; margin: 0;">✅ Transação Criada Automaticamente</h1>
                                    </div>
                                    <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                                        <h2 style="color: #1f2937; margin-top: 0;">${expense.name}</h2>
                                        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                                            <p style="margin: 10px 0;"><strong>💰 Valor:</strong> R$ ${expense.amount.toFixed(2)}</p>
                                            <p style="margin: 10px 0;"><strong>📅 Data:</strong> ${format(today, 'dd/MM/yyyy', { locale: ptBR })}</p>
                                            <p style="margin: 10px 0;"><strong>📂 Categoria:</strong> ${expense.category}</p>
                                        </div>
                                        <p style="color: #2563eb; font-weight: bold;">
                                            A despesa recorrente foi registrada automaticamente em suas transações.
                                        </p>
                                        <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
                                        <p style="color: #6b7280; font-size: 12px; text-align: center;">
                                            Sistema automático do FinanceIA
                                        </p>
                                    </div>
                                </div>
                            `,
                            from_name: "FinanceIA - Transações"
                        });
                    } catch (emailError) {
                        console.log(`⚠️ Erro ao enviar email (não crítico): ${emailError.message}`);
                    }
                }

            } catch (error) {
                console.error(`❌ Erro ao criar transação para ${expense.user_phone}:`, error);
            }
        }

        return Response.json({ 
            success: true,
            reminders_sent: expensesToRemind.length,
            transactions_created: expensesToCreate.length
        });

    } catch (error) {
        console.error("❌ Erro:", error);
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }
});