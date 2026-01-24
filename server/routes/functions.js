const express = require('express');
const axios = require('axios');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to send WhatsApp message (duplicated from webhook, maybe move to utils later)
const sendWhatsAppMessage = async (phone, message, instanceName = 'financeia') => {
  try {
    const evolutionApiToken = process.env.EVOLUTION_API_TOKEN;
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'https://api.evolution-api.com';

    if (!evolutionApiToken) {
      console.log('⚠️ EVOLUTION_API_TOKEN not set. Message not sent:', message);
      return { success: false, error: 'Token not set' };
    }

    await axios.post(
      `${evolutionApiUrl}/message/sendText/${instanceName}`,
      {
        number: phone,
        options: { delay: 1200, presence: "composing", linkPreview: false },
        textMessage: { text: message }
      },
      { headers: { apikey: evolutionApiToken } }
    );
    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.message);
    return { success: false, error: error.message };
  }
};

const handlers = {
    sendWhatsAppMessage: async (payload) => {
        const { phone, message, instanceName } = payload;
        return await sendWhatsAppMessage(phone, message, instanceName);
    },
    sendCustomEmail: async (payload) => {
        console.log('📧 Sending email:', payload);
        // TODO: Integrate Nodemailer with SMTP settings from env
        // For now, just log it as successful
        return { success: true, message: 'Email logged (simulation)' };
    },
    checkRecurringExpenses: async (payload) => {
        console.log('🔄 Checking recurring expenses...');
        const today = new Date();
        const dayOfMonth = today.getDate();
        
        // Find active recurring expenses due today
        const expenses = await prisma.recurringExpense.findMany({
            where: {
                is_active: true,
                due_day: dayOfMonth
            },
            include: { user: true } // Assuming relation exists or we fetch user by phone
        });

        let remindersSent = 0;
        let transactionsCreated = 0;

        for (const expense of expenses) {
            // Create transaction if auto-create is on
            if (expense.auto_create) {
                await prisma.financialTransaction.create({
                    data: {
                        user_phone: expense.user_phone,
                        description: expense.description,
                        amount: expense.amount,
                        category: expense.category,
                        type: 'expense',
                        date: new Date(),
                        is_recurring: true,
                        source: 'recurring_auto'
                    }
                });
                transactionsCreated++;
            }

            // Send reminder if enabled
            if (expense.send_reminder) {
                const message = `📅 Lembrete de Despesa Recorrente:\n\n${expense.description}\nValor: R$ ${expense.amount}\nVencimento: Hoje!`;
                await sendWhatsAppMessage(expense.user_phone, message);
                remindersSent++;
            }
        }

        return { reminders_sent: remindersSent, transactions_created: transactionsCreated };
    }
};

router.post('/:functionName', async (req, res) => {
    const { functionName } = req.params;
    const handler = handlers[functionName];
    
    if (!handler) {
        console.warn(`Function ${functionName} not found`);
        return res.status(404).json({ error: 'Function not found' });
    }

    try {
        const result = await handler(req.body);
        res.json({ data: result });
    } catch (error) {
        console.error(`Error executing ${functionName}:`, error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
