# 📱 Guia de Uso - WhatsApp 100% Nativo (Baileys)

O FinanceIA utiliza **Baileys**, uma biblioteca Node.js que se conecta diretamente ao WhatsApp Web, **SEM necessidade de APIs externas ou serviços pagos!**

## 🎯 Vantagens

✅ **100% Gratuito** - Sem custos de APIs externas
✅ **Propriedade Total** - Código completamente seu
✅ **Sem Limites** - Não há restrições de mensagens
✅ **Multi-Instância** - Múltiplos números WhatsApp simultaneamente
✅ **Persistência** - Conexões mantidas mesmo após reiniciar servidor
✅ **Recursos Completos** - Mensagens, mídias, botões, etc.

## 🚀 Como Usar

### 1. Criar uma Instância

```bash
# Via API
POST /api/whatsapp-instances
Content-Type: application/json
Authorization: Bearer {seu-token-jwt}

{
  "instance_name": "financeia-bot",
  "user_email": "seu@email.com"
}
```

**Resposta:**
```json
{
  "id": "uuid-da-instancia",
  "instance_name": "financeia-bot",
  "status": "disconnected",
  "qr_code": null
}
```

### 2. Iniciar Conexão

```bash
POST /api/whatsapp-instances/{instance_id}/start
Authorization: Bearer {seu-token-jwt}
```

**Resposta:**
```json
{
  "status": "connecting",
  "qr_code": "data:image/png;base64,..."
}
```

### 3. Escanear QR Code

1. Abra o WhatsApp no seu celular
2. Vá em **Configurações** > **Aparelhos Conectados**
3. Toque em **Conectar um aparelho**
4. Escaneie o QR code retornado pela API

### 4. Verificar Status

```bash
GET /api/whatsapp-instances/{instance_id}/qr
Authorization: Bearer {seu-token-jwt}
```

Quando conectado com sucesso, o status mudará para `"connected"`.

### 5. Enviar Mensagens

```bash
POST /api/whatsapp-messages/send
Content-Type: application/json
Authorization: Bearer {seu-token-jwt}

{
  "user_phone": "5511999999999",
  "message": "Olá! Mensagem enviada via Baileys nativo!",
  "instance_name": "financeia-bot"
}
```

## 📦 Tipos de Mensagens Suportadas

### Texto Simples
```javascript
{
  "user_phone": "5511999999999",
  "message": "Texto da mensagem"
}
```

### Mensagem com Mídia
```javascript
{
  "user_phone": "5511999999999",
  "caption": "Legenda da imagem",
  "media_buffer": Buffer,  // Buffer da imagem
  "media_type": "image"    // image, video, document, audio
}
```

### Mensagem com Botões
```javascript
{
  "user_phone": "5511999999999",
  "message": "Escolha uma opção:",
  "buttons": ["Opção 1", "Opção 2", "Opção 3"]
}
```

## 🔄 Processamento de Mensagens Recebidas

O sistema processa automaticamente mensagens recebidas através do `whatsappMessageProcessor`:

**Funcionalidades:**
- ✅ Detecção de intenções com IA
- ✅ Criação automática de transações
- ✅ Criação de orçamentos e metas
- ✅ Consultas financeiras
- ✅ OCR de comprovantes (Premium)
- ✅ Autenticação via senha
- ✅ Histórico de conversas

## 📂 Persistência de Sessões

As credenciais do WhatsApp são salvas em:
```
/server/.auth/{instance_name}/
```

**Benefícios:**
- Conexão mantida mesmo após reiniciar o servidor
- Não precisa escanear QR code novamente
- Múltiplas instâncias isoladas

## 🛠 Gerenciamento de Instâncias

### Listar Instâncias
```bash
GET /api/whatsapp-instances
Authorization: Bearer {seu-token-jwt}
```

### Parar Instância
```bash
POST /api/whatsapp-instances/{instance_id}/stop
Authorization: Bearer {seu-token-jwt}
```

### Deletar Instância
```bash
DELETE /api/whatsapp-instances/{instance_id}
Authorization: Bearer {seu-token-jwt}
```

## 🔍 Monitoramento

