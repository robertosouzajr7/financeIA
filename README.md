# 💰 FinanceIA - Plataforma SaaS de Gestão Financeira Pessoal com IA

FinanceIA é uma plataforma completa de gestão financeira pessoal com inteligência artificial integrada, oferecendo recursos avançados via WhatsApp, web dashboard e API RESTful.

## 🎯 Características Principais

- 📊 **Gestão Financeira Completa**: Transações, orçamentos, metas e despesas recorrentes
- 🤖 **IA Integrada**: Detecção automática de intenções e processamento de linguagem natural
- 📱 **WhatsApp 100% Nativo**: Gerenciamento via WhatsApp com Baileys (SEM APIs externas!)
- 💳 **Pagamentos Stripe**: Sistema completo de assinaturas e cobrança
- 📸 **OCR de Comprovantes**: Extração automática de dados com Claude AI (Premium)
- 🏢 **Multitenancy**: Suporte a múltiplas organizações
- 🔐 **Autenticação JWT**: Sistema seguro com bcrypt
- 📈 **Analytics**: Dashboards e relatórios avançados
- 📧 **Notificações Email**: Sistema de templates customizáveis
- 🎯 **Admin Dashboard**: Gerenciamento completo do sistema

## 🏗 Arquitetura

### Stack Tecnológica

**Frontend:**
- React 18.2.0 + Vite 6.1.0
- TailwindCSS 3.4.17 + Radix UI
- TanStack Query + React Router
- Recharts para gráficos

**Backend:**
- Node.js 20+ + Express.js 5.1.0
- Prisma ORM 5.10.0
- SQLite (dev) / PostgreSQL (prod)
- JWT Authentication + Helmet.js
- Rate Limiting

**Integrações:**
- Stripe, WhatsApp (Baileys), Google Gemini AI, Anthropic Claude, Nodemailer

## 📦 Instalação

```bash
# Clone e instale dependências
git clone <repository-url>
cd financeIA
npm install

# Backend
cd server
npm install
cp ../.env.example .env
# Edite .env com suas credenciais

# Execute migrations
npx prisma migrate dev

# (Opcional) Seed
node seed.js
```

## 🚀 Desenvolvimento

```bash
# Terminal 1 - Frontend (porta 5173)
npm run dev

# Terminal 2 - Backend (porta 3000)
cd server
node index.js
```

## 🔧 Configuração Essencial

```bash
# .env no diretório /server
DATABASE_URL="postgresql://user:pass@localhost:5432/financeia"
JWT_SECRET="seu-secret-aqui"
STRIPE_SECRET_KEY="sk_test_xxxxx"
GOOGLE_API_KEY="sua-api-key-google"

# WhatsApp não precisa de configuração! É 100% nativo via Baileys
# Apenas crie uma instância e escaneie o QR code
```

Veja `.env.example` para lista completa.

## 📚 API Principais

- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/transactions` - Listar transações
- `POST /api/whatsapp-messages/send` - Enviar WhatsApp
- `GET /api/export/transactions/excel` - Exportar Excel
- `GET /health` - Health check

> ℹ️ Endpoints de administração de planos (`/api/plans`) exigem perfil `ADMIN` na organização.

## 🔐 Segurança

✅ JWT Authentication | ✅ Bcrypt | ✅ Helmet.js | ✅ Rate Limiting | ✅ CORS | ✅ Prisma ORM

## 🚀 Deploy

```bash
# Docker
docker build -t financeia .
docker run -p 3000:3000 --env-file .env financeia

# Docker Compose
docker-compose up -d
```

Suporte para Heroku, Railway, DigitalOcean, AWS, GCP, Azure.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFeature`)
3. Commit (`git commit -m 'Add: Nova feature'`)
4. Push (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## 📄 Licença

Proprietário. Todos os direitos reservados.

## 📞 Suporte

- **Documentação Completa**: Veja `REFACTORING_PLAN.md` para detalhes técnicos
- **Issues**: GitHub Issues

---

**Desenvolvido com ❤️  pela equipe FinanceIA**
