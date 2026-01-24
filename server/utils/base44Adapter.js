/**
 * Base44 SDK Adapter
 *
 * Este arquivo fornece uma camada de compatibilidade para substituir o @base44/sdk
 * com nossa própria implementação usando Prisma ORM e serviços internos.
 *
 * Isso permite migrar gradualmente as serverless functions sem quebrar código existente.
 */

const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const { invokeLLM } = require('./llm');

const prisma = new PrismaClient();

/**
 * Cria um cliente compatível com Base44 SDK a partir de uma request Express
 * @param {Express.Request} req - Request object do Express
 * @returns {Object} Cliente compatível com Base44 SDK
 */
function createClientFromRequest(req) {
    // Extrair token JWT do header
    const authHeader = req.headers.authorization;
    let user = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
        } catch (error) {
            console.error('Token inválido:', error.message);
        }
    }

    return {
        // Autenticação
        auth: {
            /**
             * Retorna o usuário autenticado
             */
            me: async () => {
                if (!user) return null;

                const dbUser = await prisma.user.findUnique({
                    where: { id: user.id },
                    include: {
                        memberships: {
                            include: {
                                organization: true
                            }
                        }
                    }
                });

                return dbUser ? {
                    id: dbUser.id,
                    email: dbUser.user_phone, // compatibilidade
                    user_phone: dbUser.user_phone,
                    full_name: dbUser.user_name,
                    ...dbUser
                } : null;
            },

            /**
             * Verifica se há um usuário autenticado
             */
            isAuthenticated: async () => {
                return user !== null;
            }
        },

        // Service Role (acesso sem restrições de autenticação)
        asServiceRole: {
            entities: createEntitiesAdapter(),
            integrations: createIntegrationsAdapter(),
            functions: createFunctionsAdapter(req)
        }
    };
}

/**
 * Cria adapter para acessar entidades (modelos do Prisma)
 */
function createEntitiesAdapter() {
    // Helper genérico para CRUD
    const createEntityAdapter = (modelName) => ({
        /**
         * Lista todos os registros
         * @param {String} orderBy - Campo para ordenação (ex: '-created_at')
         * @param {Number} limit - Limite de registros
         */
        list: async (orderBy = '-created_at', limit = 100) => {
            const [field, direction] = orderBy.startsWith('-')
                ? [orderBy.substring(1), 'desc']
                : [orderBy, 'asc'];

            return await prisma[modelName].findMany({
                take: limit,
                orderBy: { [field]: direction }
            });
        },

        /**
         * Filtra registros por critérios
         * @param {Object} filters - Objeto com filtros
         */
        filter: async (filters) => {
            return await prisma[modelName].findMany({
                where: filters
            });
        },

        /**
         * Cria um novo registro
         * @param {Object} data - Dados para criar
         */
        create: async (data) => {
            return await prisma[modelName].create({
                data
            });
        },

        /**
         * Atualiza um registro existente
         * @param {String} id - ID do registro
         * @param {Object} data - Dados para atualizar
         */
        update: async (id, data) => {
            return await prisma[modelName].update({
                where: { id },
                data
            });
        },

        /**
         * Deleta um registro
         * @param {String} id - ID do registro
         */
        delete: async (id) => {
            return await prisma[modelName].delete({
                where: { id }
            });
        },

        /**
         * Busca um registro por ID
         * @param {String} id - ID do registro
         */
        get: async (id) => {
            return await prisma[modelName].findUnique({
                where: { id }
            });
        }
    });

    // Mapear modelos do Prisma para nomes do Base44
    const entityMapping = {
        AuthenticatedUser: 'user',
        FinancialTransaction: 'financialTransaction',
        Budget: 'budget',
        Goal: 'goal',
        RecurringExpense: 'recurringExpense',
        WhatsAppInstance: 'whatsAppInstance',
        Subscription: 'subscription',
        Plan: 'plan',
        Invoice: 'invoice',
        Alert: 'alert',
        ConversationMessage: 'conversationMessage', // Será criado
        KnowledgeDocument: 'knowledgeDocument',
        SystemSettings: 'systemSettings',
        Organization: 'organization',
        Debt: 'debt',
        EmailTemplate: 'emailTemplate',
        SupportTicket: 'supportTicket'
    };

    const entities = {};

    for (const [base44Name, prismaModel] of Object.entries(entityMapping)) {
        entities[base44Name] = createEntityAdapter(prismaModel);
    }

    return entities;
}

