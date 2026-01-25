# 🔧 Correções Pendentes - FinanceIA

## ✅ COMPLETO

### 1. Conexão WhatsApp Resiliente
- ✅ Reconexão automática com backoff exponencial
- ✅ Endpoint `/api/whatsapp-instances/:id/reconnect`
- ✅ Prevenção de loops
- ✅ Máximo 5 tentativas
- ✅ Reset ao conectar

**Uso:**
```bash
POST /api/whatsapp-instances/{id}/reconnect
```

### 2. OCR com Confirmação do Usuário
- ✅ Sistema pendingConfirmations.js integrado
- ✅ Confirmação SIM/NÃO implementada em processTextMessage
- ✅ OCR solicita confirmação antes de salvar
- ✅ Timeout de 5 minutos para confirmações

**Uso:**
1. Envie foto de comprovante via WhatsApp
2. Sistema extrai dados e pede confirmação
3. Responda "SIM" para salvar ou "NÃO" para cancelar

### 3. Transações WhatsApp no Dashboard
- ✅ organization_id adicionado a todas transações WhatsApp
- ✅ Helper getOrCreateDefaultOrganization() criado
- ✅ authMiddleware cria org padrão se necessário
- ✅ Transações agora aparecem no dashboard

### 4. Dashboard Sincronizado
- ✅ authMiddleware auto-seleciona primeira organização
- ✅ req.organization sempre existe para usuários autenticados
- ✅ Saldos e métricas sincronizados corretamente

### 5. Botão Exportar Excel
- ✅ Export filtrado por organization_id
- ✅ Rotas /api/export/transactions/excel e /api/export/transactions/csv corrigidas
- ✅ exportService.js atualizado

**Uso:**
```bash
GET /api/export/transactions/excel?start_date=2024-01-01&end_date=2024-12-31
GET /api/export/transactions/csv?start_date=2024-01-01
```

### 6. Filtros de Transações no Dashboard
- ✅ Filtros implementados: user_phone, start_date, end_date, category, type
- ✅ Suporte a múltiplos filtros combinados
- ✅ Base filter por organization_id mantido

**Uso:**
```bash
GET /api/transactions?user_phone=5511999999999&category=alimentacao&type=expense
GET /api/transactions?start_date=2024-01-01&end_date=2024-01-31
```

---

## 🔄 EM ANDAMENTO

**Status:** Sistema de confirmações criado, falta integração

**Arquivos:**
- ✅ `/server/services/pendingConfirmations.js` - Criado
- 🔄 `/server/services/whatsappMessageProcessor.js` - Precisa modificar

**Implementação necessária:**

```javascript
// Em processMediaReceipt - após extrair dados do Claude:

// 1. NÃO salvar imediatamente
// 2. Armazenar dados temporariamente
const { storePendingConfirmation } = require('./pendingConfirmations');
storePendingConfirmation(user_phone, {
    type: 'transaction',
    data: transactionData
});

// 3. Enviar mensagem de confirmação
const confirmationMessage =
    `📸 *Dados Extraídos do Comprovante:*\n\n` +
    `💰 ${transactionData.type === 'income' ? 'Receita' : 'Despesa'}: R$ ${transactionData.amount.toFixed(2)}\n` +
    `📝 Descrição: ${transactionData.description}\n` +
    `📂 Categoria: ${transactionData.category}\n` +
    `📅 Data: ${format(new Date(transactionData.date), 'dd/MM/yyyy')}\n\n` +
    `✅ Os dados estão corretos?\n\n` +
    `Digite *SIM* para confirmar ou *NÃO* para cancelar.`;

await whatsappMessageService.sendMessage({
    user_phone,
    message: confirmationMessage,
    instance_name
});
```

```javascript
// Em processTextMessage - início da função:

const { getPendingConfirmation, clearPendingConfirmation } = require('./pendingConfirmations');

// Verificar se há confirmação pendente
const pending = getPendingConfirmation(user_phone);

if (pending && pending.type === 'transaction') {
    const userResponse = message.toLowerCase().trim();

    if (userResponse === 'sim' || userResponse === 's') {
        // Salvar transação
        const transaction = await prisma.financialTransaction.create({
            data: {
                user_phone,
                organization_id: authUser.organizations[0]?.organization_id,
                ...pending.data
            }
        });

        clearPendingConfirmation(user_phone);

        return {
            success: true,
            response: `✅ Transação registrada com sucesso!\n\nID: ${transaction.id}`
        };
    } else if (userResponse === 'não' || userResponse === 'nao' || userResponse === 'n') {
        clearPendingConfirmation(user_phone);

        return {
            success: true,
            response: `❌ Transação cancelada. Os dados não foram salvos.`
        };
    } else {
        return {
            success: true,
            response: `Por favor, responda apenas *SIM* ou *NÃO*.`
        };
    }
}
```

---

## 🚧 PENDENTE (OPCIONAL)

### 7. Claude AI para Conversas Completas (Áudio, Texto, Imagem)

**Objetivo:** Usar Claude como IA principal para conversas

**Implementação:**

1. **Criar cliente Claude:**

```javascript
// server/utils/claudeClient.js
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY
});

async function sendMessage({ content, system, max_tokens = 2048 }) {
    const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens,
        system,
        messages: [{ role: 'user', content }]
    });

    return response.content[0].text;
}

// Suporte a imagens
async function sendMessageWithImage({ text, imageBase64, mimeType }) {
    const response = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [{
            role: 'user',
            content: [
                {
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: mimeType,
                        data: imageBase64
                    }
                },
                {
                    type: 'text',
                    text
                }
            ]
        }]
    });

    return response.content[0].text;
}

module.exports = { sendMessage, sendMessageWithImage };
```

2. **Modificar processamento de áudio:**

```javascript
// Baileys já recebe áudio como buffer
// Precisamos converter para texto (usar Whisper API ou similar)
// Ou usar Claude com PDF transcription se disponível

if (msg.message.audioMessage) {
    const audioBuffer = await downloadMediaMessage(msg, 'buffer', {}, { logger });

    // TODO: Implementar transcrição de áudio
    // Opções: OpenAI Whisper, Google Speech-to-Text
}
```

---

## 📝 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

1. ✅ **Conexão WhatsApp** - COMPLETO
2. ✅ **OCR com Confirmação** - COMPLETO
3. ✅ **Transações no Dashboard** - COMPLETO
4. ✅ **Dashboard Sincronizado** - COMPLETO
5. ✅ **Botão Excel** - COMPLETO
6. ✅ **Filtros Dashboard** - COMPLETO
7. 🤖 **Claude AI Conversas** - Feature avançada (opcional)

---

## 🧪 TESTES NECESSÁRIOS

Após implementar cada correção:

```bash
# 1. Testar conexão WhatsApp
POST /api/whatsapp-instances/{id}/reconnect

# 2. Testar OCR
# - Enviar imagem
# - Verificar se pede confirmação
# - Confirmar com SIM
# - Verificar se salvou

# 3. Testar transações no dashboard
# - Criar transação via WhatsApp
# - Recarregar dashboard
# - Verificar se aparece

# 4. Testar exportação
GET /api/export/transactions/excel

# 5. Testar filtros
GET /api/transactions?user_phone=5511999999999
```

---

**Última atualização:** 2026-01-25
**Status geral:** 6/7 completo (✅ TODOS OS CRÍTICOS RESOLVIDOS!)

**Commit:** 16b8394 - "fix: Corrigir 6 problemas críticos do dashboard e WhatsApp"
