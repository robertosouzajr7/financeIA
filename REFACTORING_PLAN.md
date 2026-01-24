# 📋 PLANO DE REFATORAÇÃO - FinanceIA SaaS

## 🎯 OBJETIVO
Remover completamente todas as dependências do Base44 e tornar o FinanceIA um SaaS independente, escalável e seguro.

---

## 📊 ANÁLISE ATUAL

### ✅ O que já está pronto (MIGRADO)
- ✅ **Frontend completo** (React + Vite + Tailwind + Radix UI)
- ✅ **Backend Express.js** com API REST
- ✅ **Autenticação JWT** funcionando
- ✅ **Prisma ORM** com 14 modelos de dados
- ✅ **Stripe Integration** (webhooks funcionando)
- ✅ **WhatsApp via Baileys** (conexões funcionando)
- ✅ **Multitenancy** (Organizations)
- ✅ **Dashboard administrativo**

### ❌ O que ainda depende do Base44 (PRECISA MIGRAR)

#### **15 Funções Serverless em /functions/ (Runtime Deno)**

| Função | Uso do Base44 SDK | Complexidade | Prioridade |
|--------|------------------|--------------|------------|
| **processWhatsAppMessage.ts** | `auth.me()`, `entities.*`, `functions.invoke()`, `InvokeLLM()` | 🔴 ALTA | 🔥 CRÍTICA |
| **sendWhatsAppMessage.ts** | `auth.me()`, `entities.WhatsAppInstance`, `entities.ConversationMessage` | 🟡 MÉDIA | 🔥 CRÍTICA |
| **whatsappWebhook.ts** | `functions.invoke('processWhatsAppMessage')` | 🟢 BAIXA | 🔥 CRÍTICA |
| **stripeWebhook.ts** | `entities.Subscription` | 🟡 MÉDIA | 🔥 CRÍTICA |
| **createCheckout.ts** | `auth.me()`, `entities.Subscription` | 🟡 MÉDIA | 🔥 CRÍTICA |
| **createEvolutionInstance.ts** | `auth.me()`, `entities.WhatsAppInstance` | 🟡 MÉDIA | 🟠 ALTA |
| **checkInstanceConnection.ts** | `entities.WhatsAppInstance` | 🟢 BAIXA | 🟠 ALTA |
| **setupWebhook.ts** | `entities.WhatsAppInstance` | 🟢 BAIXA | 🟠 ALTA |
| **checkWebhookConfig.ts** | `entities.WhatsAppInstance` | 🟢 BAIXA | 🟠 ALTA |
| **testWebhookConnection.ts** | `entities.WhatsAppInstance` | 🟢 BAIXA | 🟡 MÉDIA |
| **testWhatsAppMessage.ts** | `functions.invoke('sendWhatsAppMessage')` | 🟢 BAIXA | 🟡 MÉDIA |
| **resetWebhook.ts** | `entities.WhatsAppInstance` | 🟢 BAIXA | 🟡 MÉDIA |
| **exportTransactionsExcel.ts** | `entities.FinancialTransaction` | 🟡 MÉDIA | 🟡 MÉDIA |
| **sendCustomEmail.ts** | `integrations.Core.SendEmail` | 🟡 MÉDIA | 🟡 MÉDIA |
| **checkRecurringExpenses.ts** | `entities.RecurringExpense`, `entities.FinancialTransaction` | 🟡 MÉDIA | 🟡 MÉDIA |

### 🔍 Padrões usados no Base44 SDK

```typescript
// 1. Autenticação
const base44 = createClientFromRequest(req);
const user = await base44.auth.me();
const isAuthenticated = await base44.auth.isAuthenticated();

// 2. Acesso a dados (CRUD)
await base44.asServiceRole.entities.{Entity}.list()
await base44.asServiceRole.entities.{Entity}.filter({ field: value })
await base44.asServiceRole.entities.{Entity}.create({ data })
await base44.asServiceRole.entities.{Entity}.update(id, { data })
await base44.asServiceRole.entities.{Entity}.delete(id)

// 3. Invocar outras functions
await base44.asServiceRole.functions.invoke('functionName', { params })

// 4. Integrações
await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt, ... })
await base44.asServiceRole.integrations.Core.SendEmail({ to, subject, body })
```

---

## 🛠 ESTRATÉGIA DE MIGRAÇÃO

