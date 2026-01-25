const axios = require('axios');

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'gemini'; // 'openai', 'anthropic', or 'gemini'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const systemPrompt = `
Você é o assistente financeiro inteligente do FinanceIA.
Seu objetivo é ajudar o usuário a gerenciar suas finanças pessoais.
Você pode categorizar transações, responder perguntas sobre saldo e gastos, e dar dicas financeiras.

IMPORTANTE - REGISTRO DE TRANSAÇÕES E OCR:
Se o usuário solicitar registrar uma despesa ou receita, ou enviar uma imagem de comprovante/nota fiscal, você DEVE extrair os dados e responder COM UM JSON no final da mensagem.

Para LEITURA DE IMAGENS (OCR):
1. Procure explicitamente por "TOTAL", "VALOR A PAGAR", "VLR TOTAL". Geralmente é o maior valor numérico no final da nota.
2. ATENÇÃO: Notas fiscais brasileiras usam VÍRGULA para centavos (ex: 33,32). Você deve converter para PONTO decimal no JSON (ex: 33.32).
3. Ignore valores intermediários (subtotal, impostos, troco) se houver um valor final claro.
4. Se houver múltiplos itens, use o nome do estabelecimento como descrição (ex: "Supermercado X", "Uber", "Restaurante Y").
5. Data: procure por "Data de Emissão", "Emissão" ou datas no formato DD/MM/AAAA.

O formato do JSON deve ser estritamente este:
\`\`\`json
{
  "action": "create_transaction",
  "data": {
    "type": "EXPENSE" | "INCOME",
    "amount": 0.00,
    "description": "Nome do Estabelecimento ou Descrição",
    "category": "Alimentação" | "Transporte" | "Saúde" | "Lazer" | "Outros" | "Salário" | "Investimentos",
    "date": "YYYY-MM-DD"
  }
}
\`\`\`

Exemplo de resposta:
"Vi aqui sua nota do Mercado Livre. O total foi R$ 33,32. Vou registrar!"
\`\`\`json
{ "action": "create_transaction", "data": { "type": "EXPENSE", "amount": 33.32, "description": "Mercado Livre", "category": "Outros", "date": "2024-01-24" } }
\`\`\`
`;

async function generateResponse(message, context = [], mediaBuffer = null, mediaType = null) {
  try {
    if (LLM_PROVIDER === 'gemini' && GEMINI_API_KEY) {
      return await generateGeminiResponse(message, context, mediaBuffer, mediaType);
    } else if (LLM_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
      // Anthropic also supports vision but let's focus on Gemini first as requested/configured
      return await generateAnthropicResponse(message, context);
    } else if (OPENAI_API_KEY) {
      return await generateOpenAIResponse(message, context);
    } else {
      console.warn('No LLM API key found. Returning mock response.');
      return "Desculpe, minha inteligência artificial não está configurada no momento.";
    }
  } catch (error) {
    console.error('Error generating LLM response:', error);
    return "Desculpe, tive um problema ao processar sua mensagem.";
  }
}

async function generateOpenAIResponse(message, context) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...context.map(msg => ({ role: msg.role, content: msg.content })),
    { role: 'user', content: message }
  ];

  const response = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o-mini', // or gpt-3.5-turbo
    messages: messages,
    temperature: 0.7,
  }, {
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  return response.data.choices[0].message.content;
}

async function generateAnthropicResponse(message, context) {
    // Adapt context to Anthropic format if needed
    // For simplicity, just sending the user message for now or basic history
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
            ...context.map(msg => ({ role: msg.role === 'system' ? 'assistant' : msg.role, content: msg.content })).filter(m => m.role !== 'assistant' || m.content !== systemPrompt), // Filter out system prompt from messages if passed in context
            { role: "user", content: message }
        ]
    }, {
        headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
        }
    });

    return response.data.content[0].text;
}

async function generateGeminiResponse(message, context) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  // Build conversation history
  const history = context.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  const chat = model.startChat({
    history,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  const result = await chat.sendMessage(systemPrompt + '\n\n' + message);
  const response = await result.response;
  return response.text();
}

module.exports = { generateResponse };