/**
 * Cria adapter para integrações externas
 */
function createIntegrationsAdapter() {
    return {
        Core: {
            /**
             * Invoca um LLM (Language Model)
             * @param {Object} options - Opções para a chamada
             */
            InvokeLLM: async ({ prompt, add_context_from_internet = false, response_json_schema = null }) => {
                try {
                    const response = await invokeLLM(prompt, {
                        useInternet: add_context_from_internet,
                        jsonSchema: response_json_schema
                    });

                    // Se espera JSON, tentar parsear
                    if (response_json_schema) {
                        try {
                            return JSON.parse(response);
                        } catch (e) {
                            console.warn('LLM não retornou JSON válido, tentando extrair...');
                            const jsonMatch = response.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                return JSON.parse(jsonMatch[0]);
                            }
                            throw new Error('Resposta não está em formato JSON');
                        }
                    }

                    return response;
                } catch (error) {
                    console.error('Erro ao invocar LLM:', error);
                    throw error;
                }
            },

            /**
             * Envia email
             * @param {Object} options - Opções de email
             */
            SendEmail: async ({ to, subject, body, from = null }) => {
                const emailService = require('../services/emailService');
                return await emailService.sendEmail({
                    to,
                    subject,
                    html: body,
                    from: from || process.env.EMAIL_FROM
                });
            }
        }
    };
}

/**
 * Cria adapter para invocar funções serverless
 * Durante a migração, isso permitirá chamar tanto funções antigas quanto novas
 */
function createFunctionsAdapter(req) {
    return {
        /**
         * Invoca uma função por nome
         * @param {String} functionName - Nome da função
         * @param {Object} params - Parâmetros para a função
         */
        invoke: async (functionName, params) => {
            // Mapeamento de funções antigas para novas rotas/services
            const functionMapping = {
                sendWhatsAppMessage: async (params) => {
                    const whatsappService = require('../services/whatsappMessageService');
                    return await whatsappService.sendMessage(params);
                },

                processWhatsAppMessage: async (params) => {
                    const whatsappProcessor = require('../services/whatsappMessageProcessor');
                    return await whatsappProcessor.processMessage(params);
                },

                sendCustomEmail: async (params) => {
                    const emailService = require('../services/emailService');
                    return await emailService.sendEmail(params);
                },

                exportTransactionsExcel: async (params) => {
                    const exportService = require('../services/exportService');
                    return await exportService.exportToExcel(params);
                },

                checkRecurringExpenses: async (params) => {
                    const recurringService = require('../services/recurringExpensesService');
                    return await recurringService.checkAndCreateExpenses(params);
                }
            };

            const handler = functionMapping[functionName];

            if (!handler) {
                console.warn(`Função '${functionName}' não encontrada, retornando mock`);
                return { success: false, error: 'Function not implemented' };
            }

            try {
                return await handler(params);
            } catch (error) {
                console.error(`Erro ao invocar função '${functionName}':`, error);
                throw error;
            }
        }
    };
}

/**
 * Helper para criar resposta compatível com Deno.serve
 * @param {Object} data - Dados para retornar
 * @param {Object} options - Opções de resposta
 */
function createDenoResponse(data, options = {}) {
    return {
        json: () => data,
        status: options.status || 200,
        headers: options.headers || { 'Content-Type': 'application/json' }
    };
}

module.exports = {
    createClientFromRequest,
    createDenoResponse,
    prisma
};
