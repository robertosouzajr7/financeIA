const dotenv = require('dotenv');
const result = dotenv.config({ override: true });
console.log('DOTENV RESULT:', result.parsed ? 'Loaded' : 'Error', result.error ? result.error : '');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const createCrudRoutes = require('./utils/crud');

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
// Rate limiting (DISABLED FOR TESTING)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for testing
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// app.use('/api/', limiter); // DISABLED FOR TESTING

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Increased for testing
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
app.use('/api/auth', authRoutes); // Rate limiting mais rigoroso para autenticação
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
app.use('/api/users', require('./routes/users')); // Custom routes to handle waterfall delete
app.use('/api/plans', require('./routes/plans')); // Dynamic Plans CRUD
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

// Duplicates removed

const { PrismaClient } = require('@prisma/client');
const { startWhatsAppConnection } = require('./services/whatsapp');
const { handleIncomingMessage } = require('./services/messageHandler');
const prisma = new PrismaClient();

// Auto-reconnect WhatsApp instances
async function reconnectInstances() {
  try {
    const instances = await prisma.whatsAppInstance.findMany({
      where: { status: 'connected' }
    });

    console.log(`🔄 Found ${instances.length} instances to reconnect...`);

    for (const instance of instances) {
        console.log(`🔌 Reconnecting ${instance.instance_name}...`);
        // Now we can actually reconnect properly!
        await startWhatsAppConnection(instance.id, handleIncomingMessage).catch(err => {
            console.error(`Failed to reconnect ${instance.instance_name}:`, err.message);
        });
    }
    console.log('✅ Auto-reconnect process finished.');
  } catch (error) {
    console.error('Error reconnecting instances:', error);
  }
}

app.listen(port, async () => {
  console.log(`🚀 FinanceIA Backend rodando na porta ${port}`);
  console.log(`📡 Health check: http://localhost:${port}/health`);
  await reconnectInstances();
});