### **Fase 1: Infraestrutura Base (1-2 dias)**
1. ✅ Criar helpers para substituir SDK do Base44
2. ✅ Implementar sistema de invocação de LLM (já existe em `/server/utils/llm.js`)
3. ✅ Implementar sistema de envio de email (usar Nodemailer/Resend)
4. ✅ Criar middleware de autenticação unificado

### **Fase 2: Migração das Funções Críticas (2-3 dias)**

#### **2.1 WhatsApp Core (CRÍTICO)**
- [ ] Migrar `sendWhatsAppMessage.ts` → `/server/routes/whatsapp-messages.js`
- [ ] Migrar `processWhatsAppMessage.ts` → `/server/services/whatsappMessageProcessor.js`
- [ ] Migrar `whatsappWebhook.ts` → `/server/routes/webhook.js` (já existe, atualizar)
- [ ] Adicionar salvamento de `ConversationMessage` no Prisma

#### **2.2 Stripe/Billing (CRÍTICO)**
- [ ] Migrar `stripeWebhook.ts` → `/server/routes/webhook.js` (já implementado parcialmente)
- [ ] Migrar `createCheckout.ts` → `/server/routes/billing.js`
- [ ] Testar fluxo completo de checkout

#### **2.3 Evolution API Management (ALTA)**
- [ ] Migrar `createEvolutionInstance.ts` → `/server/routes/whatsapp-instances.js`
- [ ] Migrar `checkInstanceConnection.ts` → `/server/services/whatsapp.js`
- [ ] Migrar `setupWebhook.ts`, `checkWebhookConfig.ts`, `resetWebhook.ts`

#### **2.4 Utilitários (MÉDIA)**
- [ ] Migrar `exportTransactionsExcel.ts` → `/server/routes/export.js`
- [ ] Migrar `sendCustomEmail.ts` → `/server/services/emailService.js`
- [ ] Migrar `checkRecurringExpenses.ts` → `/server/services/recurringExpensesService.js`
- [ ] Criar cron job para despesas recorrentes

### **Fase 3: Limpeza e Otimização (1 dia)**
- [ ] Remover diretório `/functions/`
- [ ] Remover `@base44/sdk` de todas as dependências
- [ ] Atualizar `package.json` (remover nome "base44-app")
- [ ] Atualizar documentação

### **Fase 4: Melhorias de Segurança (2-3 dias)**
- [ ] Implementar rate limiting (express-rate-limit)
- [ ] Adicionar Helmet.js para headers de segurança
- [ ] Implementar validação de inputs (Zod/Joi)
- [ ] Configurar CORS apropriadamente
- [ ] Implementar CSRF protection
- [ ] Adicionar sanitização de dados
- [ ] Implementar audit logs
- [ ] Configurar CSP (Content Security Policy)

### **Fase 5: Escalabilidade (3-4 dias)**
- [ ] Migrar SQLite → PostgreSQL
- [ ] Implementar Redis para cache e sessions
- [ ] Implementar job queue (Bull/BullMQ)
- [ ] Adicionar connection pooling
- [ ] Implementar horizontal scaling ready
- [ ] Configurar health checks
- [ ] Implementar graceful shutdown

### **Fase 6: Observabilidade (2 dias)**
- [ ] Logs estruturados (Winston/Pino)
- [ ] Implementar APM (Application Performance Monitoring)
- [ ] Configurar error tracking (Sentry)
- [ ] Implementar métricas (Prometheus)
- [ ] Dashboard de monitoring
- [ ] Alertas automáticos

### **Fase 7: Qualidade e Testes (3-4 dias)**
- [ ] Configurar Jest para testes
- [ ] Testes unitários (80%+ coverage)
- [ ] Testes de integração (API endpoints)
- [ ] Testes E2E (Playwright/Cypress)
- [ ] Testes de carga (k6/Artillery)
- [ ] Testes de segurança (OWASP ZAP)

### **Fase 8: DevOps e CI/CD (2-3 dias)**
- [ ] Dockerfile otimizado (multi-stage build)
- [ ] Docker Compose para desenvolvimento
- [ ] GitHub Actions para CI/CD
- [ ] Automated testing pipeline
- [ ] Automated deployment
- [ ] Rollback automático em falhas
- [ ] Configuração de ambientes (dev/staging/prod)

### **Fase 9: Documentação (2 dias)**
- [ ] OpenAPI/Swagger para API
- [ ] README completo
- [ ] Guia de instalação
- [ ] Guia de deploy (AWS/GCP/Azure/DigitalOcean)
- [ ] Guia de contribuição
- [ ] Documentação de arquitetura
- [ ] Runbooks operacionais

