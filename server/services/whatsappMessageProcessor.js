/**
 * WhatsApp Message Processor
 *
 * Processa mensagens recebidas via WhatsApp e executa ações no sistema
 */

const { PrismaClient } = require('@prisma/client');
const { startOfMonth, endOfMonth, format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const { invokeLLM } = require('../utils/llm');
const whatsappMessageService = require('./whatsappMessageService');

const prisma = new PrismaClient();

/**
 * Processa uma mensagem recebida via WhatsApp
 * @param {Object} params - Parâmetros da mensagem
 */
async function processMessage({ user_phone, message, instance_name, has_media = false, media_type = null, media_data = null }) {
    try {
        console.log(`📞 Processando mensagem de ${user_phone}: ${message}`);
        console.log(`🎨 Mídia: ${has_media ? media_type : 'nenhuma'}`);

        // VERIFICAÇÃO DE USUÁRIO CADASTRADO
        const authUsers = await prisma.user.findMany({
            where: { user_phone },
            include: {
                organizations: {
                    include: {
                        organization: true
                    }
                }
            }
        });

        if (authUsers.length === 0) {
            console.log("❌ Usuário não cadastrado - sem resposta");
            return {
                success: true,
                response: "User not registered - no response sent",
                access_denied: true,
                silent: true
            };
        }

        const authUser = authUsers[0];

        const now = new Date();
        const isAuthenticated = authUser.is_authenticated &&
            authUser.authentication_expires &&
            new Date(authUser.authentication_expires) > now;

        const conversationStarted = authUser.conversation_started;

        // VERIFICAR PALAVRA-CHAVE "financeIA"
        const hasKeyword = message && message.toLowerCase().includes('financeia');

        if (!conversationStarted && !hasKeyword && !isAuthenticated) {
            console.log("⏸️  Aguardando palavra-chave 'financeIA' - sem resposta");
            return {
                success: true,
                response: "Waiting for keyword - no response sent",
                waiting_for_keyword: true,
                silent: true
            };
        }

        if (hasKeyword && !conversationStarted) {
            console.log("🔑 Palavra-chave detectada! Iniciando conversa...");

            await prisma.user.update({
                where: { id: authUser.id },
                data: { conversation_started: true }
            });

            if (isAuthenticated) {
                const welcomeMessage = "👋 Olá! Bem-vindo de volta ao FinanceIA!\n\nVocê já está autenticado. Como posso ajudar?\n\n• Qual meu saldo?\n• Registre uma despesa\n• Minhas despesas este mês\n• Envie um comprovante (foto ou PDF)\n\nPara sair: envie 'sair'";

                await whatsappMessageService.sendMessage({
                    user_phone,
                    message: welcomeMessage,
                    instance_name
                });

                return {
                    success: true,
                    response: welcomeMessage,
                    keyword_accepted: true
                };
            } else {
                const loginPrompt = "👋 Olá! Bem-vindo ao FinanceIA!\n\n🔐 Para acessar seus dados financeiros, por favor envie sua senha de acesso.";

                await whatsappMessageService.sendMessage({
                    user_phone,
                    message: loginPrompt,
                    instance_name
                });

                return {
                    success: true,
                    response: loginPrompt,
                    keyword_accepted: true,
                    requires_authentication: true
                };
            }
        }

        // Comandos de logout
        if (message && (message.toLowerCase() === 'sair' || message.toLowerCase() === 'logout' || message.toLowerCase() === 'deslogar')) {
            await prisma.user.update({
                where: { id: authUser.id },
                data: {
                    is_authenticated: false,
                    authentication_expires: null,
                    conversation_started: false
                }
            });

            const logoutMessage = "👋 Você foi deslogado com sucesso!\n\nPara acessar novamente, envie: financeIA";

            await whatsappMessageService.sendMessage({
                user_phone,
                message: logoutMessage,
                instance_name
            });

            return {
                success: true,
                response: logoutMessage
            };
        }

        // AUTENTICAÇÃO
        if (!isAuthenticated) {
            if (!message) {
                const loginPrompt = "🔐 Autenticação Necessária\n\nPara acessar seus dados financeiros, envie sua senha de acesso.";

                await whatsappMessageService.sendMessage({
                    user_phone,
                    message: loginPrompt,
                    instance_name
                });

                return {
                    success: true,
                    response: loginPrompt,
                    requires_authentication: true
                };
            }

            const providedPasswordHash = Buffer.from(message).toString('base64');

            if (providedPasswordHash === authUser.password_hash) {
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24);

                await prisma.user.update({
                    where: { id: authUser.id },
                    data: {
                        is_authenticated: true,
                        last_authenticated: now,
                        authentication_expires: expiresAt
                    }
                });

                const welcomeMessage = "✅ Autenticação bem-sucedida!\n\n🎉 Bem-vindo ao FinanceIA!\n\nVocê está autenticado por 24 horas.\n\nPara começar:\n• Qual meu saldo?\n• Registre uma despesa de 50 reais\n• Envie um comprovante (foto ou PDF)\n\nPara sair: envie 'sair'";

                await whatsappMessageService.sendMessage({
                    user_phone,
                    message: welcomeMessage,
                    instance_name
                });

                return {
                    success: true,
                    response: welcomeMessage,
                    authenticated: true
                };
            } else {
                const errorMessage = "❌ Senha incorreta\n\nTente novamente ou entre em contato com o administrador.";

                await whatsappMessageService.sendMessage({
                    user_phone,
                    message: errorMessage,
                    instance_name
                });

                return {
                    success: true,
                    response: errorMessage,
                    authentication_failed: true
                };
            }
        }

        // USUÁRIO AUTENTICADO - Processar mensagem/mídia

        // ===== PROCESSAR IMAGEM OU PDF DE COMPROVANTE (PREMIUM) =====
        if (has_media && (media_type === 'image' || media_type === 'document')) {
            return await processMediaReceipt({
                user_phone,
                authUser,
                media_type,
                media_data,
                instance_name
            });
        }

        // ===== PROCESSAR TEXTO NORMAL =====
        return await processTextMessage({
            user_phone,
            authUser,
            message,
            instance_name
        });

    } catch (error) {
        console.error("❌ Erro ao processar mensagem:", error);

        try {
            if (user_phone && instance_name) {
                await whatsappMessageService.sendMessage({
                    user_phone,
                    message: "Desculpe, tive um problema ao processar. Tente novamente.",
                    instance_name
                });
            }
        } catch (e) {
            console.error("❌ Erro ao enviar mensagem de erro:", e);
        }

        throw error;
    }
}

