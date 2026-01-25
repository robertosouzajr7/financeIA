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
    const messageWithContext = `${orgContext}\n\nUsuário diz: ${message || '[Enviou uma imagem]'}`;
    
    // Pass media if available
    const rawLlmResponse = await generateResponse(messageWithContext, [], media, mediaType);
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