### **Fase 10: Novas Funcionalidades SaaS (5-7 dias)**
- [ ] Sistema de convites para organizações
- [ ] Webhooks customizáveis para clientes
- [ ] API pública com rate limiting por plano
- [ ] Sistema de templates personalizáveis
- [ ] Relatórios avançados (PDF/Excel)
- [ ] Dashboard de analytics para admins
- [ ] Sistema de notificações multi-canal
- [ ] Integração com Open Banking
- [ ] Machine Learning para previsões financeiras
- [ ] Mobile app (React Native/Flutter)

---

## 🔐 MELHORIAS DE SEGURANÇA PROPOSTAS

### **1. Autenticação e Autorização**
```javascript
// Implementar:
- ✅ JWT com refresh tokens
- 🔄 OAuth2 (Google, Microsoft, GitHub)
- 🔄 2FA (TOTP/SMS)
- 🔄 Rate limiting por usuário
- 🔄 Password policies (mínimo 12 caracteres, complexidade)
- 🔄 Account lockout após tentativas falhas
- 🔄 Session management (logout all devices)
```

### **2. Proteção de Dados**
```javascript
// Implementar:
- 🔄 Encryption at rest (para dados sensíveis)
- ✅ Encryption in transit (HTTPS obrigatório)
- 🔄 Data masking para logs
- 🔄 PII (Personal Identifiable Information) protection
- 🔄 GDPR compliance tools (data export, right to be forgotten)
```

### **3. Proteção de API**
```javascript
// Implementar:
- 🔄 Rate limiting global e por endpoint
- 🔄 API key management
- 🔄 IP whitelisting (para webhooks)
- 🔄 Request validation (Zod schemas)
- 🔄 SQL injection protection (via Prisma)
- 🔄 XSS protection
- 🔄 CSRF tokens
```

### **4. Monitoring de Segurança**
```javascript
// Implementar:
- 🔄 Failed login attempts monitoring
- 🔄 Suspicious activity detection
- 🔄 Audit logs completos
- 🔄 Alertas de segurança
- 🔄 Vulnerability scanning automático
```

---

## 🚀 NOVAS FUNCIONALIDADES PROPOSTAS

### **1. Gestão Financeira Avançada**
- [ ] Categorização automática via ML
- [ ] Detecção de fraudes
- [ ] Previsão de gastos (forecasting)
- [ ] Análise de padrões de consumo
- [ ] Sugestões de economia baseadas em IA
- [ ] Comparação com benchmarks do setor

### **2. Integrações Financeiras**
- [ ] Open Banking (Pluggy, Belvo)
- [ ] Importação de extratos bancários
- [ ] Sincronização com cartões de crédito
- [ ] Integração com bancos digitais (Nubank, Inter, etc)
- [ ] Conciliação bancária automática
- [ ] Pagamentos via PIX

### **3. Recursos Colaborativos**
- [ ] Orçamentos compartilhados (família/empresa)
- [ ] Aprovações de despesas (workflow)
- [ ] Comentários em transações
- [ ] Notificações em tempo real
- [ ] Activity feed

### **4. Relatórios e Dashboards**
- [ ] Relatórios customizáveis
- [ ] Exportação em múltiplos formatos (PDF, Excel, CSV)
- [ ] Gráficos interativos avançados
- [ ] Comparativos mensais/anuais
- [ ] KPIs financeiros
- [ ] Dashboards por organização

### **5. Automação e Inteligência**
- [ ] Regras de automação (IFTTT-style)
- [ ] Smart alerts contextuais
- [ ] Assistente IA via voz
- [ ] Análise de contratos via OCR
- [ ] Recomendações personalizadas

### **6. Mobile e Omnichannel**
- [ ] App nativo iOS/Android
- [ ] Widget para home screen
- [ ] Apple Watch / Wear OS
- [ ] Telegram bot
- [ ] Slack integration
- [ ] Email reports automáticos

### **7. Marketplace e Extensibilidade**
- [ ] Webhooks para desenvolvedores
- [ ] API pública documentada
- [ ] SDKs (JavaScript, Python, Go)
- [ ] Marketplace de plugins
- [ ] Templates de relatórios compartilháveis
- [ ] Integrações com Zapier/Make

