const axios = require('axios');

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'gemini'; // 'openai', 'anthropic', or 'gemini'
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const systemPrompt = `
Você é um Analista Financeiro Pessoal Expert do FinanceIA.
Você tem acesso TOTAL aos dados financeiros do usuário (fornecidos no contexto da mensagem).

SEU OBJETIVO:
1. Analisar os dados fornecidos (saldo, gastos por categoria, histórico recente).
2. Ser PROATIVO: Se o usuário estiver gastando muito em "Lazer" ou se o saldo estiver negativo, ALERTE-O.
3. Responder perguntas sobre "quanto gastei?", "qual meu saldo?", "posso comprar isso?" com base nos DADOS REAIS que você recebeu.
4. Categorizar novas transações de forma inteligente.

NÃO INVENTE DADOS. Use estritamente o resumo financeiro fornecido no início de cada prompt.

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
\`\`\`
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

Para EXCLUSÃO DE TRANSAÇÃO:
Se o usuário pedir para "deletar a última", "apagar o último registro" ou "desfazer", responda com:
\`\`\`json
{
  "action": "delete_transaction",
  "data": {
     "target": "last"
  }
}
\`\`\`
Não confirme a exclusão no texto antes da ação ser processada, diga algo como "Vou apagar o último registro para você."

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
      return await generateAnthropicResponse(message, context, mediaBuffer, mediaType);
    } else if (OPENAI_API_KEY) {
      return await generateOpenAIResponse(message, context);
    } else {
      console.warn('No LLM API key found. Returning mock response.');
      return "Desculpe, minha inteligência artificial não está configurada no momento.";
    }
  } catch (error) {
    console.error('Error generating LLM response:', error?.response?.data || error.message);
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

async function generateAnthropicResponse(message, context, mediaBuffer = null, mediaType = null) {
    // Construct the user message content
    const userContent = [];
    
    // Add image if present
    if (mediaBuffer && mediaType) {
        userContent.push({
            type: "image",
            source: {
                type: "base64",
                media_type: mediaType,
                data: mediaBuffer.toString('base64')
            }
        });
    }

    // Add text message (always last for good practice, though Claude parses it fine)
    userContent.push({
        type: "text",
        text: message
    });

    const messages = [
        ...context.map(msg => ({ 
            role: msg.role === 'system' ? 'assistant' : msg.role, 
            content: msg.content 
        })).filter(m => m.role !== 'assistant' || m.content !== systemPrompt),
        { 
            role: "user", 
            content: userContent // Can be array of blocks
        }
    ];

    console.log('Using Anthropic Claude...');

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: "claude-3-haiku-20240307", // Fast and cheap, supports vision
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages
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
  const { GoogleGenerativeAI } = require('@google/genai');

  const genAI = new GoogleGenerativeAI({
    apiKey: GEMINI_API_KEY,
  });

  // Use Gemini 2.5 Flash - supports text, images, and audio
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

// ... existing exports
async function transcribeAudio(audioBuffer, audioType = 'audio/mp3') {
  try {
    if (!GEMINI_API_KEY) {
      console.warn('⚠️ No GEMINI_API_KEY found for audio transcription.');
      return null;
    }

    const { GoogleGenerativeAI } = require('@google/genai');
    const genAI = new GoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
    });

    // Using official Gemini 2.5 Flash - supports audio, image, and text
    // NOTE: The legacy @google/generative-ai SDK was deprecated in Aug 2025
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Convert buffer to base64
    const audioBase64 = audioBuffer.toString('base64');

    // Mime type normalization (WhatsApp usa audio/ogg; codecs=opus)
    let mimeType = audioType;

    // Normalizar mime types comuns
    if (audioType.includes('ogg')) {
      mimeType = 'audio/ogg';
    } else if (audioType.includes('mpeg') || audioType.includes('mp3')) {
      mimeType = 'audio/mpeg';
    } else if (audioType.includes('wav')) {
      mimeType = 'audio/wav';
    } else if (audioType.includes('webm')) {
      mimeType = 'audio/webm';
    } else if (audioType.includes('mp4')) {
      mimeType = 'audio/mp4';
    }

    console.log(`🎤 Transcribing audio with Gemini 2.5 Flash (type: ${mimeType})...`);

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: mimeType,
          data: audioBase64
        }
      },
      { text: "Transcreva este áudio em português brasileiro. Retorne APENAS o texto transcrito, sem comentários adicionais." }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log('✅ Audio Transcription successful:', text.substring(0, 100) + '...');
    return text;

  } catch (error) {
    console.error('❌ Error transcribing audio:', error.message);

    // Log detalhado do erro para debug
    if (error.response) {
      console.error('Gemini API Error:', JSON.stringify(error.response, null, 2));
    }

    return null;
  }
}

module.exports = { generateResponse, transcribeAudio };
