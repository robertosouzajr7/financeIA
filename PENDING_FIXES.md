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

---

## 🔄 EM ANDAMENTO

### 2. OCR com Confirmação do Usuário

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

## 🚧 PENDENTE

### 3. Claude AI para Conversas (Áudio, Texto, Imagem)

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

### 4. Transações WhatsApp no Dashboard

**Problema:** Transações criadas via WhatsApp não aparecem no dashboard

**Investigação necessária:**

1. Verificar se `organization_id` está sendo salvo corretamente:

```javascript
// Ao criar transação via WhatsApp:
const transaction = await prisma.financialTransaction.create({
    data: {
        user_phone,
        organization_id: authUser.organizations[0]?.organization_id, // VERIFICAR ISSO!
        description,
        amount,
        date,
        category,
        type,
        // ...
    }
});
```

2. Verificar query do dashboard:

```javascript
// Frontend deve filtrar por organization_id
const transactions = await prisma.financialTransaction.findMany({
    where: {
        organization_id: currentOrganizationId // VERIFICAR FILTRO!
    }
});
```

**Correção:**

```javascript
// Em whatsappMessageProcessor.js - ao criar transação:

// Garantir que organization_id seja sempre preenchido
const organizationId = authUser.organizations[0]?.organization_id ||
                       await getDefaultOrganization(authUser.id);

const transaction = await prisma.financialTransaction.create({
    data: {
        user_phone,
        organization_id: organizationId, // SEMPRE preencher
        description: actionDetection.description || "Transação via WhatsApp",
        amount: actionDetection.amount,
        date: new Date().toISOString().split('T')[0],
        category: actionDetection.category || "outros",
        type: actionDetection.type,
        is_recurring: false,
        priority: "medium",
        source: "whatsapp", // Marcar origem
        notes: `Criado via WhatsApp: ${message}`
    }
});

// Helper function
async function getDefaultOrganization(userId) {
    let org = await prisma.organization.findFirst({
        where: {
            members: {
                some: { user_id: userId }
            }
        }
    });

    if (!org) {
        // Criar organização padrão
        org = await prisma.organization.create({
            data: {
                name: 'Minha Organização',
                slug: `org-${userId}`,
                members: {
                    create: {
                        user_id: userId,
                        role: 'OWNER'
                    }
                }
            }
        });
    }

    return org.id;
}
```

---

### 5. Botão Exportar Excel

**Investigar:**
- Frontend: Qual componente chama a exportação?
- Backend: Rota `/api/export/transactions/excel` está funcionando?

**Teste backend:**
```bash
curl -X GET "http://localhost:3000/api/export/transactions/excel" \
  -H "Authorization: Bearer {token}" \
  --output teste.xlsx
```

**Possível correção frontend:**

```javascript
// No componente de transações
const handleExport = async () => {
    try {
        const response = await fetch('/api/export/transactions/excel', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transacoes_${new Date().toISOString()}.xlsx`;
        a.click();
    } catch (error) {
        console.error('Erro ao exportar:', error);
    }
};
```

---

### 6. Dashboard Dessincronizado

**Problema:** Saldos e métricas zerados mesmo com transações

**Verificar:**

1. **Backend - Rota de analytics:**

```javascript
// /server/routes/analytics.js
router.get('/', authMiddleware, async (req, res) => {
    const organization_id = req.organization?.id;

    const transactions = await prisma.financialTransaction.findMany({
        where: { organization_id } // VERIFICAR SE ESTÁ FILTRANDO!
    });

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    res.json({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: transactions.length
    });
});
```

2. **Frontend - Verificar cache:**

```javascript
// Usar TanStack Query com refetch
const { data, refetch } = useQuery({
    queryKey: ['analytics', organizationId],
    queryFn: async () => {
        const res = await fetch('/api/analytics');
        return res.json();
    },
    staleTime: 0, // Sempre buscar dados frescos
    cacheTime: 0  // Não cachear
});

// Refetch após criar transação
await createTransaction();
refetch();
```

---

### 7. Filtros por Usuário no Dashboard

**Implementação:**

1. **Backend - Adicionar filtros:**

```javascript
// /server/routes/transactions.js
router.get('/', authMiddleware, async (req, res) => {
    const { user_phone, start_date, end_date, category, type } = req.query;
    const organization_id = req.organization?.id;

    const where = { organization_id };

    if (user_phone) where.user_phone = user_phone;
    if (category) where.category = category;
    if (type) where.type = type;
    if (start_date || end_date) {
        where.date = {};
        if (start_date) where.date.gte = new Date(start_date);
        if (end_date) where.date.lte = new Date(end_date);
    }

    const transactions = await prisma.financialTransaction.findMany({
        where,
        orderBy: { date: 'desc' }
    });

    res.json(transactions);
});
```

2. **Frontend - Componente de filtros:**

```javascript
function TransactionFilters({ onFilterChange }) {
    const [filters, setFilters] = useState({
        user_phone: '',
        start_date: '',
        end_date: '',
        category: '',
        type: ''
    });

    const handleChange = (field, value) => {
        const newFilters = { ...filters, [field]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="filters">
            <select onChange={(e) => handleChange('user_phone', e.target.value)}>
                <option value="">Todos os usuários</option>
                {users.map(u => (
                    <option key={u.user_phone} value={u.user_phone}>
                        {u.user_name || u.user_phone}
                    </option>
                ))}
            </select>

            <select onChange={(e) => handleChange('type', e.target.value)}>
                <option value="">Todos os tipos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
            </select>

            <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                placeholder="Data inicial"
            />

            <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
                placeholder="Data final"
            />
        </div>
    );
}
```

---

## 📝 ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

1. ✅ **Conexão WhatsApp** - COMPLETO
2. 🔄 **OCR com Confirmação** - Integrar sistema criado
3. 🚨 **Transações no Dashboard** - CRÍTICO
4. 🚨 **Dashboard Sincronizado** - CRÍTICO
5. 🔧 **Botão Excel** - Investigar e corrigir
6. 🎨 **Filtros Dashboard** - Melhor UX
7. 🤖 **Claude AI Conversas** - Feature avançada

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
**Status geral:** 1/7 completo, 6 pendentes
