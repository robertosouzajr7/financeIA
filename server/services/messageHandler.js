const { PrismaClient } = require('@prisma/client');
const { generateResponse } = require('../utils/llm');

const prisma = new PrismaClient();

async function handleIncomingMessage({ from, message, media, mediaType, instanceName, sock }) {
  try {
    const userPhone = from.split('@')[0]; // Extract phone number
    
    console.log('🔍 Debug - Full message object:', { from, message, userPhone });
    
    // Find user with organization context
    let user = await prisma.user.findUnique({
      where: { user_phone: userPhone },
      include: {
        organizations: {
          include: {
            organization: true
          }
        }
      }
    });

    console.log('🔍 Debug - User found:', user ? `Yes (${user.user_phone})` : 'No');

    if (!user) {
      console.log(`❌ User not registered: ${userPhone}`);
      return;
    }

    // Determine active organization (default to first one for now)
    const activeOrg = user.organizations[0]?.organization;
    const orgContext = activeOrg ? `Você está assistindo a organização: ${activeOrg.name}.` : '';

    const now = new Date();
    const isAuthenticated = user.is_authenticated && 
                           user.authentication_expires && 
                           new Date(user.authentication_expires) > now;

    const conversationStarted = user.conversation_started;
    const hasKeyword = message && message.toLowerCase().includes('financeia');

    // Conversation Start Logic
    if (!conversationStarted && !hasKeyword && !isAuthenticated) {
      return;
    }

    if (hasKeyword && !conversationStarted) {
      await prisma.user.update({
        where: { id: user.id },
        data: { conversation_started: true }
      });

      if (isAuthenticated) {
        const welcomeMessage = `👋 Olá! Bem-vindo de volta ao FinanceIA${activeOrg ? ` (${activeOrg.name})` : ''}!\\n\\nVocê já está autenticado. Como posso ajudar?`;
        await sock.sendMessage(from, { text: welcomeMessage });
        return;
      } else {
        const loginPrompt = "👋 Olá! Bem-vindo ao FinanceIA!\\n\\n🔐 Para acessar seus dados financeiros, por favor envie sua senha de acesso.";
        await sock.sendMessage(from, { text: loginPrompt });
        return;
      }
    }

    // Logout Logic
    if (message && ['sair', 'logout', 'deslogar'].includes(message.toLowerCase())) {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          is_authenticated: false,
          authentication_expires: null,
          conversation_started: false
        }
      });
      const logoutMessage = "👋 Você foi deslogado com sucesso!\\n\\nPara acessar novamente, envie: financeIA";
      await sock.sendMessage(from, { text: logoutMessage });
      return;
    }

    // Authentication Logic
    if (!isAuthenticated) {
      if (!message) {
        const loginPrompt = "🔐 Autenticação Necessária\\n\\nPara acessar seus dados financeiros, envie sua senha de acesso.";
        await sock.sendMessage(from, { text: loginPrompt });
        return;
      }

      const providedHash = Buffer.from(message).toString('base64');
      
      if (providedHash === user.password_hash) {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            is_authenticated: true,
            last_authenticated: now,
            authentication_expires: expiresAt
          }
        });

        const welcomeMessage = `✅ Autenticação bem-sucedida!\\n\\n🎉 Bem-vindo ao FinanceIA${activeOrg ? ` (${activeOrg.name})` : ''}!`;
        await sock.sendMessage(from, { text: welcomeMessage });
        return;
      } else {
        const errorMessage = "❌ Senha incorreta\\n\\nTente novamente.";
        await sock.sendMessage(from, { text: errorMessage });
        return;
      }
    }

    // Authenticated - Process Message with LLM
    
    // --- MEDIA PROCESSING (Audio & Docs) ---
    let processedMessage = message; 

    if (media && mediaType) {
        if (mediaType.startsWith('audio')) {
            console.log('🎤 Audio detected, transcribing...');
            const { transcribeAudio } = require('../utils/llm');
            const transcription = await transcribeAudio(media, mediaType);
            if (transcription) {
                processedMessage = `[ÁUDIO TRANSCRITO]: ${transcription}`;
                console.log('📝 Transcription added to message:', processedMessage);
            } else {
                await sock.sendMessage(from, { text: "⚠️ Desculpe, não consegui entender o áudio." });
                return;
            }
        } else if (mediaType === 'application/pdf') {
             console.log('📄 PDF detected, extracting text...');
             try {
                 const pdf = require('pdf-parse');
                 const data = await pdf(media);
                 processedMessage = `[CONTEÚDO DO PDF]:\n${data.text}\n\n${message || ''}`;
                 console.log('📝 PDF text extracted, length:', data.text.length);
             } catch (err) {
                 console.error('❌ Error parsing PDF:', err);
                 await sock.sendMessage(from, { text: "⚠️ Tive um problema ao ler o arquivo PDF." });
                 return;
             }
        }
        // Images are handled directly by Claude in generateResponse via buffer
    } else {
        // If no media, use original message
        processedMessage = message;
    }

    // --- 1. Gather Financial Context ---
    const whereClause = activeOrg 
        ? { organization_id: activeOrg.id } 
        : { user_phone: user.user_phone };
    
    // A. Current Month Metrics
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactions = await prisma.financialTransaction.findMany({
        where: {
            ...whereClause,
            date: { gte: startOfMonth }
        }
    });

    let income = 0;
    let expense = 0;
    const categoryExpenses = {};

    monthlyTransactions.forEach(t => {
        if (t.type === 'INCOME') income += t.amount;
        if (t.type === 'EXPENSE') {
            expense += t.amount;
            // Aggregate by category
            categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
        }
    });

    const balance = income - expense;

    // B. Recent Activity (Last 10)
    const recentHistory = await prisma.financialTransaction.findMany({
        where: whereClause,
        orderBy: { date: 'desc' },
        take: 10
    });

    // Format Context String
    const financialContext = `
[DADOS FINANCEIROS ATUAIS - ATUALIZADO]
Mês Atual (${now.toLocaleDateString('pt-BR', { month: 'long' })}):
- Receitas: R$ ${income.toFixed(2)}
- Despesas: R$ ${expense.toFixed(2)}
- Saldo do Mês: R$ ${balance.toFixed(2)}

Gastos por Categoria (Top):
${Object.entries(categoryExpenses)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5) // Top 5 categories
    .map(([cat, val]) => `- ${cat}: R$ ${val.toFixed(2)}`)
    .join('\n') || 'Nenhuma despesa registrada ainda.'}

Últimas 10 Transações:
${recentHistory.map(t => `- [${new Date(t.date).toLocaleDateString('pt-BR')}] ${t.description} (${t.type === 'INCOME' ? '+' : '-'} R$ ${t.amount.toFixed(2)})`).join('\n')}
`;

    const messageWithContext = `${orgContext}\n${financialContext}\n\nUsuário diz: ${processedMessage || '[Enviou uma imagem]'}`;
    
    // Pass media only if it's an image (for Claude Vision), otherwise we already extracted text
    const mediaForLLM = (mediaType && mediaType.startsWith('image')) ? media : null;
    const mediaTypeForLLM = (mediaType && mediaType.startsWith('image')) ? mediaType : null;

    const rawLlmResponse = await generateResponse(messageWithContext, [], mediaForLLM, mediaTypeForLLM);
    console.log('🤖 Raw LLM Response:', rawLlmResponse);
    
    // Check for JSON action block
    const jsonMatch = rawLlmResponse.match(/```json\s*([\s\S]*?)\s*```/);
    let finalMessage = rawLlmResponse;

    if (jsonMatch && jsonMatch[1]) {
        try {
            const actionData = JSON.parse(jsonMatch[1]);
            console.log('🧩 Parsed Action Data:', actionData);
            
            if (actionData.action === 'create_transaction' && actionData.data) {
                console.log('📝 Executing transaction creation:', actionData.data);
                
                const { type, amount, description, category, date } = actionData.data;
                
                // Debug Org Context
                console.log('🏢 User Orgs:', user.organizations.length);
                console.log('🏢 Active Org:', activeOrg ? activeOrg.id : 'None');
                
                // Validate and format
                const transactionData = {
                    type: type.toUpperCase(),
                    amount: parseFloat(amount),
                    description: description || 'Sem descrição',
                    category: category || 'Outros',
                    date: date ? new Date(date) : new Date(),
                    user_phone: user.user_phone, // Correct relation field
                    organization_id: activeOrg ? activeOrg.id : user.organizations[0]?.organization_id // Fallback
                };

                if (transactionData.organization_id) {
                    const newTx = await prisma.financialTransaction.create({
                        data: transactionData
                    });
                    console.log('✅ Transaction saved to DB! ID:', newTx.id);
                } else {
                    console.log('⚠️ Saving without organization context (User-only mode not fully supported by schema but trialing)');
                     // Schema says organization_id is optional?
                     // organization_id String? // Opcional durante migração
                     const newTx = await prisma.financialTransaction.create({
                        data: transactionData
                    });
                    console.log('✅ Transaction saved to DB (No Org)! ID:', newTx.id);
                }
            } else if (actionData.action === 'delete_transaction') {
                console.log('🗑️ Executing transaction deletion request');
                
                const whereClause = activeOrg 
                  ? { organization_id: activeOrg.id } 
                  : { user_phone: user.user_phone };

                // Find the most recent transaction
                const lastTransaction = await prisma.financialTransaction.findFirst({
                    where: whereClause,
                    orderBy: { created_at: 'desc' } // Assuming created_at exists, or use 'date' if not
                });

                if (lastTransaction) {
                    await prisma.financialTransaction.delete({
                        where: { id: lastTransaction.id }
                    });
                    console.log('✅ Transaction deleted:', lastTransaction.id);
                    finalMessage += "\n\n✅ Última transação apagada com sucesso!";
                } else {
                    console.log('⚠️ No transaction found to delete');
                    finalMessage += "\n\n⚠️ Não encontrei nenhuma transação recente para apagar.";
                }
            }

            // Remove the JSON block from the message sent to the user
            finalMessage = rawLlmResponse.replace(/```json[\s\S]*?```/, '').trim();
        } catch (e) {
            console.error('❌ Error parsing/executing LLM action:', e);
        }
    } else {
        console.log('⚠️ No JSON block found in response');
    }

    await sock.sendMessage(from, { text: finalMessage });

  } catch (error) {
    console.error('Error handling message:', error);
  }
}

module.exports = { handleIncomingMessage };
