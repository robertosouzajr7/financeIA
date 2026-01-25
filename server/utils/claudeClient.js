/**
 * Claude AI Client
 *
 * Cliente unificado para todas interações com Claude AI
 */

const axios = require('axios');

class ClaudeClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseURL = 'https://api.anthropic.com/v1';
        this.model = 'claude-3-5-sonnet-20241022';
    }

    /**
     * Enviar mensagem de texto para Claude
     */
    async sendTextMessage({ prompt, system = null, maxTokens = 2048 }) {
        try {
            const payload = {
                model: this.model,
                max_tokens: maxTokens,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            };

            if (system) {
                payload.system = system;
            }

            const response = await axios.post(`${this.baseURL}/messages`, payload, {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            });

            return response.data.content[0].text;
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem para Claude:', error.message);
            throw error;
        }
    }

    /**
     * Enviar mensagem com imagem
     */
    async sendMessageWithImage({ text, imageBase64, mediaType = 'image/jpeg', maxTokens = 2048 }) {
        try {
            const response = await axios.post(`${this.baseURL}/messages`, {
                model: this.model,
                max_tokens: maxTokens,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'image',
                                source: {
                                    type: 'base64',
                                    media_type: mediaType,
                                    data: imageBase64
                                }
                            },
                            {
                                type: 'text',
                                text: text
                            }
                        ]
                    }
                ]
            }, {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            });

            return response.data.content[0].text;
        } catch (error) {
            console.error('❌ Erro ao processar imagem com Claude:', error.message);
            throw error;
        }
    }

    /**
     * Extrair dados de comprovante financeiro
     */
    async extractReceiptData(imageBase64, mediaType = 'image/jpeg') {
        const prompt = `Analise este comprovante financeiro e extraia os seguintes dados em formato JSON:

- type: "income" ou "expense"
- amount: valor numérico em reais
- description: descrição da transação
- category: uma das categorias: moradia, alimentacao, transporte, saude, educacao, familia, lazer, dividas, investimentos, outros
- date: data no formato YYYY-MM-DD (se não houver data, use a data de hoje)

IMPORTANTE: Responda APENAS com o JSON, sem nenhum texto adicional.

Exemplo de resposta:
{"type": "expense", "amount": 150.50, "description": "Supermercado Pão de Açúcar", "category": "alimentacao", "date": "2024-01-15"}`;

        try {
            const response = await this.sendMessageWithImage({
                text: prompt,
                imageBase64,
                mediaType,
                maxTokens: 1024
            });

            // Tentar extrair JSON da resposta
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return JSON.parse(response);
        } catch (error) {
            console.error('❌ Erro ao extrair dados do comprovante:', error.message);
            throw error;
        }
    }

    /**
     * Conversar sobre finanças com contexto
     */
    async chatAboutFinances({ message, financialContext, conversationHistory = [] }) {
        const systemPrompt = `Você é o FinanceIA, um assistente financeiro pessoal via WhatsApp.

CONTEXTO FINANCEIRO DO USUÁRIO:
${financialContext}

REGRAS:
1. Seja amigável e use linguagem casual
2. Respostas curtas e diretas (máximo 4-5 linhas)
3. Use emojis moderadamente (1-2 por mensagem)
4. Foque em insights práticos e acionáveis
5. Se o usuário pedir para criar transação/orçamento/meta, instrua a usar comandos específicos
6. Sempre responda em português brasileiro`;

        const messages = [];

        // Adicionar histórico de conversa se houver
        if (conversationHistory.length > 0) {
            conversationHistory.forEach(msg => {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            });
        }

        // Adicionar mensagem atual
        messages.push({
            role: 'user',
            content: message
        });

        try {
            const response = await axios.post(`${this.baseURL}/messages`, {
                model: this.model,
                max_tokens: 1024,
                system: systemPrompt,
                messages: messages
            }, {
                headers: {
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                }
            });

            return response.data.content[0].text;
        } catch (error) {
            console.error('❌ Erro ao conversar com Claude:', error.message);
            throw error;
        }
    }

    /**
     * Analisar áudio (preparado para futura integração com Whisper ou similar)
     */
    async transcribeAudio(audioBase64) {
        // Por enquanto, retorna mensagem instruindo o usuário a usar texto
        // TODO: Integrar com Whisper API ou similar quando disponível
        throw new Error('Transcrição de áudio não implementada ainda. Use a API do Whisper da OpenAI ou similar.');
    }

    /**
     * Detectar intenção do usuário
     */
    async detectIntent(message) {
        const prompt = `Você é um assistente que identifica se uma mensagem do usuário requer alguma ação no sistema financeiro.

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

        try {
            const response = await this.sendTextMessage({
                prompt,
                maxTokens: 512
            });

            // Tentar extrair JSON da resposta
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }

            return JSON.parse(response);
        } catch (error) {
            console.error('❌ Erro ao detectar intenção:', error.message);
            return { action: 'query' }; // Fallback para query
        }
    }
}

module.exports = ClaudeClient;
