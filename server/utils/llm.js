const axios = require('axios');

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'gemini'; // 'openai', 'anthropic', or 'gemini'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const systemPrompt = `
Você é o assistente financeiro inteligente do FinanceIA.
Seu objetivo é ajudar o usuário a gerenciar suas finanças pessoais.
Você pode categorizar transações, responder perguntas sobre saldo e gastos, e dar dicas financeiras.
Sempre responda de forma concisa e amigável.
Se o usuário enviar uma imagem, extraia os dados da transação (valor, data, descrição, categoria).
`;

async function generateResponse(message, context = []) {
  try {
    if (LLM_PROVIDER === 'gemini' && GEMINI_API_KEY) {
      return await generateGeminiResponse(message, context);
    } else if (LLM_PROVIDER === 'anthropic' && ANTHROPIC_API_KEY) {
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
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