### **8. Enterprise Features**
- [ ] SSO (Single Sign-On)
- [ ] SAML 2.0
- [ ] Role-based access control (RBAC)
- [ ] Audit logs completos
- [ ] SLA customizável
- [ ] Suporte dedicado
- [ ] White-label option

---

## 📐 ARQUITETURA PROPOSTA (PÓS-REFATORAÇÃO)

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  React 18 + Vite + Tailwind + Radix UI + TanStack Query    │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY / NGINX                      │
│            (Rate Limiting, SSL, Load Balancing)             │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND (Express.js)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   Business   │  │   External   │      │
│  │  Middleware  │  │    Logic     │  │  Integrations│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
         ↕                    ↕                    ↕
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │  Job Queue   │
│   (Primary)  │    │   (Cache)    │    │  (BullMQ)    │
└──────────────┘    └──────────────┘    └──────────────┘
                            ↕
            ┌───────────────────────────────┐
            │    External Services          │
            │  - Stripe (Payments)          │
            │  - WhatsApp (Baileys)         │
            │  - Google AI (LLM)            │
            │  - Resend/SendGrid (Email)    │
            │  - S3/Cloudinary (Storage)    │
            │  - Sentry (Error Tracking)    │
            └───────────────────────────────┘
```

---

## 📦 STACK TECNOLÓGICA FINAL

### **Frontend**
- React 18.2.0
- Vite 6.1.0
- TailwindCSS 3.4.17
- Radix UI (component library)
- TanStack Query 5.84.1 (data fetching)
- React Router 6.26.0
- Recharts (gráficos)
- Zod (validação)

### **Backend**
- Node.js 20 LTS
- Express.js 5.1.0
- Prisma 5.10.0 (ORM)
- PostgreSQL 16
- Redis 7
- BullMQ (job queue)

### **Autenticação**
- JWT (jsonwebtoken)
- Bcrypt
- Passport.js (OAuth2)

### **Integrações**
- Stripe SDK
- @whiskeysockets/baileys (WhatsApp)
- @google/generative-ai
- Nodemailer/Resend

### **DevOps**
- Docker + Docker Compose
- GitHub Actions
- PM2 (process manager)
- Nginx (reverse proxy)

### **Monitoring**
- Winston/Pino (logs)
- Sentry (errors)
- Prometheus + Grafana (metrics)

### **Testes**
- Jest
- Supertest
- Playwright
- k6 (load testing)

---

## ⏱ ESTIMATIVA DE TEMPO

| Fase | Estimativa | Prioridade |
|------|-----------|-----------|
| 1. Infraestrutura Base | 1-2 dias | 🔥 CRÍTICA |
| 2. Migração Funções Críticas | 2-3 dias | 🔥 CRÍTICA |
| 3. Limpeza e Otimização | 1 dia | 🔥 CRÍTICA |
| 4. Melhorias de Segurança | 2-3 dias | 🟠 ALTA |
| 5. Escalabilidade | 3-4 dias | 🟠 ALTA |
| 6. Observabilidade | 2 dias | 🟡 MÉDIA |
| 7. Qualidade e Testes | 3-4 dias | 🟡 MÉDIA |
| 8. DevOps e CI/CD | 2-3 dias | 🟡 MÉDIA |
| 9. Documentação | 2 dias | 🟡 MÉDIA |
| 10. Novas Funcionalidades | 5-7 dias | 🟢 BAIXA |

**TOTAL: 23-33 dias de desenvolvimento**

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ Criar este documento de planejamento
2. 🔄 Criar helpers de migração do Base44 SDK
3. 🔄 Migrar função mais crítica (processWhatsAppMessage)
4. 🔄 Testar integração WhatsApp sem Base44
5. 🔄 Migrar funções Stripe
6. 🔄 Remover dependências Base44
7. 🔄 Implementar melhorias de segurança
8. 🔄 Migrar para PostgreSQL
9. 🔄 Adicionar testes
10. 🔄 Deploy em produção

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **Backup completo** antes de qualquer mudança
- ⚠️ **Testes extensivos** em ambiente de desenvolvimento
- ⚠️ **Migração gradual** - não quebrar o que já funciona
- ⚠️ **Documentar todas as mudanças**
- ⚠️ **Manter compatibilidade** durante transição
- ⚠️ **Monitorar performance** após cada mudança

---

**Documento criado em:** 2026-01-24
**Versão:** 1.0
**Status:** EM PROGRESSO ⏳