### Logs do Servidor
```bash
# Conexões WhatsApp
📱 QR Code generated for instance: financeia-bot
✅ WhatsApp connected for instance: financeia-bot

# Mensagens
📩 Message from 5511999999999@s.whatsapp.net: Olá!
📤 Enviando mensagem para 5511999999999
✅ Mensagem enviada com sucesso
```

### Instâncias Ativas
```javascript
const { getActiveInstances } = require('./services/whatsappMessageService');

const instances = getActiveInstances();
// [
//   {
//     id: "instance-id",
//     connected: true,
//     phone: "5511999999999"
//   }
// ]
```

## ⚙️ Configuração Avançada

### Logger
Ajuste o nível de log em `/server/services/whatsapp.js`:

```javascript
const logger = pino({ level: 'debug' }); // debug, info, warn, error, silent
```

### Browser Fingerprint
Personalize como o WhatsApp vê sua conexão:

```javascript
browser: ['FinanceIA', 'Chrome', '1.0.0']
```

### Reconexão Automática
O sistema reconecta automaticamente em caso de queda (configurado em 5 segundos).

## 🐛 Troubleshooting

### QR Code não aparece
- Verifique se a instância está no status "connecting"
- Aguarde alguns segundos após iniciar a conexão

### Desconexão frequente
- Certifique-se que a pasta `/server/.auth` tem permissões corretas
- Verifique logs do servidor para erros

### Mensagens não enviadas
- Verifique se a instância está conectada (`status: "connected"`)
- Confirme que o número está no formato correto (apenas dígitos)

### Logout inesperado
- O WhatsApp pode fazer logout se detectar uso suspeito
- Evite enviar muitas mensagens em curto período
- Respeite os limites do WhatsApp (evite spam)

## 📊 Limites e Boas Práticas

### Limites do WhatsApp
- **Não documentados oficialmente**, mas recomenda-se:
  - Máximo 30-40 mensagens por minuto por instância
  - Evitar mensagens idênticas para múltiplos contatos
  - Respeitar lista de bloqueio/spam

### Boas Práticas
1. ✅ Sempre validar números antes de enviar
2. ✅ Implementar rate limiting no lado do servidor
3. ✅ Monitorar status de conexão
4. ✅ Ter fallback para quando conexão cair
5. ✅ Salvar histórico de mensagens
6. ✅ Implementar retry para mensagens falhas

## 🔒 Segurança

### Proteção de Credenciais
- Credenciais são criptografadas pelo Baileys
- Nunca compartilhe a pasta `/server/.auth`
- Use `.gitignore` para excluir `.auth/` do controle de versão

### Validação
```javascript
// Sempre validar antes de enviar
const cleanPhone = user_phone.replace(/\D/g, '');
if (cleanPhone.length < 10 || cleanPhone.length > 15) {
  throw new Error('Número inválido');
}
```

## 📱 Multi-Instância

Você pode ter **múltiplas instâncias** simultaneamente:

```bash
# Instância 1 - Vendas
POST /api/whatsapp-instances
{
  "instance_name": "vendas-bot",
  "user_email": "vendas@empresa.com"
}

# Instância 2 - Suporte
POST /api/whatsapp-instances
{
  "instance_name": "suporte-bot",
  "user_email": "suporte@empresa.com"
}
```

Cada instância:
- ✅ Funciona independentemente
- ✅ Tem suas próprias credenciais
- ✅ Pode ser gerenciada separadamente
- ✅ Não interfere nas outras

## 🎯 Casos de Uso

### 1. Bot de Atendimento
- Respostas automáticas
- Menu interativo com botões
- Encaminhamento para atendentes

### 2. Notificações
- Alertas de gastos
- Lembretes de despesas recorrentes
- Confirmações de transações

### 3. Registro via WhatsApp
- Criar transações por mensagem de texto
- Enviar comprovantes (OCR)
- Consultar saldo e relatórios

## 📚 Recursos Adicionais

### Documentação Baileys
- [GitHub - whiskeysockets/Baileys](https://github.com/whiskeysockets/Baileys)

### Exemplo de Integração
Ver arquivo: `/server/services/whatsappMessageProcessor.js`

### Suporte
- Issues: GitHub Issues
- Documentação: `REFACTORING_PLAN.md`

---

**Desenvolvido com ❤️ pela equipe FinanceIA**
**100% Código Aberto | 100% Gratuito | 100% Seu**
