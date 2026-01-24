const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');
const createCrudRoutes = require('./utils/crud');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ===== SECURITY MIDDLEWARE =====

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false
}));

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting a todas as rotas de API
app.use('/api/', limiter);

// Stricter rate limiting para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Máximo 5 tentativas
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/auth');
const webhookRoutes = require('./routes/webhook');
const transactionRoutes = require('./routes/transactions'); // Custom logic might be needed, but could use CRUD
const functionsRoutes = require('./routes/functions');
const uploadRoutes = require('./routes/upload');
const whatsappInstancesRoutes = require('./routes/whatsapp-instances');
const whatsappMessagesRoutes = require('./routes/whatsapp-messages');
const analyticsRoutes = require('./routes/analytics');
const billingRoutes = require('./routes/billing');
const exportRoutes = require('./routes/export');

// Mount routes
app.use('/api/auth', authLimiter, authRoutes); // Rate limiting mais rigoroso para autenticação
app.use('/api/webhook', webhookRoutes);
app.use('/api/functions', functionsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/whatsapp-messages', whatsappMessagesRoutes);
app.use('/api/organizations', require('./routes/organizations'));

// CRUD Routes
app.use('/api/transactions', transactionRoutes); // Keep custom if it has specific logic
app.use('/api/users', createCrudRoutes('User')); // Note: User model name in Prisma
app.use('/api/budgets', createCrudRoutes('Budget'));
app.use('/api/goals', createCrudRoutes('Goal'));
app.use('/api/system-settings', createCrudRoutes('SystemSettings'));
app.use('/api/subscriptions', createCrudRoutes('Subscription'));
app.use('/api/knowledge-documents', createCrudRoutes('KnowledgeDocument'));
app.use('/api/alerts', createCrudRoutes('Alert'));
app.use('/api/email-templates', createCrudRoutes('EmailTemplate'));
app.use('/api/recurring-expenses', createCrudRoutes('RecurringExpense'));
app.use('/api/support-tickets', createCrudRoutes('SupportTicket'));
app.use('/api/whatsapp-instances', whatsappInstancesRoutes); // Custom Baileys route
app.use('/api/debts', createCrudRoutes('Debt'));

// Start scheduler for recurring tasks
if (process.env.ENABLE_SCHEDULER !== 'false') {
  require('./scheduler');
  console.log('📅 Scheduler ativado');
}

// Health check
app.get('/', (req, res) => {
  res.send('FinanceIA Backend is running');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(port, () => {
  console.log(`🚀 FinanceIA Backend rodando na porta ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
});