/**
 * Helper function to get or create default organization for user
 */
async function getOrCreateDefaultOrganization(authUser) {
    // Check if user already has an organization
    if (authUser.organizations && authUser.organizations.length > 0) {
        return authUser.organizations[0].organization_id;
    }

    // Find first organization user is a member of
    let org = await prisma.organization.findFirst({
        where: {
            members: {
                some: { user_id: authUser.id }
            }
        }
    });

    // Create default organization if none exists
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: `Organização de ${authUser.user_name || authUser.user_phone}`,
                slug: `org-${authUser.id}`,
                members: {
                    create: {
                        user_id: authUser.id,
                        role: 'OWNER'
                    }
                }
            }
        });
        console.log(`✅ Organização padrão criada: ${org.id}`);
    }

    return org.id;
}

/**
 * Processa comprovante (imagem ou PDF)
 */
async function processMediaReceipt({ user_phone, authUser, media_type, media_data, instance_name }) {
    console.log("📸 Verificando se processamento de imagem está habilitado...");

    // Verificar configurações do sistema
    const systemSettings = await prisma.systemSettings.findFirst();

    if (!systemSettings?.enable_image_processing || !systemSettings?.claude_api_key) {
        console.log("❌ Processamento de imagem desabilitado ou sem Claude API Key");

        const message = "📸 *Processamento de Comprovantes*\n\n" +
            "Este é um recurso PREMIUM disponível apenas para usuários do plano Pro.\n\n" +
            "✨ Com o plano Pro você pode:\n" +
            "• Enviar fotos de comprovantes\n" +
            "• Enviar PDFs de extratos\n" +
            "• Extrair dados automaticamente\n\n" +
            "Por favor, descreva a transação manualmente:\n" +
            "Exemplo: \"Despesa de 50 reais no supermercado\"";

        await whatsappMessageService.sendMessage({
            user_phone,
            message,
            instance_name
        });

        return {
            success: true,
            response: message,
            premium_feature_required: true
        };
    }

    // Verificar se usuário tem plano Pro
    const subscriptions = await prisma.subscription.findMany({
        where: { user_email: authUser.user_phone }
    });

    const hasProPlan = subscriptions.length > 0 &&
        subscriptions[0].status === 'active';

    if (!hasProPlan) {
        console.log("❌ Usuário não tem plano Pro");

        const message = "📸 *Recurso Premium*\n\n" +
            "O processamento de comprovantes está disponível apenas no plano Pro.\n\n" +
            "Faça upgrade para desbloquear:\n" +
            "• Envio de comprovantes em foto\n" +
            "• Upload de PDFs\n" +
            "• Extração automática de dados\n" +
            "• E muito mais!\n\n" +
            "Enquanto isso, descreva a transação:\n" +
            "Ex: \"Despesa de 50 reais no supermercado\"";

        await whatsappMessageService.sendMessage({
            user_phone,
            message,
            instance_name
        });

        return {
            success: true,
            response: message,
            requires_pro_plan: true
        };
    }

    // PROCESSAR COMPROVANTE COM CLAUDE
    console.log("🤖 Processando comprovante com Claude...");

    try {
        let mediaBuffer;

        // Verificar se temos base64 diretamente do webhook
        if (media_data?.base64) {
            mediaBuffer = Buffer.from(media_data.base64, 'base64');
        } else if (media_data?.url) {
            // Fallback: baixar da URL
            const axios = require('axios');
            const token = process.env.EVOLUTION_API_TOKEN;
            const response = await axios.get(media_data.url, {
                headers: { 'apikey': token },
                responseType: 'arraybuffer'
            });
            mediaBuffer = Buffer.from(response.data);
        } else {
            throw new Error('Nenhuma mídia fornecida');
        }

        // Converter para base64
        const base64Image = mediaBuffer.toString('base64');

        // Chamar Claude API diretamente
        const axios = require('axios');
        const claudeResponse = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: media_type === 'document' ? 'application/pdf' : 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        type: 'text',
                        text: `Analise este comprovante e extraia: tipo (income/expense), valor em reais, descrição, categoria (moradia/alimentacao/transporte/saude/educacao/familia/lazer/dividas/investimentos/outros), data (YYYY-MM-DD). Responda APENAS com JSON: {"type": "...", "amount": 0, "description": "...", "category": "...", "date": "..."}`
                    }
                ]
            }]
        }, {
            headers: {
                'x-api-key': systemSettings.claude_api_key,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            }
        });

        const extractedText = claudeResponse.data.content[0].text;
        const transactionData = JSON.parse(extractedText);

        // Get or create organization for user
        const organizationId = await getOrCreateDefaultOrganization(authUser);

        // NÃO salvar imediatamente - armazenar para confirmação
        const { storePendingConfirmation } = require('./pendingConfirmations');

        storePendingConfirmation(user_phone, {
            type: 'transaction',
            data: {
                user_phone: user_phone,
                organization_id: organizationId,
                description: transactionData.description,
                amount: transactionData.amount,
                date: transactionData.date || new Date().toISOString().split('T')[0],
                category: transactionData.category,
                type: transactionData.type,
                is_recurring: false,
                priority: "medium",
                source: media_type === 'image' ? "ocr" : "import",
                notes: `Criado via comprovante com IA`
            }
        });

        // Enviar mensagem de confirmação
        const confirmationMessage =
            `📸 *Dados Extraídos do Comprovante:*\n\n` +
            `💰 *${transactionData.type === 'income' ? 'Receita' : 'Despesa'}:* R$ ${transactionData.amount.toFixed(2)}\n` +
            `📝 *Descrição:* ${transactionData.description}\n` +
            `📂 *Categoria:* ${transactionData.category}\n` +
            `📅 *Data:* ${format(new Date(transactionData.date), 'dd/MM/yyyy', { locale: ptBR })}\n\n` +
            `✅ *Os dados estão corretos?*\n\n` +
            `Digite *SIM* para confirmar ou *NÃO* para cancelar.`;

        await whatsappMessageService.sendMessage({
            user_phone,
            message: confirmationMessage,
            instance_name
        });

        return {
            success: true,
            response: confirmationMessage,
            pending_confirmation: true
        };

    } catch (error) {
        console.error("❌ Erro ao processar com Claude:", error);

        const errorMessage = `❌ Não consegui processar o comprovante.\n\n` +
            `Por favor, descreva a transação manualmente:\n\n` +
            `Exemplo: "Despesa de 50 reais no supermercado"`;

        await whatsappMessageService.sendMessage({
            user_phone,
            message: errorMessage,
            instance_name
        });

        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Processa mensagem de texto normal
 */
async function processTextMessage({ user_phone, authUser, message, instance_name }) {
    console.log("🔍 Detectando intenção do texto...");

    // Verificar se há confirmação pendente
    const { getPendingConfirmation, clearPendingConfirmation } = require('./pendingConfirmations');
    const pending = getPendingConfirmation(user_phone);

    if (pending && pending.type === 'transaction') {
        const userResponse = message.toLowerCase().trim();

        if (userResponse === 'sim' || userResponse === 's') {
            // Confirmar e salvar transação
            const transaction = await prisma.financialTransaction.create({
                data: pending.data
            });

            clearPendingConfirmation(user_phone);

            const confirmationMessage =
                `✅ *Transação registrada com sucesso!*\n\n` +
                `💰 *${pending.data.type === 'income' ? 'Receita' : 'Despesa'}:* R$ ${pending.data.amount.toFixed(2)}\n` +
                `📝 *Descrição:* ${pending.data.description}\n` +
                `📂 *Categoria:* ${pending.data.category}\n` +
                `📅 *Data:* ${format(new Date(pending.data.date), 'dd/MM/yyyy', { locale: ptBR })}\n\n` +
                `ID: ${transaction.id}`;

            await whatsappMessageService.sendMessage({
                user_phone,
                message: confirmationMessage,
                instance_name
            });

            return {
                success: true,
                response: confirmationMessage,
                transaction_created: transaction
            };

        } else if (userResponse === 'não' || userResponse === 'nao' || userResponse === 'n') {
            // Cancelar transação
            clearPendingConfirmation(user_phone);

            const cancelMessage = `❌ *Transação cancelada.*\n\nOs dados não foram salvos.`;

            await whatsappMessageService.sendMessage({
                user_phone,
                message: cancelMessage,
                instance_name
            });

            return {
                success: true,
                response: cancelMessage,
                transaction_cancelled: true
            };

        } else {
            // Resposta inválida
            const retryMessage = `Por favor, responda apenas *SIM* ou *NÃO*.`;

            await whatsappMessageService.sendMessage({
                user_phone,
                message: retryMessage,
                instance_name
            });

            return {
                success: true,
                response: retryMessage,
                waiting_for_confirmation: true
            };
        }
    }

    const actionDetectionPrompt = `Você é um assistente que identifica se uma mensagem do usuário requer alguma ação no sistema financeiro.

MENSAGEM DO USUÁRIO: "${message}"

Analise se o usuário está pedindo para:
1. Criar uma transação (receita ou despesa)
2. Criar um orçamento
3. Criar uma meta financeira
4. Apenas consultando informações (sem ação necessária)

Se for uma ação, extraia os dados em formato JSON. Se for apenas consulta, retorne {"action": "query"}.

EXEMPLOS:
- "cadastre uma receita de 1000 reais do meu salário" → {"action": "create_transaction", "type": "income", "amount": 1000, "description": "salário", "category": "outros"}
- "registre uma despesa de 50 reais no supermercado" → {"action": "create_transaction", "type": "expense", "amount": 50, "description": "supermercado", "category": "alimentacao"}
- "despesa de 250 uber categoria transporte" → {"action": "create_transaction", "type": "expense", "amount": 250, "description": "uber", "category": "transporte"}
- "crie um orçamento de 500 reais para alimentação" → {"action": "create_budget", "category": "alimentacao", "limit_amount": 500}
- "quero criar uma meta de 10000 reais para viajar" → {"action": "create_goal", "title": "viajar", "target_amount": 10000}
- "quais minhas despesas?" → {"action": "query"}

CATEGORIAS VÁLIDAS: moradia, alimentacao, transporte, saude, educacao, familia, lazer, dividas, investimentos, outros

Responda APENAS com o JSON, nada mais.`;

    let actionDetection = null;

    try {
        const response = await invokeLLM(actionDetectionPrompt, { useInternet: false });
        // Tentar extrair JSON da resposta
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            actionDetection = JSON.parse(jsonMatch[0]);
        } else {
            actionDetection = JSON.parse(response);
        }

        console.log("🎯 Ação detectada:", JSON.stringify(actionDetection, null, 2));
    } catch (error) {
        console.error("❌ Erro ao detectar ação:", error);
        actionDetection = { action: "query" };
    }

    let actionResult = null;

    if (actionDetection && actionDetection.action === "create_transaction") {
        console.log("💰 Criando transação...");

        // Get or create organization for user
        const organizationId = await getOrCreateDefaultOrganization(authUser);

        const transaction = await prisma.financialTransaction.create({
            data: {
                user_phone: user_phone,
                organization_id: organizationId,
                description: actionDetection.description || "Transação via WhatsApp",
                amount: actionDetection.amount,
                date: new Date().toISOString().split('T')[0],
                category: actionDetection.category || "outros",
                type: actionDetection.type,
                is_recurring: false,
                priority: "medium",
                source: "manual",
                notes: `Criado via WhatsApp: ${message}`
            }
        });

        actionResult = {
            success: true,
            message: `✅ Transação criada com sucesso!\n\n💰 ${actionDetection.type === 'income' ? 'Receita' : 'Despesa'}: R$ ${actionDetection.amount.toFixed(2)}\n📝 ${actionDetection.description}\n📂 Categoria: ${actionDetection.category}`,
            data: transaction
        };

        console.log("✅ Transação criada:", transaction.id);

    } else if (actionDetection && actionDetection.action === "create_budget") {
        console.log("📊 Criando orçamento...");

        // Get or create organization for user
        const organizationId = await getOrCreateDefaultOrganization(authUser);

        const budget = await prisma.budget.create({
            data: {
                user_phone: user_phone,
                organization_id: organizationId,
                category: actionDetection.category || "outros",
                limit_amount: actionDetection.limit_amount,
                period: "monthly",
                alert_threshold: 80,
                start_date: new Date().toISOString().split('T')[0],
                is_active: true
            }
        });

        actionResult = {
            success: true,
            message: `✅ Orçamento criado!\n\n📊 Categoria: ${actionDetection.category}\n💵 Limite: R$ ${actionDetection.limit_amount.toFixed(2)}/mês`,
            data: budget
        };

        console.log("✅ Orçamento criado:", budget.id);

    } else if (actionDetection && actionDetection.action === "create_goal") {
        console.log("🎯 Criando meta...");

        // Get or create organization for user
        const organizationId = await getOrCreateDefaultOrganization(authUser);

        const goal = await prisma.goal.create({
            data: {
                user_phone: user_phone,
                organization_id: organizationId,
                title: actionDetection.title || "Nova meta",
                description: `Criado via WhatsApp: ${message}`,
                target_amount: actionDetection.target_amount,
                current_amount: 0,
                priority: "medium",
                timeline: "medium",
                status: "planning",
                category: "outros"
            }
        });

        actionResult = {
            success: true,
            message: `✅ Meta criada!\n\n🎯 ${actionDetection.title}\n💰 Objetivo: R$ ${actionDetection.target_amount.toFixed(2)}`,
            data: goal
        };

        console.log("✅ Meta criada:", goal.id);
    }

    if (actionResult) {
        await whatsappMessageService.sendMessage({
            user_phone,
            message: actionResult.message,
            instance_name
        });

        return {
            success: true,
            response: actionResult.message,
            action_executed: actionResult
        };
    }

    // ===== CONSULTA NORMAL =====
    console.log("📊 Buscando dados do usuário...");

    const knowledgeDocs = await prisma.knowledgeDocument.findMany({
        where: { is_active: true }
    });
    console.log(`📚 Base de conhecimento: ${knowledgeDocs.length} documentos ativos`);

    let knowledgeContext = "";
    if (knowledgeDocs.length > 0) {
        knowledgeContext = "\n\n═══ BASE DE CONHECIMENTO ═══\n";
        knowledgeDocs.forEach(doc => {
            knowledgeContext += `\n📄 ${doc.title} (${doc.category})\n${doc.content}\n`;
        });
    }

    let transactions = await prisma.financialTransaction.findMany({
        where: { user_phone }
    });

    // Buscar budgets e goals
    const [budgets, goals] = await Promise.all([
        prisma.budget.findMany({ where: { user_phone, is_active: true } }),
        prisma.goal.findMany({ where: { user_phone } })
    ]);

    console.log(`📊 Dados: ${transactions.length} transações, ${budgets.length} orçamentos, ${goals.length} metas`);

    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);

    const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= startDate && tDate <= endDate;
    });

    const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = {};
    monthTransactions.filter(t => t.type === 'expense').forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    });

    const historicIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const historicExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const recentTransactions = monthTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map(t => `${format(new Date(t.date), 'dd/MM', { locale: ptBR })}: ${t.description} - R$ ${t.amount.toFixed(2)} (${t.type === 'income' ? 'Receita' : 'Despesa'}, ${t.category})`)
        .join('\n');

    const responsePrompt = `Você é o FinanceIA, um assistente financeiro pessoal via WhatsApp.

DADOS FINANCEIROS ATUALIZADOS (${format(today, "MMMM 'de' yyyy", { locale: ptBR })}):

═══ RESUMO DO MÊS ATUAL ═══
• Receitas: R$ ${totalIncome.toFixed(2)}
• Despesas: R$ ${totalExpenses.toFixed(2)}
• Saldo: R$ ${(totalIncome - totalExpenses).toFixed(2)}
• Transações: ${monthTransactions.length}

═══ DESPESAS POR CATEGORIA ═══
${Object.entries(expensesByCategory).length > 0 ?
        Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]).map(([cat, val]) => `• ${cat}: R$ ${val.toFixed(2)}`).join('\n')
        : '• Nenhuma despesa este mês'}

═══ TRANSAÇÕES RECENTES ═══
${recentTransactions || 'Nenhuma transação'}

═══ HISTÓRICO COMPLETO ═══
• Receitas: R$ ${historicIncome.toFixed(2)}
• Despesas: R$ ${historicExpenses.toFixed(2)}
• Total de transações: ${transactions.length}
${knowledgeContext}

═══ MENSAGEM DO USUÁRIO ═══
"${message || '[sem mensagem de texto]'}"

INSTRUÇÕES:
1. Use os valores EXATOS acima
2. Se houver informações na Base de Conhecimento relevantes para a pergunta, use-as na resposta
3. Seja amigável e use emojis moderadamente (1-2 por mensagem)
4. Máximo 4-5 linhas
5. Responda em português brasileiro

Responda:`;

    console.log("🤖 Gerando resposta...");

    const aiResponse = await invokeLLM(responsePrompt, { useInternet: false });

    console.log(`✅ Resposta: ${aiResponse.substring(0, 100)}...`);

    await whatsappMessageService.sendMessage({
        user_phone,
        message: aiResponse,
        instance_name
    });

    console.log("✅ Mensagem enviada!");

    return {
        success: true,
        response: aiResponse
    };
}

module.exports = {
    processMessage
};
